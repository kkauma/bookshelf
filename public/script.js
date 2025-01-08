import { AMAZON_AFFILIATE_ID } from "./config.js";
import { books } from "../data/books.js";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const AFFILIATE_IDS = {
  amazon: AMAZON_AFFILIATE_ID,
};

async function getConfig() {
  try {
    const response = await fetch("/api/config");
    const data = await response.json();
    return data.affiliateId;
  } catch (error) {
    console.error("Error loading config:", error);
    return "";
  }
}

async function searchBook(title, author) {
  try {
    // Make the search more specific by using both title and author
    const query = encodeURIComponent(`intitle:"${title}" inauthor:"${author}"`);
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=${query}&maxResults=1`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log(`No results found for: ${title} by ${author}`);
      return null;
    }

    // Modify the image URL to get higher resolution
    if (data.items[0].volumeInfo.imageLinks) {
      // Replace zoom=1 with zoom=3 for higher resolution
      const imageLinks = data.items[0].volumeInfo.imageLinks;
      for (let key in imageLinks) {
        imageLinks[key] = imageLinks[key]
          .replace("zoom=1", "zoom=3")
          .replace("http://", "https://");
      }
    }

    return data.items[0];
  } catch (error) {
    console.error("Error fetching book:", error);
    return null;
  }
}

async function createBookshelf() {
  const bookshelf = document.querySelector(".bookshelf");
  const booksPerShelf = 5;

  // Calculate number of shelves needed
  const numberOfShelves = Math.ceil(books.length / booksPerShelf);

  // Create only the shelves we need
  for (let i = 0; i < books.length; i += booksPerShelf) {
    const shelfBooks = books.slice(i, i + booksPerShelf);

    // Create shelf
    const shelf = document.createElement("div");
    shelf.className = "shelf";

    // Add books to this shelf
    for (const book of shelfBooks) {
      const bookData = await searchBook(book.title, book.author);
      const bookElement = document.createElement("div");
      bookElement.className = "book";

      const coverImage = document.createElement("img");
      if (bookData && bookData.volumeInfo && bookData.volumeInfo.imageLinks) {
        coverImage.src = bookData.volumeInfo.imageLinks.thumbnail;
      } else {
        coverImage.src = "images/default-cover.jpg";
      }

      coverImage.alt = `${book.title} cover`;
      bookElement.appendChild(coverImage);
      bookElement.addEventListener("click", () =>
        openModal(bookData ? bookData.volumeInfo : book)
      );
      shelf.appendChild(bookElement);
    }

    bookshelf.appendChild(shelf);
  }
}

function makeDraggable(modal) {
  const modalContent = modal.querySelector(".modal-content");
  const modalHeader = modal.querySelector(".modal-header");

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  modalHeader.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === modalHeader || e.target.parentNode === modalHeader) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, modalContent);
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
}

// Initialize draggable modal
const modal = document.getElementById("bookModal");
makeDraggable(modal);

function openModal(bookInfo) {
  const modal = document.getElementById("bookModal");
  const title = document.getElementById("bookTitle");
  const author = document.getElementById("bookAuthor");
  const description = document.getElementById("bookDescription");
  const additionalInfo = document.getElementById("additionalInfo");
  const bookCover = document.getElementById("bookCover");

  // Clear previous content
  additionalInfo.innerHTML = "";

  // Update modal content
  title.textContent = bookInfo.title;
  author.textContent = bookInfo.authors
    ? `By ${bookInfo.authors.join(", ")}`
    : "";
  description.textContent = bookInfo.description || "No description available.";

  // Update book cover image
  if (bookInfo.imageLinks?.thumbnail) {
    const imageUrl = bookInfo.imageLinks.thumbnail
      .replace("http:", "https:")
      .replace("zoom=1", "zoom=2");
    bookCover.src = imageUrl;
    bookCover.style.display = "block";
  } else {
    bookCover.style.display = "none";
  }

  // Create Amazon affiliate link
  const amazonLink = createAmazonLink(bookInfo.title, bookInfo.authors?.[0]);
  const buyButton = document.createElement("a");
  buyButton.href = amazonLink;
  buyButton.target = "_blank";
  buyButton.rel = "noopener noreferrer sponsored";
  buyButton.className = "buy-button amazon";
  buyButton.innerHTML = "🛒 Buy on Amazon";

  // Add book details
  additionalInfo.innerHTML = `
      <p><strong>Published:</strong> ${bookInfo.publishedDate || "N/A"}</p>
      <p><strong>Pages:</strong> ${bookInfo.pageCount || "N/A"}</p>
      ${
        bookInfo.averageRating
          ? `<p><strong>Rating:</strong> ${bookInfo.averageRating}/5</p>`
          : ""
      }
  `;
  additionalInfo.appendChild(buyButton);

  modal.style.display = "block";
}

// Function to create Amazon affiliate link
function createAmazonLink(title, author) {
  const searchQuery = encodeURIComponent(`${title} ${author || ""}`);
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${AMAZON_AFFILIATE_ID}`;
}

// Modal functionality
const closeBtn = document.querySelector(".close");

closeBtn.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await init();
  await createBookshelf();
});

function createAffiliateLinks(book) {
  const amazonQuery = encodeURIComponent(`${book.title} ${book.author}`);

  return {
    amazon: `https://www.amazon.com/s?k=${amazonQuery}&tag=${AFFILIATE_IDS.amazon}`,
  };
}

// Add click tracking
function trackAffiliateClick(store, bookTitle) {
  // If you're using Google Analytics
  gtag("event", "affiliate_click", {
    store: store,
    book: bookTitle,
  });
}

async function init() {
  const affiliateId = await getConfig();
  // Use affiliateId in your code
  // ... rest of your initialization code
}

init();
