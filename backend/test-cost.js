const { calculateCost } = require("./src/services/costService");

try {
    const result = calculateCost(
        "gemini-1.5-flash",
        1000,
        500
    );

    console.log("MALIYET TESTI:");
    console.log(result);
} catch (error) {
    console.error("MALIYET HATASI:", error.message);
}


