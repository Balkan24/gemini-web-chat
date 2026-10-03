const pool = require("../db/connection");

async function getMonthlyUsage(userId) {
    const result = await pool.query(
        `SELECT COALESCE(SUM(cost_usd), 0) AS total_cost
         FROM usage_logs
         WHERE user_id = $1
         AND created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)`,
        [userId]
    );

    return Number(result.rows[0].total_cost);
}

async function getBudgetStatus(userId) {
    const userResult = await pool.query(
        `SELECT monthly_budget_usd
         FROM users
         WHERE id = $1`,
        [userId]
    );

    if (userResult.rows.length === 0) {
        throw new Error("Kullanıcı bulunamadı");
    }

    const monthlyBudget =
        Number(userResult.rows[0].monthly_budget_usd);

    const monthlyUsage =
        await getMonthlyUsage(userId);

    const remainingBudget =
        monthlyBudget - monthlyUsage;

    const usagePercentage =
        monthlyBudget > 0
            ? (monthlyUsage / monthlyBudget) * 100
            : 0;
    const warning =
        usagePercentage >= 80 &&
        usagePercentage < 100;

    return {
        monthlyBudget,
        monthlyUsage,
        remainingBudget,
        usagePercentage,
        warning,
        limitExceeded: monthlyUsage >= monthlyBudget,
    };
}

module.exports = {
    getMonthlyUsage,
    getBudgetStatus,
};