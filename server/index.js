require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use(cors());

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, "..")));

// API endpoint to get the affiliate ID
app.get("/api/config", (req, res) => {
  res.json({
    affiliateId: process.env.AMAZON_AFFILIATE_ID,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
