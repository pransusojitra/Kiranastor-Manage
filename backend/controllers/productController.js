const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

const removeExistingImage = (imagePath) => {
  if (!imagePath) {
    return;
  }

  const absolutePath = path.join(__dirname, "..", imagePath);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
};

const getProducts = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const query = search
      ? {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        }
      : {};

    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch products", error: error.message });
  }
};

const validateProductNumbers = (purchasePrice, sellingPrice, stockQuantity) => {
  const parsedPurchase = Number(purchasePrice);
  const parsedSelling = Number(sellingPrice);
  const parsedStock = Number(stockQuantity);

  if (Number.isNaN(parsedPurchase) || parsedPurchase <= 0) {
    return { valid: false, message: "Purchase price must be a positive number." };
  }

  if (Number.isNaN(parsedSelling) || parsedSelling <= 0) {
    return { valid: false, message: "Selling price must be a positive number." };
  }

  if (parsedSelling < parsedPurchase) {
    return { valid: false, message: "Selling price cannot be less than purchase price." };
  }

  if (Number.isNaN(parsedStock)) {
    return { valid: false, message: "Stock must be numeric." };
  }

  return {
    valid: true,
    parsedPurchase,
    parsedSelling,
    parsedStock,
  };
};

const validateProductUnit = (unitType, unitValue) => {
  const allowedUnits = ["KG", "LITER", "PIECE", "PACK"];
  const safeUnitType = String(unitType || "PIECE")
    .trim()
    .toUpperCase();
  const parsedUnitValue = Number(unitValue);

  if (!allowedUnits.includes(safeUnitType)) {
    return { valid: false, message: "Unit type must be KG, LITER, PIECE, or PACK." };
  }

  if (Number.isNaN(parsedUnitValue) || parsedUnitValue <= 0) {
    return { valid: false, message: "Unit value must be a positive number." };
  }

  return {
    valid: true,
    parsedUnitType: safeUnitType,
    parsedUnitValue,
  };
};

const addProduct = async (req, res) => {
  try {
    const { name, category, purchasePrice, sellingPrice, stockQuantity, unitType, unitValue } = req.body;

    if (!name || !category || purchasePrice === undefined || sellingPrice === undefined || stockQuantity === undefined) {
      return res.status(400).json({
        message: "name, category, purchasePrice, sellingPrice and stockQuantity are required.",
      });
    }

    const check = validateProductNumbers(purchasePrice, sellingPrice, stockQuantity);
    if (!check.valid) {
      return res.status(400).json({ message: check.message });
    }

    const unitCheck = validateProductUnit(unitType, unitValue);
    if (!unitCheck.valid) {
      return res.status(400).json({ message: unitCheck.message });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      purchasePrice: check.parsedPurchase,
      sellingPrice: check.parsedSelling,
      stockQuantity: check.parsedStock,
      unitType: unitCheck.parsedUnitType,
      unitValue: unitCheck.parsedUnitValue,
      image: req.file ? `uploads/${req.file.filename}` : "",
    });

    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add product", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, purchasePrice, sellingPrice, stockQuantity, unitType, unitValue } = req.body;

    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const safePurchase = purchasePrice !== undefined ? purchasePrice : existing.purchasePrice;
    const safeSelling = sellingPrice !== undefined ? sellingPrice : existing.sellingPrice;
    const safeStock = stockQuantity !== undefined ? stockQuantity : existing.stockQuantity;
    const safeUnitType = unitType !== undefined ? unitType : existing.unitType;
    const safeUnitValue = unitValue !== undefined ? unitValue : existing.unitValue;

    const check = validateProductNumbers(safePurchase, safeSelling, safeStock);
    if (!check.valid) {
      return res.status(400).json({ message: check.message });
    }

    const unitCheck = validateProductUnit(safeUnitType, safeUnitValue);
    if (!unitCheck.valid) {
      return res.status(400).json({ message: unitCheck.message });
    }

    const payload = {
      name: name !== undefined ? String(name).trim() : existing.name,
      category: category !== undefined ? String(category).trim() : existing.category,
      purchasePrice: check.parsedPurchase,
      sellingPrice: check.parsedSelling,
      stockQuantity: check.parsedStock,
      unitType: unitCheck.parsedUnitType,
      unitValue: unitCheck.parsedUnitValue,
      image: existing.image,
    };

    if (req.file) {
      removeExistingImage(existing.image);
      payload.image = `uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    removeExistingImage(product.image);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product", error: error.message });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
