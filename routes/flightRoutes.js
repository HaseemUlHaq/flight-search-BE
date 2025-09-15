const express = require("express");
const router = express.Router();
const {
  syncCSV,
  searchFlights,
  searchFlightsAdvanced,
  getFlightStats,
  getFilterOptions,
} = require("../controllers/flightController");

router.get("/sync", syncCSV);

router.get("/search-advanced", searchFlightsAdvanced);

router.get("/filters", getFilterOptions);

module.exports = router;
