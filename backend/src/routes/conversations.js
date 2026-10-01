const express = require("express");
const pool = require("../db/connection");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Yeni sohbet oluştur
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { title } = req.body;

        if (
            typeof title !== "string" ||
            title.trim().length === 0
        ) {
            return res.status(400).json({
                status: "error",
                message: "Sohbet başlığı zorunludur",
            });
        }

        const result = await pool.query(
            `INSERT INTO conversations (user_id, title)
             VALUES ($1, $2)
             RETURNING id, user_id, title, created_at, updated_at`,
            [req.user.userId, title.trim()]
        );

        return res.status(201).json({
            status: "ok",
            message: "Sohbet oluşturuldu",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("CREATE CONVERSATION ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Sohbet oluşturulurken hata oluştu",
        });
    }
});

// Kullanıcının sohbetlerini getir
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, title, created_at, updated_at
             FROM conversations
             WHERE user_id = $1
             ORDER BY updated_at DESC`,
            [req.user.userId]
        );

        return res.status(200).json({
            status: "ok",
            conversations: result.rows,
        });
    } catch (error) {
        console.error("GET CONVERSATIONS ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Sohbetler alınamadı",
        });
    }
});
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, user_id, title, created_at, updated_at
             FROM conversations
             WHERE id = $1 AND user_id = $2`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Sohbet bulunamadı",
            });
        }

        return res.status(200).json({
            status: "ok",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("GET CONVERSATION ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Sohbet alınamadı",
        });
    }
});
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        if (
            typeof title !== "string" ||
            title.trim().length === 0
        ) {
            return res.status(400).json({
                status: "error",
                message: "Yeni sohbet başlığı zorunludur",
            });
        }

        const result = await pool.query(
            `UPDATE conversations
             SET title = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3
             RETURNING id, user_id, title, created_at, updated_at`,
            [title.trim(), id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Sohbet bulunamadı",
            });
        }

        return res.status(200).json({
            status: "ok",
            message: "Sohbet güncellendi",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("UPDATE CONVERSATION ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Sohbet güncellenirken hata oluştu",
        });
    }
});
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM conversations
             WHERE id = $1 AND user_id = $2
             RETURNING id, title`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Sohbet bulunamadı",
            });
        }

        return res.status(200).json({
            status: "ok",
            message: "Sohbet silindi",
            conversation: result.rows[0],
        });
    } catch (error) {
        console.error("DELETE CONVERSATION ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Sohbet silinirken hata oluştu",
        });
    }
});
module.exports = router;