const Product = require("../models/Product");
const Invoice = require("../models/Invoice");
const Receipt = require("../models/Receipt");
const { generateInvoicePdf } = require("../utils/pdfGenerator");

const PHONE_REGEX = /^[0-9]{10}$/;
const PAYMENT_MODES = ["UPI", "CARD", "CASH", "CREDIT"];

const createCode = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const sanitizeInvoiceForClient = (invoiceDoc) => {
  const invoice = invoiceDoc.toObject ? invoiceDoc.toObject() : { ...invoiceDoc };
  delete invoice.netProfit;
  delete invoice.paymentStatus;
  return invoice;
};

const getDateRangeFilter = (query) => {
  const { date, dateFrom, dateTo } = query;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { billingDate: { $gte: start, $lte: end } };
  }

  if (dateFrom || dateTo) {
    const range = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      range.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    return { billingDate: range };
  }

  return {};
};

const createInvoice = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      paymentMode,
      items,
      gstPercentage = 0,
      discountAmount = 0,
      billingDate,
      notes = "",
    } = req.body;

    if (!customerName || !customerPhone || !paymentMode || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "customerName, customerPhone, paymentMode and at least one item are required.",
      });
    }

    if (!PHONE_REGEX.test(String(customerPhone).trim())) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
    }

    if (!PAYMENT_MODES.includes(paymentMode)) {
      return res.status(400).json({ message: "Invalid payment mode." });
    }

    const parsedGst = Number(gstPercentage);
    const parsedDiscount = Number(discountAmount);

    if (Number.isNaN(parsedGst) || parsedGst < 0) {
      return res.status(400).json({ message: "GST percentage must be numeric and non-negative." });
    }

    if (Number.isNaN(parsedDiscount) || parsedDiscount < 0) {
      return res.status(400).json({ message: "Discount amount must be numeric and non-negative." });
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const normalizedItems = [];
    let subTotal = 0;
    let grossProfit = 0;

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      const quantity = Number(item.quantity);

      if (!product) {
        return res.status(400).json({ message: `Product not found for id ${item.productId}` });
      }

      if (Number.isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: "Quantity must be greater than zero." });
      }

      if (product.stockQuantity < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const lineTotal = product.sellingPrice * quantity;
      const lineProfit = (product.sellingPrice - product.purchasePrice) * quantity;

      subTotal += lineTotal;
      grossProfit += lineProfit;

      normalizedItems.push({
        productId: product._id,
        productName: product.name,
        unitType: product.unitType || "PIECE",
        unitValue: Number(product.unitValue || 1),
        quantity,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        lineTotal,
        lineProfit,
      });
    }

    if (parsedDiscount > subTotal) {
      return res.status(400).json({ message: "Discount cannot be greater than subtotal." });
    }

    const gstAmount = (subTotal * parsedGst) / 100;
    const totalAmount = Math.max(subTotal + gstAmount - parsedDiscount, 0);
    const netProfit = grossProfit - parsedDiscount;

    await Promise.all(
      normalizedItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: -item.quantity } })
      )
    );

    const invoice = await Invoice.create({
      invoiceNumber: createCode("INV"),
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      paymentMode,
      items: normalizedItems,
      subTotal,
      gstPercentage: parsedGst,
      gstAmount,
      discountAmount: parsedDiscount,
      totalAmount,
      grossProfit,
      netProfit,
      billingDate: billingDate || Date.now(),
      paymentStatus: "APPROVED",
      notes: String(notes || "").trim(),
    });

    const receipt = await Receipt.create({
      receiptNumber: createCode("RCP"),
      invoiceId: invoice._id,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      paymentMode: invoice.paymentMode,
      subTotal: invoice.subTotal,
      gstPercentage: invoice.gstPercentage,
      gstAmount: invoice.gstAmount,
      discountAmount: invoice.discountAmount,
      totalAmount: invoice.totalAmount,
      grossProfit: invoice.grossProfit,
      netProfit: invoice.netProfit,
      status: "APPROVED",
      receiptDate: invoice.billingDate,
      notes: invoice.notes,
    });

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice: sanitizeInvoiceForClient(invoice),
      receipt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create invoice", error: error.message });
  }
};

const getInvoices = async (req, res) => {
  try {
    const query = getDateRangeFilter(req.query);
    const invoices = await Invoice.find(query).sort({ billingDate: -1, createdAt: -1 });
    return res.status(200).json(invoices.map(sanitizeInvoiceForClient));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch invoices", error: error.message });
  }
};

const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    generateInvoicePdf(invoice, process.env.STORE_NAME || "Kirana Store", res);
    return null;
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate invoice PDF", error: error.message });
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  downloadInvoicePdf,
};
