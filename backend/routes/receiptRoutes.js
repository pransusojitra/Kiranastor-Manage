const express = require("express");
const { getReceipts, updateReceipt, downloadReceiptPdf } = require("../controllers/receiptController");

const router = express.Router();

router.get("/", getReceipts);
router.put("/:id", updateReceipt);
router.get("/:id/pdf", downloadReceiptPdf);

module.exports = router;
