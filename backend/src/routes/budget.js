const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getBudgetStatus,
} = require("../services/budgetService");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const budgetStatus = await getBudgetStatus(
            req.user.userId
        );

        // API çıktısındaki ondalık değerleri daha okunabilir hale getir
        const monthlyBudget = Number(
            budgetStatus.monthlyBudget.toFixed(6)
        );

        const monthlyUsage = Number(
            budgetStatus.monthlyUsage.toFixed(6)
        );

        const remainingBudget = Number(
            budgetStatus.remainingBudget.toFixed(6)
        );

        const usagePercentage = Number(
            budgetStatus.usagePercentage.toFixed(2)
        );

        return res.status(200).json({
            status: "ok",
            budget: {
                monthlyBudget,
                monthlyUsage,
                remainingBudget,
                usagePercentage,
                warning: budgetStatus.warning,
                limitExceeded: budgetStatus.limitExceeded,
            },
        });
    } catch (error) {
        console.error("GET BUDGET ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Bütçe bilgisi alınamadı",
        });
    }
});

module.exports = router;