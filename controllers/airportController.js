const Flight = require("../models/Flight");

exports.getAirportSuggestions = async (req, res) => {
  try {
    const { query, limit } = req.query;
    const searchLimit = parseInt(limit) || 10;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
      });
    }

    const suggestions = await Flight.aggregate([
      {
        $match: {
          $or: [
            { APT_NAME: new RegExp(query, "i") },
            { APT_ICAO: new RegExp(query, "i") },
            { STATE_NAME: new RegExp(query, "i") },
          ],
        },
      },
      {
        $group: {
          _id: "$APT_ICAO",
          name: { $first: "$APT_NAME" },
          country: { $first: "$STATE_NAME" },
          totalFlights: { $sum: "$FLT_TOT_1" },
        },
      },
      { $sort: { totalFlights: -1 } },
      { $limit: searchLimit },
    ]);

    const formattedSuggestions = suggestions.map((airport) => ({
      value: airport._id,
      label: `${airport.name} (${airport._id})`,
      country: airport.country,
      totalFlights: airport.totalFlights,
      displayText: `${airport.name}, ${airport.country}`,
    }));

    res.json({
      success: true,
      suggestions: formattedSuggestions,
    });
  } catch (error) {
    console.error("Airport suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting airport suggestions",
      error: error.message,
    });
  }
};
