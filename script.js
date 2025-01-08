const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

async function searchBook(title) {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}?q=${title}`);
    const data = await response.json();
    return data.items[0];
  } catch (error) {
    console.error("Error fetching book:", error);
  }
}

// Example of how to use it with our bookshelf:
const books = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
  },
  {
    title: "1984",
    author: "George Orwell",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
  },
];

async function createBookshelf() {
  const shelf = document.querySelector(".shelf");

  for (const book of books) {
    const bookData = await searchBook(`${book.title} ${book.author}`);

    const bookElement = document.createElement("div");
    bookElement.className = "book";

    // Get book cover from Google Books - use larger image
    const coverImage = document.createElement("img");
    // Replace thumbnail with zoom=1 for larger image
    coverImage.src =
      bookData.volumeInfo.imageLinks?.thumbnail?.replace("zoom=1", "zoom=2") ||
      "default-cover.jpg";
    coverImage.alt = `${book.title} cover`;

    bookElement.appendChild(coverImage);
    bookElement.addEventListener("click", () => openModal(bookData.volumeInfo));
    shelf.appendChild(bookElement);
  }
}

function openModal(bookInfo) {
  document.getElementById("bookTitle").textContent = bookInfo.title;
  document.getElementById(
    "bookAuthor"
  ).textContent = `By ${bookInfo.authors?.join(", ")}`;
  document.getElementById("bookDescription").textContent = bookInfo.description;
  document.getElementById("bookCover").src = bookInfo.imageLinks?.thumbnail;

  // Add additional info
  const additionalInfo = `
        <p>Published: ${bookInfo.publishedDate}</p>
        <p>Pages: ${bookInfo.pageCount}</p>
        <p>Rating: ${bookInfo.averageRating || "N/A"}/5</p>
        <p>Categories: ${bookInfo.categories?.join(", ") || "N/A"}</p>
    `;
  document.getElementById("additionalInfo").innerHTML = additionalInfo;

  modal.style.display = "block";
}

// Modal functionality
const modal = document.getElementById("bookModal");
const closeBtn = document.querySelector(".close");

closeBtn.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// Initialize the bookshelf
createBookshelf();
