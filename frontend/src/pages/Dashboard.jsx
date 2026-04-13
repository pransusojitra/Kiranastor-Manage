import { useEffect, useState } from "react";
import { getDashboardSummary } from "../services/api";
import "../css/Dashboard.css";

function Dashboard() {
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    todaySales: 0,
    todayNetProfit: 0,
    lowStockCount: 0,
    lowStockWarning: "",
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await getDashboardSummary();
        setSummary(response.data);
      } catch (error) {
        setSummary({
          totalProducts: 0,
          totalCustomers: 0,
          todaySales: 0,
          todayNetProfit: 0,
          lowStockCount: 0,
          lowStockWarning: "",
          lowStockProducts: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  return (
    <section className="dashboard-page">
      <div className="container-fluid">
        <div className="dashboard-title-wrap">
          <h2 className="dashboard-title">Dashboard</h2>
          <p className="dashboard-subtitle">Quick overview of your shop operations.</p>
        </div>

        {loading ? <div className="alert alert-info">Loading dashboard data...</div> : null}
        {!loading && summary.lowStockWarning ? (
          <div className="alert alert-warning dashboard-stock-warning">{summary.lowStockWarning} (Stock &lt; 10)</div>
        ) : null}

        <div className="row g-3">
          <div className="col-md-3">
            <div className="stats-card products-card">
              <p className="stats-label">Total Products</p>
              <h3 className="stats-value">{summary.totalProducts}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card customers-card">
              <p className="stats-label">Total Buyers</p>
              <h3 className="stats-value">{summary.totalCustomers}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card sales-card">
              <p className="stats-label">Today Sales</p>
              <h3 className="stats-value">Rs {Number(summary.todaySales || 0).toLocaleString("en-IN")}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card stock-card">
              <p className="stats-label">Today Net Profit</p>
              <h3 className="stats-value">Rs {Number(summary.todayNetProfit || 0).toLocaleString("en-IN")}</h3>
            </div>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <h5 className="dashboard-section-title">Low Stock Products</h5>
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {summary.lowStockProducts?.length ? (
                  summary.lowStockProducts.map((product) => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.stockQuantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">
                      No low stock products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
