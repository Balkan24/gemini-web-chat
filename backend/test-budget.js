require("dotenv").config();

const {
    getBudgetStatus,
} = require("./src/services/budgetService");

async function testBudget() {
    try {
        const userId = 2;

        const budget = await getBudgetStatus(userId);

        console.log("AYLIK BÜTÇE:");
        console.log(budget.monthlyBudget);

        console.log("AYLIK HARCAMA:");
        console.log(budget.monthlyUsage);

        console.log("KALAN BÜTÇE:");
        console.log(budget.remainingBudget);

        console.log("LİMİT AŞILDI MI?");
        console.log(budget.limitExceeded);
    } catch (error) {
        console.error("BUDGET TEST ERROR:", error);
    }

    process.exit();
}

testBudget();