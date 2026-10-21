function generateConversationTitle(content) {
    if (typeof content !== "string") {
        return "Yeni Sohbet";
    }

    const text = content.trim().replace(/\s+/g, " ");

    if (!text) {
        return "Yeni Sohbet";
    }

    if (text.length <= 50) {
        return text;
    }

    const shortened = text.slice(0, 50);
    const lastSpace = shortened.lastIndexOf(" ");

    if (lastSpace > 0) {
        return shortened.slice(0, lastSpace);
    }

    return shortened;
}

module.exports = { generateConversationTitle };