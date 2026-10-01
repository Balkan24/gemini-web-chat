require("dotenv").config();

const {
    generateGeminiResponse,
} = require("./src/services/geminiService");

async function testGemini() {
    try {
        const result = await generateGeminiResponse(
            "Merhaba, kendini tek cümleyle tanıt."
        );

        console.log("GEMINI CEVABI:");
        console.log(result.text);

        console.log("\nTOKEN BİLGİLERİ:");
        console.log(result.usageMetadata);
    } catch (error) {
        console.error("GEMINI TEST ERROR:", error);
    }
}

testGemini();