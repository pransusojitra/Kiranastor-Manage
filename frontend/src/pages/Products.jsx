import { useEffect, useState } from "react";
import {
  addProduct,
  deleteProduct,
  getImageUrl,
  getProducts,
  updateProduct,
} from "../services/api";
import "../css/Products.css";

const initialForm = {
  name: "",
  category: "",
  purchasePrice: "",
  sellingPrice: "",
  stockQuantity: "",
  unitType: "PIECE",
  unitValue: 1,
  image: null,
};

const getUnitLabel = (product) => {
  const value = Number(product.unitValue || 1);
  const type = (product.unitType || "PIECE").toUpperCase();
  return `${Number.isInteger(value) ? value : value.toFixed(2)} ${type}`;
};

function Products() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const loadProducts = async (query = "") => {
    try {
      const response = await getProducts(query);
      setProducts(response.data || []);
    } catch (error) {
      setProducts([]);
    }
  };

  useEffect(() => {
    loadProducts(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "image") {
      const file = files[0] || null;
      setFormData((prev) => ({ ...prev, image: file }));
      if (file) {
        setImagePreview(URL.createObjectURL(file));
      } else {
        setImagePreview("");
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId("");
    setImagePreview("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const parsedPurchasePrice = Number(formData.purchasePrice);
    const parsedSellingPrice = Number(formData.sellingPrice);
    const parsedStock = Number(formData.stockQuantity);
    const parsedUnitValue = Number(formData.unitValue);
    if (Number.isNaN(parsedPurchasePrice) || parsedPurchasePrice <= 0) {
      setMessageType("danger");
      setMessage("Purchase price must be a positive number.");
      return;
    }
    if (Number.isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
      setMessageType("danger");
      setMessage("Selling price must be a positive number.");
      return;
    }
    if (parsedSellingPrice < parsedPurchasePrice) {
      setMessageType("danger");
      setMessage("Selling price cannot be lower than purchase price.");
      return;
    }
    if (Number.isNaN(parsedStock)) {
      setMessageType("danger");
      setMessage("Stock must be numeric.");
      return;
    }
    if (Number.isNaN(parsedUnitValue) || parsedUnitValue <= 0) {
      setMessageType("danger");
      setMessage("Unit value must be a positive number.");
      return;
    }

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("category", formData.category);
    payload.append("purchasePrice", parsedPurchasePrice);
    payload.append("sellingPrice", parsedSellingPrice);
    payload.append("stockQuantity", parsedStock);
    payload.append("unitType", formData.unitType);
    payload.append("unitValue", parsedUnitValue);
    if (formData.image) {
      payload.append("image", formData.image);
    }

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage("Product updated successfully.");
      } else {
        await addProduct(payload);
        setMessage("Product added successfully.");
      }
      setMessageType("success");
      resetForm();
      loadProducts();
    } catch (error) {
      setMessageType("danger");
      setMessage(error.response?.data?.message || "Failed to save product.");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      unitType: product.unitType || "PIECE",
      unitValue: product.unitValue || 1,
      image: null,
    });
    setImagePreview(getImageUrl(product.image));
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setMessageType("success");
      setMessage("Product deleted successfully.");
      loadProducts();
    } catch (error) {
      setMessageType("danger");
      setMessage(error.response?.data?.message || "Failed to delete product.");
    }
  };

  return (
    <section className="products-page">
      <div className="container-fluid">
        <div className="products-header mb-4">
          <h2 className="products-title">Product Management</h2>
          <p className="products-subtitle">Add, edit, and track stock with product images.</p>
        </div>

        <div className="card border-0 shadow-sm products-search-card mb-3">
          <div className="card-body">
            <div className="row g-2 align-items-center">
              <div className="col-md-6">
                <label htmlFor="productSearch" className="form-label mb-1">
                  Search Product By Name
                </label>
                <input
                  id="productSearch"
                  type="text"
                  className="form-control"
                  placeholder="Type product name..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm products-form-card mb-4">
          <div className="card-body">
            {message ? <div className={`alert alert-${messageType}`}>{message}</div> : null}
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-md-3">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Purchase Price</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="purchasePrice"
                  className="form-control"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Selling Price</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="sellingPrice"
                  className="form-control"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-1">
                <label className="form-label">Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  name="stockQuantity"
                  className="form-control"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Unit Type</label>
                <select
                  name="unitType"
                  className="form-select"
                  value={formData.unitType}
                  onChange={handleChange}
                  required
                >
                  <option value="KG">KG</option>
                  <option value="LITER">LITER</option>
                  <option value="PIECE">PIECE</option>
                  <option value="PACK">PACK</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Unit Value</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="unitValue"
                  className="form-control"
                  value={formData.unitValue}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Image</label>
                <input type="file" name="image" className="form-control" onChange={handleChange} />
              </div>
              {imagePreview ? (
                <div className="col-12">
                  <div className="image-preview-wrap">
                    <p className="image-preview-label">Image Preview</p>
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  </div>
                </div>
              ) : null}
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingId ? "Update Product" : "Add Product"}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table align-middle products-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Purchase</th>
                    <th>Selling</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length ? (
                    products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          {product.image ? (
                            <img
                              src={getImageUrl(product.image)}
                              alt={product.name}
                              className="product-thumb"
                            />
                          ) : (
                            <span className="no-image">No Image</span>
                          )}
                        </td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{getUnitLabel(product)}</td>
                        <td>Rs {Number(product.purchasePrice).toLocaleString("en-IN")}</td>
                        <td>Rs {Number(product.sellingPrice).toLocaleString("en-IN")}</td>
                        <td>
                          <span className={product.stockQuantity < 10 ? "stock-low" : "stock-normal"}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(product)}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Products;
