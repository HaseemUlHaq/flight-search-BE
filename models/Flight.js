const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    YEAR: { type: Number, required: true, index: true },
    MONTH_NUM: { type: Number, required: true, index: true },
    MONTH_MON: { type: String, required: true },
    FLT_DATE: { type: Date, required: true, index: true },
    APT_ICAO: { type: String, required: true, index: true },
    APT_NAME: { type: String, required: true, index: true },
    STATE_NAME: { type: String, required: true, index: true },
    FLT_DEP_1: { type: Number, default: 0 },
    FLT_ARR_1: { type: Number, default: 0 },
    FLT_TOT_1: { type: Number, default: 0 },
    FLT_DEP_IFR_2: { type: Number, default: 0 },
    FLT_ARR_IFR_2: { type: Number, default: 0 },
    FLT_TOT_IFR_2: { type: Number, default: 0 },
    Pivot_Label: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: "flights",
  }
);

flightSchema.index({ APT_ICAO: 1, FLT_DATE: -1 });
flightSchema.index({ APT_NAME: "text", APT_ICAO: "text", STATE_NAME: "text" });
flightSchema.index({ YEAR: 1, MONTH_NUM: 1 });
flightSchema.index({ FLT_DEP_1: 1 });
flightSchema.index({ STATE_NAME: 1, FLT_TOT_1: -1 });

module.exports = mongoose.model("Flight", flightSchema);
