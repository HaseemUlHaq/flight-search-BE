const fs = require("fs");
const csv = require("csv-parser");
const Flight = require("../models/Flight");

exports.syncCSV = async (req, res) => {
  try {
    const results = [];

    fs.createReadStream("./data/flights.csv")
      .pipe(csv())
      .on("data", (row) => {
        console.log("Syncing now...");
        results.push({
          YEAR: Number(row.YEAR),
          MONTH_NUM: Number(row.MONTH_NUM),
          MONTH_MON: row.MONTH_MON,
          FLT_DATE: new Date(row.FLT_DATE),
          APT_ICAO: row.APT_ICAO,
          APT_NAME: row.APT_NAME,
          STATE_NAME: row.STATE_NAME,
          FLT_DEP_1: row.FLT_DEP_1 === "NA" ? null : Number(row.FLT_DEP_1),
          FLT_ARR_1: row.FLT_ARR_1 === "NA" ? null : Number(row.FLT_ARR_1),
          FLT_TOT_1: row.FLT_TOT_1 === "NA" ? null : Number(row.FLT_TOT_1),
          FLT_DEP_IFR_2:
            row.FLT_DEP_IFR_2 === "NA" ? null : Number(row.FLT_DEP_IFR_2),
          FLT_ARR_IFR_2:
            row.FLT_ARR_IFR_2 === "NA" ? null : Number(row.FLT_ARR_IFR_2),
          FLT_TOT_IFR_2:
            row.FLT_TOT_IFR_2 === "NA" ? null : Number(row.FLT_TOT_IFR_2),
          Pivot_Label: row["Pivot Label"],
        });
      })
      .on("end", async () => {
        try {
          await Flight.deleteMany();
          const inserted = await Flight.insertMany(results);
          res.json({
            message: "CSV data synced successfully",
            count: inserted.length,
          });
        } catch (dbError) {
          console.error("DB Insert Error:", dbError);
          res
            .status(500)
            .json({ message: "Error saving data to DB", error: dbError });
        }
      });
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: "Error syncing CSV", error });
  }
};

exports.searchFlightsAdvanced = async (req, res) => {
  try {
    const {
      departure,
      arrival,
      dateFrom,
      dateTo,
      airline,
      year,
      month,
      minDepartures,
      maxDepartures,
      page,
      limit,
      sortBy,
      sortOrder,
      country,
    } = req.query;

    const reqPage = parseInt(page) || 1;
    const reqLimit = parseInt(limit) || 20;
    const skip = (reqPage - 1) * reqLimit;

    const query = {};

    if (departure) {
      query.$or = [
        { APT_NAME: new RegExp(departure, "i") },
        { APT_ICAO: new RegExp(departure, "i") },
        { STATE_NAME: new RegExp(departure, "i") },
      ];
    }

    if (country) {
      query.STATE_NAME = new RegExp(country, "i");
    }

    if (dateFrom || dateTo) {
      query.FLT_DATE = {};
      if (dateFrom) query.FLT_DATE.$gte = new Date(dateFrom);
      if (dateTo) query.FLT_DATE.$lte = new Date(dateTo);
    }

    if (year) {
      query.YEAR = parseInt(year);
    }

    if (month) {
      if (isNaN(month)) {
        query.MONTH_MON = month.toUpperCase();
      } else {
        query.MONTH_NUM = parseInt(month);
      }
    }

    if (minDepartures || maxDepartures) {
      query.FLT_DEP_1 = {};
      if (minDepartures) query.FLT_DEP_1.$gte = parseInt(minDepartures);
      if (maxDepartures) query.FLT_DEP_1.$lte = parseInt(maxDepartures);
    }

    let sort = {};
    if (sortBy) {
      const order = sortOrder === "desc" ? -1 : 1;
      sort[sortBy] = order;
    } else {
      sort.FLT_DATE = -1;
    }

    const flights = await Flight.find(query)
      .sort(sort)
      .skip(skip)
      .limit(reqLimit)
      .lean();

    const count = await Flight.countDocuments(query);

    res.json({
      success: true,
      total: count,
      page: reqPage,
      pages: Math.ceil(count / reqLimit),
      limit: reqLimit,
      results: flights,
    });
  } catch (error) {
    console.error("Advanced flight search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching flights",
      error: error.message,
    });
  }
};

exports.getFilterOptions = async (req, res) => {
  try {
    const [years, months, countries, airports] = await Promise.all([
      Flight.distinct("YEAR"),
      Flight.distinct("MONTH_MON"),
      Flight.distinct("STATE_NAME"),
      Flight.aggregate([
        {
          $group: {
            _id: "$APT_ICAO",
            name: { $first: "$APT_NAME" },
            country: { $first: "$STATE_NAME" },
            totalFlights: { $sum: "$FLT_TOT_1" },
          },
        },
        { $sort: { totalFlights: -1 } },
        { $limit: 100 },
      ]),
    ]);

    res.json({
      success: true,
      filters: {
        years: years.sort((a, b) => b - a),
        months: months.sort(),
        countries: countries.sort(),
        airports: airports.map((airport) => ({
          icao: airport._id,
          name: airport.name,
          country: airport.country,
          totalFlights: airport.totalFlights,
        })),
      },
    });
  } catch (error) {
    console.error("Filter options error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting filter options",
      error: error.message,
    });
  }
};
