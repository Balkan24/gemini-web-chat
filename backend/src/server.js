require("dotenv").config();

const express = require("express");
const cors = require("cors");
const messageRoutes = require("./routes/messages");
const pool = require("./db/connection");
const authRoutes = require("./routes/auth");
const conversationRoutes = require("./routes/conversations");
const authMiddleware = require("./middleware/authMiddleware");
const budgetRoutes = require("./routes/budget");

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL
        .split(",")
        .map((origin) => origin.trim())
    : [];

app.use(
    cors({
        origin(origin, callback) {
            // curl/Postman gibi Origin göndermeyen istekler
            if (!origin) {
                return callback(null, true);
            }

            // Local geliştirme
            if (
                origin === "http://localhost:5173" ||
                origin === "http://127.0.0.1:5173"
            ) {
                return callback(null, true);
            }

            // Production frontend
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("CORS tarafından engellendi"));
        },
    })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/budget", budgetRoutes);

// Backend kontrolü
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        status: "ok",
        message: "Gemini Web Chat backend is running",
    });
});

// Veritabanı bağlantı kontrolü
app.get("/api/db-health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        return res.status(200).json({
            status: "ok",
            message: "Database connection successful",
            databaseTime: result.rows[0].now,
        });
    } catch (error) {
        console.error("DATABASE ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Database connection failed",
        });
    }
});

// JWT ile korunan profil endpoint'i
app.get("/api/profile", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, monthly_budget_usd, created_at
             FROM users
             WHERE id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Kullanıcı bulunamadı",
            });
        }

        return res.status(200).json({
            status: "ok",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("PROFILE ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Profil bilgileri alınamadı",
        });
    }
});

const PORT = process.env.PORT || 3000;

app.use((err, req, res, next) => {
    if (err.message === "CORS tarafından engellendi") {
        return res.status(403).json({
            status: "error",
            message: "Bu origin için erişime izin verilmiyor",
        });
    }

    console.error(err);

    return res.status(500).json({
        status: "error",
        message: "Sunucu hatası",
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
