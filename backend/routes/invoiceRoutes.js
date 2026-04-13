const express = require("express");
const { createInvoice, getInvoices, downloadInvoicePdf } = require("../controllers/invoiceController");

const router = express.Router();

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id/pdf", downloadInvoicePdf);

module.exports = router;
