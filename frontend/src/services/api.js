import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const getImageUrl = (imagePath = "") => {
  if (!imagePath) {
    return "";
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const trimmed = String(imagePath).replace(/\\/g, "/").replace(/^\/+/, "");
  const normalizedPath = trimmed.startsWith("uploads/") ? trimmed : `uploads/${trimmed}`;
  return `${API_ORIGIN}/${normalizedPath}`;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getDashboardSummary = () => apiClient.get("/dashboard/summary");

export const getProducts = (search = "") => apiClient.get("/products", { params: { search } });
export const addProduct = (formData) =>
  apiClient.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateProduct = (id, formData) =>
  apiClient.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);

export const createInvoice = (payload) => apiClient.post("/invoices", payload);
export const getInvoices = (params = {}) => apiClient.get("/invoices", { params });
export const downloadInvoicePdf = (id) =>
  apiClient.get(`/invoices/${id}/pdf`, {
    responseType: "blob",
    params: { t: Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });

export const getReceipts = (params = {}) => apiClient.get("/receipts", { params });
export const updateReceipt = (id, payload) => apiClient.put(`/receipts/${id}`, payload);
export const downloadReceiptPdf = (id) =>
  apiClient.get(`/receipts/${id}/pdf`, { responseType: "blob" });

export const getDailyReport = (params = {}) => apiClient.get("/reports/daily", { params });
export const getMonthlyReport = (params = {}) => apiClient.get("/reports/monthly", { params });
export const getYearlyReport = (params = {}) => apiClient.get("/reports/yearly", { params });
export const getTopProducts = (params = {}) => apiClient.get("/reports/top-products", { params });

export default apiClient;
