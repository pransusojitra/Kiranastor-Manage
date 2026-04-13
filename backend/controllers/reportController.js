const Invoice = require("../models/Invoice");

const buildMatch = ({ from, to }) => {
  if (!from && !to) {
    return {};
  }

  const billingDate = {};
  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    billingDate.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    billingDate.$lte = end;
  }

  return { billingDate };
};

const aggregateByFormat = async (format, req, res) => {
  try {
    const match = buildMatch(req.query);
    const result = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format,
              date: "$billingDate",
            },
          },
          totalSales: { $sum: "$totalAmount" },
          totalNetProfit: { $sum: "$netProfit" },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const totals = result.reduce(
      (acc, item) => {
        acc.totalSales += item.totalSales;
        acc.totalNetProfit += item.totalNetProfit;
        acc.invoiceCount += item.invoiceCount;
        return acc;
      },
      { totalSales: 0, totalNetProfit: 0, invoiceCount: 0 }
    );

    return res.status(200).json({ rows: result, totals });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load report", error: error.message });
  }
};

const getDailyReport = async (req, res) => aggregateByFormat("%Y-%m-%d", req, res);
const getMonthlyReport = async (req, res) => aggregateByFormat("%Y-%m", req, res);
const getYearlyReport = async (req, res) => aggregateByFormat("%Y", req, res);

const getTopSellingProducts = async (req, res) => {
  try {
    const match = buildMatch(req.query);
    const result = await Invoice.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
          totalProfit: { $sum: "$items.lineProfit" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load top selling products", error: error.message });
  }
};

module.exports = {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getTopSellingProducts,
};
