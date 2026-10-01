const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/connection");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email ve password zorunludur",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: "error",
                message: "Şifre en az 6 karakter olmalıdır",
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                status: "error",
                message: "Bu email zaten kayıtlı",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash)
             VALUES ($1, $2)
             RETURNING id, email, monthly_budget_usd, created_at`,
            [email, passwordHash]
        );

        return res.status(201).json({
            status: "ok",
            message: "Kullanıcı başarıyla oluşturuldu",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Kullanıcı oluşturulurken hata oluştu",
        });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email ve password zorunludur",
            });
        }

        const result = await pool.query(
            "SELECT id, email, password_hash FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Email veya şifre hatalı",
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                status: "error",
                message: "Email veya şifre hatalı",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET tanımlı değil");
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        return res.status(200).json({
            status: "ok",
            message: "Giriş başarılı",
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            status: "error",
            message: "Giriş işlemi sırasında hata oluştu",
        });
    }
});

module.exports = router;