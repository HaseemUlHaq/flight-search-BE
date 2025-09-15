const express = require("express");
const router = express.Router();
const {
  getAirportSuggestions,
  getAirportDetails,
  getTopAirports,
} = require("../controllers/airportController");

router.get("/suggestions", getAirportSuggestions);

module.exports = router;
