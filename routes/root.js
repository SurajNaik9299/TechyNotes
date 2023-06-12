const express = require("express");
const router = express.Router();
const path = require("path");

//Requested route is only a slash (for the regex part)
router.get('^/$|/index(.html)', (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", 'index.html'));
})

module.exports = router