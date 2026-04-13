const PDFDocument = require("pdfkit");

const drawHeader = (doc, storeName, title) => {
  doc.fontSize(18).text(storeName, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(14).text(title, { align: "center" });
  doc.moveDown();
};

const generateInvoicePdf = (invoice, storeName, stream) => {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(stream);

  drawHeader(doc, storeName, "Invoice");

  doc.fontSize(11).text(`Invoice Number: ${invoice.invoiceNumber}`);
  doc.text(`Billing Date: ${new Date(invoice.billingDate).toLocaleString("en-IN")}`);
  doc.text(`Customer: ${invoice.customerName}`);
  doc.text(`Phone: ${invoice.customerPhone}`);
  doc.text(`Payment Mode: ${invoice.paymentMode}`);
  doc.moveDown();

  doc.font("Helvetica-Bold");
  doc.text("Product", 40, doc.y, { width: 180 });
  doc.text("Qty", 220, doc.y - 12, { width: 60 });
  doc.text("Rate", 280, doc.y - 12, { width: 90 });
  doc.text("Total", 380, doc.y - 12, { width: 140 });
  doc.font("Helvetica");
  doc.moveDown();

  invoice.items.forEach((item) => {
    doc.text(item.productName, 40, doc.y, { width: 180 });
    doc.text(String(item.quantity), 220, doc.y - 12, { width: 60 });
    doc.text(`Rs ${item.sellingPrice.toFixed(2)}`, 280, doc.y - 12, { width: 90 });
    doc.text(`Rs ${item.lineTotal.toFixed(2)}`, 380, doc.y - 12, { width: 140 });
    doc.moveDown();
  });

  doc.moveDown(0.6);
  doc.font("Helvetica-Bold");
  doc.text(`Sub Total: Rs ${invoice.subTotal.toFixed(2)}`);
  doc.text(`GST (${invoice.gstPercentage.toFixed(2)}%): Rs ${invoice.gstAmount.toFixed(2)}`);
  doc.text(`Discount: Rs ${invoice.discountAmount.toFixed(2)}`);
  doc.text(`Total Amount: Rs ${invoice.totalAmount.toFixed(2)}`);

  if (invoice.notes) {
    doc.moveDown(0.5);
    doc.font("Helvetica").text(`Notes: ${invoice.notes}`);
  }

  doc.end();
};

const generateReceiptPdf = (receipt, storeName, stream) => {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(stream);

  drawHeader(doc, storeName, "Payment Receipt");

  doc.fontSize(11).text(`Receipt Number: ${receipt.receiptNumber}`);
  doc.text(`Invoice Number: ${receipt.invoiceId?.invoiceNumber || "N/A"}`);
  doc.text(`Date: ${new Date(receipt.receiptDate).toLocaleString("en-IN")}`);
  doc.moveDown(0.5);
  doc.text(`Customer: ${receipt.customerName}`);
  doc.text(`Phone: ${receipt.customerPhone}`);
  doc.text(`Payment Mode: ${receipt.paymentMode}`);
  doc.moveDown(0.5);
  doc.text(`Sub Total: Rs ${receipt.subTotal.toFixed(2)}`);
  doc.text(`GST (${receipt.gstPercentage.toFixed(2)}%): Rs ${receipt.gstAmount.toFixed(2)}`);
  doc.text(`Discount: Rs ${receipt.discountAmount.toFixed(2)}`);
  doc.text(`Final Paid: Rs ${receipt.totalAmount.toFixed(2)}`);

  if (receipt.notes) {
    doc.moveDown(0.5);
    doc.text(`Notes: ${receipt.notes}`);
  }

  doc.end();
};

module.exports = {
  generateInvoicePdf,
  generateReceiptPdf,
};
