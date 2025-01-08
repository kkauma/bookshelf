import { books } from "./data/books.js";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

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
  document.getElementById("bookTitle").textContent = bookInfo.title;
  document.getElementById(
    "bookAuthor"
  ).textContent = `By ${bookInfo.authors?.join(", ")}`;
  document.getElementById("bookDescription").textContent = bookInfo.description;
  document.getElementById("bookCover").src = bookInfo.imageLinks?.thumbnail;

  // Format additional info
  const additionalInfo = `
        <p><strong>Published:</strong> ${bookInfo.publishedDate || "N/A"}</p>
        <p><strong>Pages:</strong> ${bookInfo.pageCount || "N/A"}</p>
        <p><strong>Rating:</strong> ${
          bookInfo.averageRating ? `${bookInfo.averageRating}/5` : "N/A"
        }</p>
        <p><strong>Categories:</strong> ${
          bookInfo.categories?.join(", ") || "N/A"
        }</p>
    `;
  document.getElementById("additionalInfo").innerHTML = additionalInfo;

  modal.style.display = "block";

  // Reset modal position when opening
  const modalContent = modal.querySelector(".modal-content");
  modalContent.style.transform = "translate(-50%, -50%)";
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
  await createBookshelf();
});
