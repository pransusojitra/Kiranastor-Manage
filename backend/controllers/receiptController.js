const Receipt = require("../models/Receipt");
const { generateReceiptPdf } = require("../utils/pdfGenerator");

const PHONE_REGEX = /^[0-9]{10}$/;
const PAYMENT_MODES = ["UPI", "CARD", "CASH", "CREDIT"];

const getDateRangeFilter = (query) => {
  const { date, dateFrom, dateTo } = query;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { receiptDate: { $gte: start, $lte: end } };
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
    return { receiptDate: range };
  }

  return {};
};

const recalculateReceipt = (receipt, { gstPercentage, discountAmount }) => {
  const gst = gstPercentage !== undefined ? Number(gstPercentage) : receipt.gstPercentage;
  const discount = discountAmount !== undefined ? Number(discountAmount) : receipt.discountAmount;

  if (Number.isNaN(gst) || gst < 0) {
    return { ok: false, message: "GST percentage must be numeric and non-negative." };
  }
  if (Number.isNaN(discount) || discount < 0) {
    return { ok: false, message: "Discount amount must be numeric and non-negative." };
  }

  const gstAmount = (receipt.subTotal * gst) / 100;
  const totalAmount = Math.max(receipt.subTotal + gstAmount - discount, 0);
  const netProfit = receipt.grossProfit - discount;

  return {
    ok: true,
    gstPercentage: gst,
    discountAmount: discount,
    gstAmount,
    totalAmount,
    netProfit,
  };
};

const getReceipts = async (req, res) => {
  try {
    const query = getDateRangeFilter(req.query);
    const receipts = await Receipt.find(query)
      .populate("invoiceId", "invoiceNumber items billingDate")
      .sort({ receiptDate: -1 });
    return res.status(200).json(receipts);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch receipts", error: error.message });
  }
};

const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, paymentMode, gstPercentage, discountAmount, notes } = req.body;

    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (customerName !== undefined) {
      receipt.customerName = String(customerName).trim();
    }

    if (customerPhone !== undefined) {
      if (!PHONE_REGEX.test(String(customerPhone).trim())) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
      }
      receipt.customerPhone = String(customerPhone).trim();
    }

    if (paymentMode !== undefined) {
      if (!PAYMENT_MODES.includes(paymentMode)) {
        return res.status(400).json({ message: "Invalid payment mode." });
      }
      receipt.paymentMode = paymentMode;
    }

    const calc = recalculateReceipt(receipt, { gstPercentage, discountAmount });
    if (!calc.ok) {
      return res.status(400).json({ message: calc.message });
    }

    receipt.gstPercentage = calc.gstPercentage;
    receipt.discountAmount = calc.discountAmount;
    receipt.gstAmount = calc.gstAmount;
    receipt.totalAmount = calc.totalAmount;
    receipt.netProfit = calc.netProfit;

    if (notes !== undefined) {
      receipt.notes = String(notes).trim();
    }

    await receipt.save();
    return res.status(200).json(receipt);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update receipt", error: error.message });
  }
};

const downloadReceiptPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id).populate("invoiceId", "invoiceNumber items billingDate");

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=receipt-${receipt.receiptNumber}.pdf`);

    generateReceiptPdf(receipt, process.env.STORE_NAME || "Kirana Store", res);
    return null;
  } catch (error) {
    return res.status(500).json({ message: "Failed to generate receipt PDF", error: error.message });
  }
};

module.exports = {
  getReceipts,
  updateReceipt,
  downloadReceiptPdf,
};
