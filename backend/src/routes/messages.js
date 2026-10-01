const express = require("express");
const pool = require("../db/connection");
const authMiddleware = require("../middleware/authMiddleware");

const {
    generateGeminiResponse,
} = require("../services/geminiService");

const router = express.Router();

router.post(
    "/:conversationId/messages",
    authMiddleware,
    async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;

            if (
                typeof content !== "string" ||
                content.trim().length === 0
            ) {
                return res.status(400).json({
                    status: "error",
                    message: "Mesaj içeriği zorunludur",
                });
            }

            const conversationResult = await pool.query(
                `SELECT id
                 FROM conversations
                 WHERE id = $1 AND user_id = $2`,
                [conversationId, req.user.userId]
            );

            if (conversationResult.rows.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Sohbet bulunamadı",
                });
            }

            const userMessageResult = await pool.query(
                `INSERT INTO messages (
                    conversation_id,
                    role,
                    content
                )
                VALUES ($1, $2, $3)
                RETURNING
                    id,
                    conversation_id,
                    role,
                    content,
                    prompt_tokens,
                    candidate_tokens,
                    cost_usd,
                    created_at`,
                [
                    conversationId,
                    "user",
                    content.trim(),
                ]
            );

            const geminiResult =
                await generateGeminiResponse(
                    content.trim()
                );

            console.log(
                "GEMINI USAGE:",
                geminiResult.usageMetadata
            );

            const assistantMessageResult =
                await pool.query(
                    `INSERT INTO messages (
                        conversation_id,
                        role,
                        content
                    )
                    VALUES ($1, $2, $3)
                    RETURNING
                        id,
                        conversation_id,
                        role,
                        content,
                        prompt_tokens,
                        candidate_tokens,
                        cost_usd,
                        created_at`,
                    [
                        conversationId,
                        "assistant",
                        geminiResult.text,
                    ]
                );

            return res.status(201).json({
                status: "ok",
                message: "Gemini cevabı oluşturuldu",
                userMessage:
                    userMessageResult.rows[0],
                assistantMessage:
                    assistantMessageResult.rows[0],
                usageMetadata:
                    geminiResult.usageMetadata,
            });
        } catch (error) {
            console.error(
                "CREATE GEMINI MESSAGE ERROR:",
                error
            );

            return res.status(500).json({
                status: "error",
                message:
                    "Mesaj oluşturulurken hata oluştu",
            });
        }
    }
);

router.get(
    "/:conversationId/messages",
    authMiddleware,
    async (req, res) => {
        try {
            const { conversationId } = req.params;

            const conversationResult = await pool.query(
                `SELECT id
                 FROM conversations
                 WHERE id = $1 AND user_id = $2`,
                [conversationId, req.user.userId]
            );

            if (conversationResult.rows.length === 0) {
                return res.status(404).json({
                    status: "error",
                    message: "Sohbet bulunamadı",
                });
            }

            const messagesResult = await pool.query(
                `SELECT
                    id,
                    conversation_id,
                    role,
                    content,
                    prompt_tokens,
                    candidate_tokens,
                    cost_usd,
                    created_at
                 FROM messages
                 WHERE conversation_id = $1
                 ORDER BY created_at ASC, id ASC`,
                [conversationId]
            );

            return res.status(200).json({
                status: "ok",
                messages: messagesResult.rows,
            });
        } catch (error) {
            console.error(
                "GET MESSAGES ERROR:",
                error
            );

            return res.status(500).json({
                status: "error",
                message:
                    "Mesajlar alınırken hata oluştu",
            });
        }
    }
);

module.exports = router;
