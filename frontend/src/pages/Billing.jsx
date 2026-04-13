import { useEffect, useMemo, useState } from "react";
import {
  createInvoice,
  downloadInvoicePdf,
  getImageUrl,
  getInvoices,
  getProducts,
} from "../services/api";
import "../css/Billing.css";

const PAYMENT_MODES = ["UPI", "CARD", "CASH", "CREDIT"];

const getUnitLabel = (unitValue, unitType) => {
  const value = Number(unitValue || 1);
  const safeValue = Number.isInteger(value) ? value : value.toFixed(2);
  return `${safeValue} ${(unitType || "PIECE").toUpperCase()}`;
};

function Billing() {
  const [products, setProducts] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [invoiceFilters, setInvoiceFilters] = useState({ dateFrom: "", dateTo: "" });
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    paymentMode: "UPI",
    productId: "",
    quantity: 1,
    gstPercentage: 0,
    discountAmount: 0,
    notes: "",
  });
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const loadProducts = async () => {
    try {
      const response = await getProducts("");
      setProducts(response.data || []);
    } catch (error) {
      setProducts([]);
    }
  };

  const loadInvoices = async (filters = invoiceFilters) => {
    try {
      const response = await getInvoices(filters);
      setInvoiceHistory(response.data || []);
    } catch (error) {
      setInvoiceHistory([]);
    }
  };

  useEffect(() => {
    loadProducts();
    loadInvoices({ dateFrom: "", dateTo: "" });
  }, []);

  useEffect(() => {
    loadInvoices(invoiceFilters);
  }, [invoiceFilters.dateFrom, invoiceFilters.dateTo]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedProduct = useMemo(
    () => products.find((item) => item._id === formData.productId),
    [products, formData.productId]
  );

  const addToCart = () => {
    if (!formData.productId || Number(formData.quantity) <= 0) {
      return;
    }

    const product = products.find((item) => item._id === formData.productId);
    if (!product) {
      return;
    }

    const quantity = Number(formData.quantity);
    const existing = cart.find((item) => item.productId === formData.productId);

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === formData.productId ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          image: product.image,
          unitType: product.unitType || "PIECE",
          unitValue: product.unitValue || 1,
          sellingPrice: product.sellingPrice,
          quantity,
        },
      ]);
    }
  };

  const removeCartItem = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId, quantityValue) => {
    const quantity = Number(quantityValue);
    if (Number.isNaN(quantity) || quantity <= 0) {
      return;
    }
    setCart((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  };

  const subTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.sellingPrice) * Number(item.quantity), 0),
    [cart]
  );

  const gstAmount = useMemo(
    () => (subTotal * Number(formData.gstPercentage || 0)) / 100,
    [subTotal, formData.gstPercentage]
  );

  const finalAmount = useMemo(
    () => Math.max(subTotal + gstAmount - Number(formData.discountAmount || 0), 0),
    [subTotal, gstAmount, formData.discountAmount]
  );

  const historyTotalAmount = useMemo(
    () => invoiceHistory.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0),
    [invoiceHistory]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setCreatedInvoice(null);
    setCreatedReceipt(null);

    if (!formData.customerName.trim()) {
      setMessageType("danger");
      setMessage("Buyer name is required.");
      return;
    }

    if (!/^[0-9]{10}$/.test(String(formData.customerPhone).trim())) {
      setMessageType("danger");
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }

    if (!PAYMENT_MODES.includes(formData.paymentMode)) {
      setMessageType("danger");
      setMessage("Choose a valid payment mode.");
      return;
    }

    if (cart.length === 0) {
      setMessageType("danger");
      setMessage("Add at least one product to cart.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createInvoice({
        customerName: formData.customerName.trim(),
        customerPhone: String(formData.customerPhone).trim(),
        paymentMode: formData.paymentMode,
        gstPercentage: Number(formData.gstPercentage || 0),
        discountAmount: Number(formData.discountAmount || 0),
        notes: formData.notes,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      });

      setMessageType("success");
      setMessage("Invoice created and receipt stored successfully.");
      setCreatedInvoice(response.data.invoice);
      setCreatedReceipt(response.data.receipt);
      setCart([]);
      setFormData((prev) => ({
        ...prev,
        productId: "",
        quantity: 1,
      }));
      await Promise.all([loadProducts(), loadInvoices(invoiceFilters)]);
    } catch (error) {
      setMessageType("danger");
      setMessage(error.response?.data?.message || "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    const response = await downloadInvoicePdf(invoice._id);
    const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="billing-page">
      <div className="container-fluid">
        <section className="billing-header mb-4">
          <h2 className="billing-title">Billing & Sales History</h2>
          <p className="billing-subtitle">Owner billing with GST, discount and payment mode.</p>
        </section>

        <section className="billing-card card border-0 shadow-sm">
          <div className="card-body p-4">
            {message ? <div className={`alert alert-${messageType}`}>{message}</div> : null}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-lg-3 col-md-6">
                  <label className="form-label">Buyer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    className="form-control"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter buyer name"
                    required
                  />
                </div>
                <div className="col-lg-3 col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="customerPhone"
                    className="form-control"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    maxLength="10"
                    placeholder="10 digit number"
                    required
                  />
                </div>
                <div className="col-lg-2 col-md-6">
                  <label className="form-label">Payment Mode</label>
                  <select
                    name="paymentMode"
                    className="form-select"
                    value={formData.paymentMode}
                    onChange={handleChange}
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-2 col-md-6">
                  <label className="form-label">GST %</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="gstPercentage"
                    className="form-control"
                    value={formData.gstPercentage}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-lg-2 col-md-6">
                  <label className="form-label">Discount Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="discountAmount"
                    className="form-control"
                    value={formData.discountAmount}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-lg-6 col-md-8">
                  <label className="form-label">Product</label>
                  <select
                    name="productId"
                    className="form-select"
                    value={formData.productId}
                    onChange={handleChange}
                  >
                    <option value="">Choose product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} [{getUnitLabel(product.unitValue, product.unitType)}] (Stock: {product.stockQuantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-2 col-md-4">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    className="form-control"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-lg-4 col-md-12">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    name="notes"
                    className="form-control"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes"
                  />
                </div>

                {selectedProduct?.image ? (
                  <div className="col-12">
                    <div className="billing-product-preview">
                      <img
                        src={getImageUrl(selectedProduct.image)}
                        alt={selectedProduct.name}
                        className="billing-preview-image"
                      />
                      <div className="billing-preview-text">
                        <p className="mb-0">{selectedProduct.name}</p>
                        <small>
                          Unit: {getUnitLabel(selectedProduct.unitValue, selectedProduct.unitType)} | Price: Rs{" "}
                          {Number(selectedProduct.sellingPrice).toLocaleString("en-IN")}
                        </small>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="col-12">
                  <button type="button" className="btn btn-outline-primary add-item-btn" onClick={addToCart}>
                    Add Product To Bill
                  </button>
                </div>
              </div>

              <div className="table-responsive billing-cart-table-wrap">
                <table className="table align-middle billing-cart-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Product</th>
                      <th>Unit</th>
                      <th>Selling Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length ? (
                      cart.map((item) => (
                        <tr key={item.productId}>
                          <td>
                            {item.image ? (
                              <img src={getImageUrl(item.image)} alt={item.name} className="billing-photo" />
                            ) : (
                              <span className="billing-photo-empty">No Photo</span>
                            )}
                          </td>
                          <td>{item.name}</td>
                          <td>{getUnitLabel(item.unitValue, item.unitType)}</td>
                          <td>Rs {Number(item.sellingPrice).toLocaleString("en-IN")}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className="form-control cart-qty-input"
                              value={item.quantity}
                              onChange={(event) => updateQuantity(item.productId, event.target.value)}
                            />
                          </td>
                          <td>Rs {(Number(item.sellingPrice) * Number(item.quantity)).toLocaleString("en-IN")}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeCartItem(item.productId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        No products added.
                      </td>
                    </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="billing-total-wrap">
                <span className="billing-total-label">SubTotal: Rs {subTotal.toLocaleString("en-IN")}</span>
                <span className="billing-total-label">GST: Rs {gstAmount.toLocaleString("en-IN")}</span>
                <span className="billing-total-label">
                  Discount: Rs {Number(formData.discountAmount || 0).toLocaleString("en-IN")}
                </span>
                <span className="billing-total-value">Final: Rs {finalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="billing-final-box mt-3">Total Amount: Rs {finalAmount.toLocaleString("en-IN")}</div>

              <div className="mt-4">
                <button type="submit" className="btn submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Bill & Receipt"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="billing-result-card card border-0 shadow-sm mt-4">
          <div className="card-body p-4">
            <h5 className="billing-result-title">Latest Bill</h5>
            {createdInvoice ? (
              <div className="billing-result-content">
                <p className="mb-1">Invoice: {createdInvoice.invoiceNumber}</p>
                <p className="mb-1">Receipt: {createdReceipt?.receiptNumber}</p>
                <p className="mb-1">Payment: {createdInvoice.paymentMode}</p>
                <p className="mb-3">Final Amount: Rs {Number(createdInvoice.totalAmount).toLocaleString("en-IN")}</p>
                <button type="button" className="btn btn-primary" onClick={() => handleDownloadInvoice(createdInvoice)}>
                  Download Invoice PDF
                </button>
              </div>
            ) : (
              <p className="billing-result-empty">No invoice generated in this session.</p>
            )}
          </div>
        </section>

        <section className="billing-history-card card border-0 shadow-sm mt-4">
          <div className="card-body p-4">
            <div className="row g-3 align-items-end mb-3">
              <div className="col-lg-5 col-md-12">
                <h5 className="billing-history-title mb-1">Billing History</h5>
                <p className="billing-history-subtitle mb-0">Date-wise invoice history with download button.</p>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={invoiceFilters.dateFrom}
                  onChange={(event) =>
                    setInvoiceFilters((prev) => ({ ...prev, dateFrom: event.target.value }))
                  }
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={invoiceFilters.dateTo}
                  onChange={(event) => setInvoiceFilters((prev) => ({ ...prev, dateTo: event.target.value }))}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table align-middle billing-history-table mb-0">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceHistory.length ? (
                    invoiceHistory.map((invoice) => (
                      <tr key={invoice._id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.customerName}</td>
                        <td>{invoice.customerPhone}</td>
                        <td>{invoice.paymentMode}</td>
                        <td>Rs {Number(invoice.totalAmount).toLocaleString("en-IN")}</td>
                        <td>{new Date(invoice.billingDate).toLocaleDateString("en-IN")}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        No billing records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="billing-history-total-box mt-3">
              History Total Amount: Rs {historyTotalAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default Billing;
