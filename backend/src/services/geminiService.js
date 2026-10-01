const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function generateGeminiResponse(message) {
    const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: message,
    });

    return {
        text: response.text,
        usageMetadata: response.usageMetadata,
    };
}

module.exports = {
    generateGeminiResponse,
};