
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const pool = require("../src/db/connection");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let testUserId;
let otherUserId;
let testConversationId;
let emptyConversationId;

function createToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    );
}

async function getUsage(conversationId, token) {
    const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

    const response = await fetch(
        `${BASE_URL}/api/conversations/${conversationId}/usage`,
        { headers }
    );

    const data = await response.json();

    return { response, data };
}

// TEST VERİLERİNİ OLUŞTUR
before(async () => {
    const uniqueId = randomUUID();

    const firstUser = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [`usage-test-${uniqueId}@example.com`, "test-only"]
    );

    testUserId = firstUser.rows[0].id;

    const secondUser = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        [`usage-other-${uniqueId}@example.com`, "test-only"]
    );

    otherUserId = secondUser.rows[0].id;

    const firstConversation = await pool.query(
        `INSERT INTO conversations (user_id, title)
         VALUES ($1, $2)
         RETURNING id`,
        [testUserId, "Usage API Test Conversation"]
    );

    testConversationId = firstConversation.rows[0].id;

    const secondConversation = await pool.query(
        `INSERT INTO conversations (user_id, title)
         VALUES ($1, $2)
         RETURNING id`,
        [testUserId, "Empty Usage Test Conversation"]
    );

    emptyConversationId = secondConversation.rows[0].id;

    const testMessage = await pool.query(
        `INSERT INTO messages (conversation_id, role, content)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
            testConversationId,
            "assistant",
            "Test usage calculation message"
        ]
    );

    const testMessageId = testMessage.rows[0].id;

    await pool.query(
        `INSERT INTO usage_logs
            (user_id, message_id, model, prompt_tokens, candidate_tokens, cost_usd)
         VALUES
            ($1, $2, $3, $4, $5, $6),
            ($1, $2, $3, $7, $8, $9)`,
        [
            testUserId,
            testMessageId,
            "gemini-test",
            100,
            200,
            0.0012,
            50,
            75,
            0.0008
        ]
    );
});

// YALNIZCA TEST KULLANICILARINI TEMİZLE
after(async () => {
    try {
        if (testUserId !== undefined) {
            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [testUserId]
            );
        }

        if (otherUserId !== undefined) {
            await pool.query(
                "DELETE FROM users WHERE id = $1",
                [otherUserId]
            );
        }
    } finally {
        await pool.end();
    }
});

// TEST 1: JWT OLMADAN ERİŞİM
test("JWT olmadan sohbet kullanım bilgilerine erişilemez", async () => {
    const { response, data } = await getUsage(testConversationId);

    assert.equal(response.status, 401);
    assert.equal(data.status, "error");
    assert.equal(data.message, "Yetkilendirme tokenı bulunamadı");
});

// TEST 2: GEÇERSİZ JWT
test("Geçersiz JWT ile sohbet kullanım bilgilerine erişilemez", async () => {
    const { response, data } = await getUsage(
        testConversationId,
        "gecersiz-token"
    );

    assert.equal(response.status, 401);
    assert.equal(data.status, "error");
    assert.equal(data.message, "Geçersiz veya süresi dolmuş token");
});

// TEST 3: SOHBET SAHİBİNİN ERİŞİMİ VE MALİYET TOPLAMLARI
test("Sohbet sahibi kullanım bilgilerine erişebilir", async () => {
    const { response, data } = await getUsage(
        testConversationId,
        createToken(testUserId)
    );

    assert.equal(response.status, 200);
    assert.equal(data.status, "ok");

    assert.deepEqual(data.usage, {
        conversationId: testConversationId,
        promptTokens: 150,
        candidateTokens: 275,
        totalTokens: 425,
        totalCostUsd: 0.002,
    });
});

// TEST 4: BAŞKA KULLANICININ ERİŞİMİ
test("Başka kullanıcıya ait sohbetin kullanım bilgilerine erişilemez", async () => {
    const { response, data } = await getUsage(
        testConversationId,
        createToken(otherUserId)
    );

    assert.equal(response.status, 404);
    assert.equal(data.status, "error");
    assert.equal(data.message, "Sohbet bulunamadı");
    assert.equal(data.usage, undefined);
});

// TEST 5: KULLANIM KAYDI OLMAYAN SOHBET
test("Kullanım kaydı olmayan sohbet sıfır değer döndürür", async () => {
    const { response, data } = await getUsage(
        emptyConversationId,
        createToken(testUserId)
    );

    assert.equal(response.status, 200);
    assert.equal(data.status, "ok");

    assert.deepEqual(data.usage, {
        conversationId: emptyConversationId,
        promptTokens: 0,
        candidateTokens: 0,
        totalTokens: 0,
        totalCostUsd: 0,
    });
});

// TEST 6: GEÇERSİZ SOHBET ID
test("Geçersiz sohbet ID için 400 döndürülür", async () => {
    const { response, data } = await getUsage(
        "abc",
        createToken(testUserId)
    );

    assert.equal(response.status, 400);
    assert.equal(data.status, "error");
    assert.equal(data.message, "Geçersiz sohbet ID");
    assert.equal(data.usage, undefined);
});

// TEST 7: BULUNMAYAN SOHBET ID
test("Bulunmayan sohbet ID için 404 döndürülür", async () => {
    const { response, data } = await getUsage(
        "999999",
        createToken(testUserId)
    );

    assert.equal(response.status, 404);
    assert.equal(data.status, "error");
    assert.equal(data.message, "Sohbet bulunamadı");
    assert.equal(data.usage, undefined);
});
