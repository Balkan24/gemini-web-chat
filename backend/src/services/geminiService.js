const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.8-flash";

async function generateGeminiResponse(message) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: message,
            });

            return {
                text: response.text,
                usageMetadata: response.usageMetadata,
                model: MODEL,
            };
        } catch (error) {
            if (error.status === 503 && attempt < maxAttempts) {
                console.log(
                    `Gemini yoğun, tekrar deneniyor (${attempt}/${maxAttempts})`
                );

                await new Promise((resolve) =>
                    setTimeout(resolve, 2000 * attempt)
                );

                continue;
            }

            throw error;
        }
    }
}

async function generateGeminiStream(message) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.generateContentStream({
                model: MODEL,
                contents: message,
            });

            return {
                stream: response,
                model: MODEL,
            };
        } catch (error) {
            if (error.status === 503 && attempt < maxAttempts) {
                console.log(
                    `Gemini stream yoğun, tekrar deneniyor (${attempt}/${maxAttempts})`
                );

                await new Promise((resolve) =>
                    setTimeout(resolve, 2000 * attempt)
                );

                continue;
            }

            throw error;
        }
    }
}

module.exports = {
    generateGeminiResponse,
    generateGeminiStream,
};