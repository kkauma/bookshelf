// Sample book data
const books = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    color: "#264653",
    cover: "path/to/cover1.jpg",
    description: "A story of decadence and excess...",
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    color: "#2a9d8f",
    cover: "path/to/cover2.jpg",
    description: "A dystopian social science fiction...",
  },
  // Add more books as needed
];

// Create books on the shelf
function createBookshelf() {
  const shelf = document.querySelector(".shelf");

  books.forEach((book) => {
    const bookElement = document.createElement("div");
    bookElement.className = "book";
    bookElement.style.backgroundColor = book.color;
    bookElement.setAttribute("data-id", book.id);

    // Add title on the spine
    bookElement.innerHTML = `<div class="spine-text">${book.title}</div>`;

    bookElement.addEventListener("click", () => openModal(book));
    shelf.appendChild(bookElement);
  });
}

// Modal functionality
const modal = document.getElementById("bookModal");
const closeBtn = document.querySelector(".close");

function openModal(book) {
  document.getElementById("bookTitle").textContent = book.title;
  document.getElementById("bookAuthor").textContent = `By ${book.author}`;
  document.getElementById("bookDescription").textContent = book.description;
  document.getElementById("bookCover").src = book.cover;
  modal.style.display = "block";
}

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
