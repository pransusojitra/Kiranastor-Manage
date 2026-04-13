const express = require("express");
const {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getTopSellingProducts,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/daily", getDailyReport);
router.get("/monthly", getMonthlyReport);
router.get("/yearly", getYearlyReport);
router.get("/top-products", getTopSellingProducts);

module.exports = router;
