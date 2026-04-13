const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unitType: {
      type: String,
      enum: ["KG", "LITER", "PIECE", "PACK"],
      default: "PIECE",
      required: true,
    },
    unitValue: {
      type: Number,
      min: 0.01,
      default: 1,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Product", productSchema);
