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
  const shelf = document.querySelector(".shelf");

  for (const book of books) {
    const bookData = await searchBook(book.title, book.author);

    const bookElement = document.createElement("div");
    bookElement.className = "book";

    const coverImage = document.createElement("img");

    // Try different image sizes and use a default if none are available
    if (bookData && bookData.volumeInfo && bookData.volumeInfo.imageLinks) {
      coverImage.src =
        bookData.volumeInfo.imageLinks.large ||
        bookData.volumeInfo.imageLinks.medium ||
        bookData.volumeInfo.imageLinks.small ||
        bookData.volumeInfo.imageLinks.thumbnail ||
        "images/default-cover.jpg";
    } else {
      // Create a default cover with title and author
      coverImage.src = "images/default-cover.jpg";
      bookElement.innerHTML += `
        <div class="default-cover">
          <h3>${book.title}</h3>
          <p>${book.author}</p>
        </div>
      `;
    }

    coverImage.alt = `${book.title} cover`;
    coverImage.onerror = function () {
      this.onerror = null;
      this.src = "images/default-cover.jpg";
    };

    bookElement.appendChild(coverImage);
    bookElement.addEventListener("click", () =>
      openModal(bookData ? bookData.volumeInfo : book)
    );
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
