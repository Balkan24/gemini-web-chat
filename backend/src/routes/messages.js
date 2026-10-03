const express = require("express");
const pool = require("../db/connection");
const authMiddleware = require("../middleware/authMiddleware");

const {
    generateGeminiResponse,
} = require("../services/geminiService");

const {
    calculateCost,
} = require("../services/costService");

const {
    getBudgetStatus,
} = require("../services/budgetService");

const router = express.Router();


// MESAJ GÖNDERME
router.post(
    "/:conversationId/messages",
    authMiddleware,
    async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { content } = req.body;

            // Mesaj kontrolü
            if (
                typeof content !== "string" ||
                content.trim().length === 0
            ) {
                return res.status(400).json({
                    status: "error",
                    message: "Mesaj içeriği zorunludur",
                });
            }

            // Sohbet gerçekten bu kullanıcıya mı ait?
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

            // Aylık bütçe kontrolü
            const budgetStatus = await getBudgetStatus(
                req.user.userId
            );

            if (budgetStatus.limitExceeded) {
                return res.status(403).json({
                    status: "error",
                    message: "Aylık kullanım bütçesi aşıldı",
                    budget: {
                        monthlyBudget:
                            budgetStatus.monthlyBudget,
                        monthlyUsage:
                            budgetStatus.monthlyUsage,
                        remainingBudget:
                            budgetStatus.remainingBudget,
                    },
                });
            }

            // Kullanıcı mesajını veritabanına kaydet
            const userMessageResult = await pool.query(
                `INSERT INTO messages
                    (
                        conversation_id,
                        role,
                        content,
                        prompt_tokens,
                        candidate_tokens,
                        cost_usd
                    )
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    conversationId,
                    "user",
                    content.trim(),
                    0,
                    0,
                    0,
                ]
            );

            // Gemini'den cevap al
            const geminiResult =
                await generateGeminiResponse(
                    content.trim()
                );

            // Token bilgilerini al
            const promptTokens =
                geminiResult.usageMetadata?.promptTokenCount || 0;

            const candidateTokens =
                geminiResult.usageMetadata?.candidatesTokenCount || 0;

            // Maliyet hesapla
            const cost = calculateCost(
                geminiResult.model,
                promptTokens,
                candidateTokens
            );

            // Gemini cevabını messages tablosuna kaydet
            const assistantMessageResult = await pool.query(
                `INSERT INTO messages
                    (
                        conversation_id,
                        role,
                        content,
                        prompt_tokens,
                        candidate_tokens,
                        cost_usd
                    )
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    conversationId,
                    "assistant",
                    geminiResult.text,
                    promptTokens,
                    candidateTokens,
                    cost.totalCost,
                ]
            );

            // Kullanım bilgilerini usage_logs tablosuna kaydet
            await pool.query(
                `INSERT INTO usage_logs
                    (
                        user_id,
                        message_id,
                        model,
                        prompt_tokens,
                        candidate_tokens,
                        cost_usd
                    )
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    req.user.userId,
                    assistantMessageResult.rows[0].id,
                    geminiResult.model,
                    promptTokens,
                    candidateTokens,
                    cost.totalCost,
                ]
            );

            // Başarılı cevap
            return res.status(201).json({
                status: "ok",
                message: "Gemini cevabı oluşturuldu",
                userMessage: userMessageResult.rows[0],
                assistantMessage:
                    assistantMessageResult.rows[0],
                usage: {
                    model: geminiResult.model,
                    promptTokens,
                    candidateTokens,
                    costUsd: cost.totalCost,
                },
            });

        } catch (error) {
            console.error(
                "CREATE MESSAGE ERROR:",
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


// MESAJLARI GETİRME
router.get(
    "/:conversationId/messages",
    authMiddleware,
    async (req, res) => {
        try {
            const { conversationId } = req.params;

            // Sohbet gerçekten bu kullanıcıya mı ait?
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

            // Sohbete ait mesajları getir
            const result = await pool.query(
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
                 ORDER BY id ASC`,
                [conversationId]
            );

            return res.status(200).json({
                status: "ok",
                messages: result.rows,
            });

        } catch (error) {
            console.error(
                "GET MESSAGES ERROR:",
                error
            );

            return res.status(500).json({
                status: "error",
                message: "Mesajlar alınamadı",
            });
        }
    }
);


module.exports = router;