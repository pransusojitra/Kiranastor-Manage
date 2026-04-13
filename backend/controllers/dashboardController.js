const Product = require("../models/Product");
const Invoice = require("../models/Invoice");

const getDashboardSummary = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalProducts, lowStockProducts, salesAgg, buyerAgg] = await Promise.all([
      Product.countDocuments(),
      Product.find({ stockQuantity: { $lt: 10 } }).sort({ stockQuantity: 1 }).limit(10),
      Invoice.aggregate([
        { $match: { billingDate: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalProfit: { $sum: "$netProfit" },
          },
        },
      ]),
      Invoice.aggregate([
        { $group: { _id: "$customerPhone" } },
        { $count: "totalBuyers" },
      ]),
    ]);

    return res.status(200).json({
      totalProducts,
      totalCustomers: buyerAgg[0]?.totalBuyers || 0,
      todaySales: salesAgg[0]?.totalSales || 0,
      todayNetProfit: salesAgg[0]?.totalProfit || 0,
      lowStockCount: lowStockProducts.length,
      lowStockWarning: lowStockProducts.length > 0 ? "Low Stock Warning" : "",
      lowStockProducts,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load dashboard data", error: error.message });
  }
};

module.exports = {
  getDashboardSummary,
};
