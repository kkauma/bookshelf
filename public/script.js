import { books } from "./books.js";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
let AFFILIATE_IDS = {
  amazon: "", // We'll populate this after fetching config
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

function createBookElement(book) {
  const bookElement = document.createElement("div");
  bookElement.className = "book";

  const coverImage = document.createElement("img");
  coverImage.src = book.coverUrl;
  coverImage.alt = `${book.title} cover`;
  coverImage.dataset.title = book.title;
  coverImage.dataset.author = book.author;

  // Add click event listener
  bookElement.addEventListener("click", () => showBookModal(book));

  bookElement.appendChild(coverImage);
  return bookElement;
}

async function createBookshelf() {
  const bookshelf = document.querySelector(".bookshelf");
  const booksPerShelf = 5;

  // Clear existing books first
  bookshelf.innerHTML = "";

  // Create shelves and add books
  for (let i = 0; i < books.length; i += booksPerShelf) {
    const shelf = document.createElement("div");
    shelf.className = "shelf";

    const shelfBooks = books.slice(i, i + booksPerShelf);
    for (const book of shelfBooks) {
      const bookElement = createBookElement(book);
      shelf.appendChild(bookElement);
    }
    bookshelf.appendChild(shelf);
  }

  // Fetch additional book data in the background
  fetchBookDetails();
}

async function fetchBookDetails() {
  const bookPromises = books.map(async (book) => {
    const bookData = await searchBook(book.title, book.author);
    if (bookData) {
      // Store the additional data for use in modal/details
      book.details = bookData;
      // Trigger any UI updates needed for additional data
      updateBookUI(book);
    }
    return bookData;
  });

  // Wait for all book data to be fetched
  await Promise.all(bookPromises);
}

function updateBookUI(book) {
  // Update any UI elements that depend on the additional book data
  // For example, updating hover states, adding badges, etc.
  const bookElement = document.querySelector(`img[data-title="${book.title}"]`);
  if (bookElement && book.details) {
    bookElement.parentElement.dataset.hasDetails = "true";
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

function formatRating(volumeInfo) {
  if (!volumeInfo) return "?/5";

  const rating = volumeInfo.averageRating;
  const ratingsCount = volumeInfo.ratingsCount;

  if (!rating) return "?/5";

  // Return rating with optional ratings count
  return ratingsCount ? `${rating}/5 (${ratingsCount} ratings)` : `${rating}/5`;
}

function showBookModal(book) {
  const modal = document.getElementById("bookModal");
  const title = document.getElementById("bookTitle");
  const author = document.getElementById("bookAuthor");
  const cover = document.getElementById("bookCover");
  const description = document.getElementById("bookDescription");
  const additionalInfo = document.getElementById("additionalInfo");

  // Immediately show the basic info we have
  title.textContent = book.title;
  author.textContent = book.author;
  cover.src = book.coverUrl;

  // Add additional info section
  additionalInfo.innerHTML = `
    <p><strong>Published:</strong> ${
      book.details?.volumeInfo?.publishedDate || "Loading..."
    }</p>
    <p><strong>Pages:</strong> ${
      book.details?.volumeInfo?.pageCount || "Loading..."
    }</p>
    <p><strong>Rating:</strong> ${
      book.details?.volumeInfo?.averageRating || "?"
    }/5</p>
    <a href="https://www.amazon.com/s?k=${encodeURIComponent(
      book.title + " " + book.author
    )}&tag=${AFFILIATE_IDS.amazon}" 
       class="amazon-button" 
       target="_blank"
       rel="noopener noreferrer">
      🛒 Buy on Amazon
    </a>
  `;

  // If we have additional details from API, show those
  if (book.details) {
    description.textContent =
      book.details.volumeInfo.description || "No description available.";
  } else {
    description.textContent = "Loading additional details...";
    // Fetch details if not already available
    searchBook(book.title, book.author).then((details) => {
      book.details = details;
      if (details?.volumeInfo) {
        description.textContent =
          details.volumeInfo.description || "No description available.";
        // Update the additional info with fetched data
        additionalInfo.innerHTML = `
          <p><strong>Published:</strong> ${
            details.volumeInfo.publishedDate || "N/A"
          }</p>
          <p><strong>Pages:</strong> ${
            details.volumeInfo.pageCount || "N/A"
          }</p>
          <p><strong>Rating:</strong> ${formatRating(details.volumeInfo)}</p>
          <a href="https://www.amazon.com/s?k=${encodeURIComponent(
            book.title + " " + book.author
          )}&tag=${AFFILIATE_IDS.amazon}" 
             class="amazon-button" 
             target="_blank"
             rel="noopener noreferrer">
            🛒 Buy on Amazon
          </a>
        `;
      }
    });
  }

  modal.style.display = "block";
}

// Function to create Amazon affiliate link
function createAmazonLink(title, author) {
  const searchQuery = encodeURIComponent(`${title} ${author || ""}`);
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${AFFILIATE_IDS.amazon}`;
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

// Initialize the config when the script loads
async function initializeConfig() {
  AFFILIATE_IDS.amazon = await getConfig();
}

// Call this when the script loads
initializeConfig();

// Add modal close functionality
function initializeModal() {
  const modal = document.getElementById("bookModal");
  const closeBtn = document.querySelector(".close");

  // Close on X button click
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Close on outside click
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Call this after DOM is loaded
document.addEventListener(
  "DOMContentLoaded",
  () => {
    createBookshelf();
    initializeModal();
  },
  { once: true }
);
