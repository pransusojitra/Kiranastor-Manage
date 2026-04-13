import { useEffect, useState } from "react";
import {
  getDailyReport,
  getMonthlyReport,
  getTopProducts,
  getYearlyReport,
} from "../services/api";
import "../css/Reports.css";

function Reports() {
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [daily, setDaily] = useState({ rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
  const [monthly, setMonthly] = useState({ rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
  const [yearly, setYearly] = useState({ rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
  const [topProducts, setTopProducts] = useState([]);

  const loadReports = async () => {
    try {
      const query = { from: filters.from || undefined, to: filters.to || undefined };
      const [dailyRes, monthlyRes, yearlyRes, topRes] = await Promise.all([
        getDailyReport(query),
        getMonthlyReport(query),
        getYearlyReport(query),
        getTopProducts(query),
      ]);
      setDaily(dailyRes.data || { rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
      setMonthly(monthlyRes.data || { rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
      setYearly(yearlyRes.data || { rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
      setTopProducts(topRes.data || []);
    } catch (error) {
      setDaily({ rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
      setMonthly({ rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
      setYearly({ rows: [], totals: { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 } });
      setTopProducts([]);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    loadReports();
  }, [filters.from, filters.to]);

  return (
    <section className="reports-page">
      <div className="container-fluid">
        <div className="reports-header mb-4">
          <h2 className="reports-title">Profit & Sales Reports</h2>
          <p className="reports-subtitle">Daily, monthly, yearly analytics with date-wise filter and net profit.</p>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.from}
                  onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.to}
                  onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm report-card">
              <div className="card-body">
                <h5 className="report-card-title">Daily Report</h5>
                <p className="report-total">Sales: Rs {Number(daily.totals.totalSales).toLocaleString("en-IN")}</p>
                <p className="report-total">Net Profit: Rs {Number(daily.totals.totalNetProfit).toLocaleString("en-IN")}</p>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Sales</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.rows.length ? (
                        daily.rows.map((item) => (
                          <tr key={item._id}>
                            <td>{item._id}</td>
                            <td>Rs {Number(item.totalSales).toLocaleString("en-IN")}</td>
                            <td>Rs {Number(item.totalNetProfit).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm report-card">
              <div className="card-body">
                <h5 className="report-card-title">Monthly Report</h5>
                <p className="report-total">Sales: Rs {Number(monthly.totals.totalSales).toLocaleString("en-IN")}</p>
                <p className="report-total">
                  Net Profit: Rs {Number(monthly.totals.totalNetProfit).toLocaleString("en-IN")}
                </p>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Sales</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.rows.length ? (
                        monthly.rows.map((item) => (
                          <tr key={item._id}>
                            <td>{item._id}</td>
                            <td>Rs {Number(item.totalSales).toLocaleString("en-IN")}</td>
                            <td>Rs {Number(item.totalNetProfit).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm report-card">
              <div className="card-body">
                <h5 className="report-card-title">Yearly Report</h5>
                <p className="report-total">Sales: Rs {Number(yearly.totals.totalSales).toLocaleString("en-IN")}</p>
                <p className="report-total">
                  Net Profit: Rs {Number(yearly.totals.totalNetProfit).toLocaleString("en-IN")}
                </p>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Sales</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearly.rows.length ? (
                        yearly.rows.map((item) => (
                          <tr key={item._id}>
                            <td>{item._id}</td>
                            <td>Rs {Number(item.totalSales).toLocaleString("en-IN")}</td>
                            <td>Rs {Number(item.totalNetProfit).toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">
                            No data
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm report-card mt-4">
          <div className="card-body">
            <h5 className="report-card-title">Top Selling Products</h5>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length ? (
                    topProducts.map((item) => (
                      <tr key={item._id}>
                        <td>{item.productName}</td>
                        <td>{item.totalQuantitySold}</td>
                        <td>Rs {Number(item.totalRevenue).toLocaleString("en-IN")}</td>
                        <td>Rs {Number(item.totalProfit).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No data
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

export default Reports;
