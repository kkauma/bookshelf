const express = require("express");
const cors = require("cors");
const path = require("path");
const { AMAZON_AFFILIATE_ID } = require("../src/config");

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());

// Set proper MIME types for JavaScript modules
app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.set("Content-Type", "application/javascript; charset=UTF-8");
  }
  next();
});

// Serve static files from the public directory
app.use(
  express.static(path.join(__dirname, "../public"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.set("Content-Type", "application/javascript; charset=UTF-8");
      }
    },
  })
);

// Also serve the data directory for modules
app.use("/data", express.static(path.join(__dirname, "../data")));

// API endpoint to get the affiliate ID
app.get("/api/config", (req, res) => {
  res.json({
    affiliateId: AMAZON_AFFILIATE_ID,
  });
});

// Handle all other routes by serving index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
