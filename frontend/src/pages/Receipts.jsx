import { useEffect, useState } from "react";
import { downloadReceiptPdf, getReceipts, updateReceipt } from "../services/api";
import "../css/Receipts.css";

const PAYMENT_MODES = ["UPI", "CARD", "CASH", "CREDIT"];

const getPaymentClass = (mode) => {
  if (mode === "UPI") return "payment-mode mode-upi";
  if (mode === "CARD") return "payment-mode mode-card";
  if (mode === "CASH") return "payment-mode mode-cash";
  if (mode === "CREDIT") return "payment-mode mode-credit";
  return "payment-mode";
};

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const loadReceipts = async () => {
    try {
      const response = await getReceipts(filters);
      setReceipts(response.data || []);
    } catch (error) {
      setReceipts([]);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [filters.dateFrom, filters.dateTo]);

  const handleDownload = async (receipt) => {
    const response = await downloadReceiptPdf(receipt._id);
    const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${receipt.receiptNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = (receipt) => {
    const productSummary =
      receipt.invoiceId?.items?.length > 0
        ? receipt.invoiceId.items
            .map((item) => `${item.productName} (${item.quantity})`)
            .join(", ")
        : "N/A";

    const text = `Receipt ${receipt.receiptNumber}
Name: ${receipt.customerName}
Phone: ${receipt.customerPhone}
Payment: ${receipt.paymentMode}
Products: ${productSummary}
SubTotal: Rs ${Number(receipt.subTotal).toLocaleString("en-IN")}
GST: ${Number(receipt.gstPercentage).toFixed(2)}%
Discount: Rs ${Number(receipt.discountAmount).toLocaleString("en-IN")}
Final: Rs ${Number(receipt.totalAmount).toLocaleString("en-IN")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditingReceipt((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingReceipt) {
      return;
    }
    try {
      await updateReceipt(editingReceipt._id, {
        customerName: editingReceipt.customerName,
        customerPhone: editingReceipt.customerPhone,
        paymentMode: editingReceipt.paymentMode,
        gstPercentage: Number(editingReceipt.gstPercentage),
        discountAmount: Number(editingReceipt.discountAmount),
        notes: editingReceipt.notes || "",
      });
      setMessageType("success");
      setMessage("Receipt updated successfully.");
      setEditingReceipt(null);
      loadReceipts();
    } catch (error) {
      setMessageType("danger");
      setMessage(error.response?.data?.message || "Failed to update receipt.");
    }
  };

  return (
    <section className="receipts-page">
      <div className="container-fluid">
        <div className="receipts-header mb-4">
          <h2 className="receipts-title">Receipts</h2>
          <p className="receipts-subtitle">
            Date-wise receipt history with edit, PDF download, and WhatsApp sharing.
          </p>
        </div>

        {message ? <div className={`alert alert-${messageType}`}>{message}</div> : null}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.dateFrom}
                  onChange={(event) => setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.dateTo}
                  onChange={(event) => setFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle receipts-table">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Products</th>
                    <th>Payment</th>
                    <th>GST %</th>
                    <th>Discount</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length ? (
                    receipts.map((receipt) => (
                      <tr key={receipt._id}>
                        <td>{receipt.receiptNumber}</td>
                        <td>{receipt.customerName}</td>
                        <td>{receipt.customerPhone}</td>
                        <td>
                          {receipt.invoiceId?.items?.length ? (
                            <div className="receipt-products">
                              {receipt.invoiceId.items.map((item, index) => (
                                <div key={`${receipt._id}-${item.productId || index}`} className="receipt-product-item">
                                  {item.productName} x {item.quantity}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="receipt-products-empty">No items</span>
                          )}
                        </td>
                        <td>
                          <span className={getPaymentClass(receipt.paymentMode)}>{receipt.paymentMode}</span>
                        </td>
                        <td>
                          <span className="receipt-gst">{Number(receipt.gstPercentage).toFixed(2)}%</span>
                        </td>
                        <td>
                          <span className="receipt-discount">
                            Rs {Number(receipt.discountAmount).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="receipt-total">
                            Rs {Number(receipt.totalAmount).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>{new Date(receipt.receiptDate).toLocaleDateString("en-IN")}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => handleDownload(receipt)}>
                              PDF
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleShareWhatsApp(receipt)}
                            >
                              WhatsApp
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => setEditingReceipt({ ...receipt })}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        No receipts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {editingReceipt ? (
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Edit Receipt {editingReceipt.receiptNumber}</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="customerName"
                    className="form-control"
                    value={editingReceipt.customerName}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    name="customerPhone"
                    className="form-control"
                    maxLength="10"
                    value={editingReceipt.customerPhone}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Payment</label>
                  <select
                    name="paymentMode"
                    className="form-select"
                    value={editingReceipt.paymentMode}
                    onChange={handleEditChange}
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">GST %</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="gstPercentage"
                    className="form-control"
                    value={editingReceipt.gstPercentage}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Discount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="discountAmount"
                    className="form-control"
                    value={editingReceipt.discountAmount}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    className="form-control"
                    value={editingReceipt.notes || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingReceipt(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default Receipts;
