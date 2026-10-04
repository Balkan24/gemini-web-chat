const { calculateCost } = require("./src/services/costService");

const MODEL = "gemini-3.8-flash";

function runTest(name, promptTokens, candidateTokens) {
    try {
        const result = calculateCost(
            MODEL,
            promptTokens,
            candidateTokens
        );

        console.log(`\n${name}`);
        console.log("Prompt token:", promptTokens);
        console.log("Candidate token:", candidateTokens);
        console.log("Sonuç:", result);
    } catch (error) {
        console.error(`\n${name} HATASI:`, error.message);
    }
}

runTest("NORMAL MALIYET TESTI", 1000, 500);

runTest("0 TOKEN TESTI", 0, 0);

runTest(
    "BUYUK TOKEN TESTI",
    100000000,
    100000000
);
