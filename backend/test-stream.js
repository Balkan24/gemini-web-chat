require("dotenv").config();

const {
    generateGeminiStream,
} = require("./src/services/geminiService");

async function testStream() {
    try {
        const result = await generateGeminiStream(
            "REST API nedir? Tek cümleyle açıkla."
        );

        console.log("Model:", result.model);
        console.log("Streaming başladı:\n");

        let fullText = "";
        let finalUsageMetadata = null;

        for await (const chunk of result.stream) {
            if (chunk.text) {
                process.stdout.write(chunk.text);
                fullText += chunk.text;
            }

            if (chunk.usageMetadata) {
                finalUsageMetadata = chunk.usageMetadata;
            }
        }

        console.log("\n\nStreaming tamamlandı.");
        console.log("Tam cevap:", fullText);
        console.log("Usage metadata:", finalUsageMetadata);
    } catch (error) {
        console.error("STREAM TEST ERROR:", error);
    }
}

testStream();