const MODEL_PRICING = {
    "gemini-3.8-flash": {
        inputPerMillion: 0.75,
        outputPerMillion: 3.75,
    },
    "gemini-3.5-flash-lite": {
        inputPerMillion: 0.30,
        outputPerMillion: 2.50,
    },
};

function calculateCost(model, promptTokens, candidateTokens) {
    const pricing = MODEL_PRICING[model];

    if (!pricing) {
        throw new Error("Model fiyatlandırması bulunamadı");
    }

    const inputCost =
        (promptTokens / 1_000_000) * pricing.inputPerMillion;

    const outputCost =
        (candidateTokens / 1_000_000) * pricing.outputPerMillion;

    const totalCost = inputCost + outputCost;

    return {
        inputCost,
        outputCost,
        totalCost,
    };
}

module.exports = {
    calculateCost,
};