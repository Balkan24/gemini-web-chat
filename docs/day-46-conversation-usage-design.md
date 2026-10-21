# Day 46 – Conversation Usage Summary: Analysis and Design

## 1. Feature Overview

The proposed feature is a conversation-level usage summary for Gemini Web Chat. Currently, the application displays token consumption and estimated cost for individual Gemini responses, as well as the user's monthly budget usage. However, it does not provide the total token consumption and cost of an individual conversation.

This feature will allow users to see the total prompt tokens, response tokens, combined tokens, and estimated USD cost for the selected conversation.

The purpose of Day 46 is to analyze the existing implementation and prepare the technical design. Backend implementation and frontend integration will be completed in the following development days.

## 2. Existing System Analysis

### 2.1 Database Structure

The existing PostgreSQL database includes three relevant tables:

- `conversations`: Stores conversations and associates each conversation with a user through `user_id`.
- `messages`: Stores messages belonging to conversations through `conversation_id`. Assistant messages also contain token counts and estimated costs.
- `usage_logs`: Stores model usage information, including `user_id`, `message_id`, `model`, `prompt_tokens`, `candidate_tokens`, and `cost_usd`.

The `usage_logs.message_id` field references `messages.id`, allowing usage records to be associated with a conversation through the messages table.

The proposed feature will use `usage_logs` as its primary data source because the existing monthly budget calculation also uses this table. This avoids adding values from `messages` and `usage_logs` together and accidentally counting the same usage twice.

Usage records without an associated message cannot be assigned to a specific conversation and will not be included in conversation-level totals.

### 2.2 Backend Structure

The backend uses Express.js and PostgreSQL.

The existing conversation routes support creating, listing, retrieving, updating, and deleting conversations. The message routes support retrieving messages, generating responses, and streaming Gemini responses.

Both standard and streaming message creation store token counts and estimated costs in the database.

The existing `budgetService.js` calculates monthly usage from `usage_logs`. The new feature will follow a similar aggregation approach but will filter usage records by conversation instead of by month.

### 2.3 Frontend Structure

The React frontend uses `ChatPage.jsx` for conversation selection, message display, and budget information.

The application currently displays usage information below individual assistant messages. Monthly budget information is displayed in the chat header.

The frontend communicates with the backend through `frontend/src/services/api.js`. Its shared `apiRequest()` function attaches the JWT authorization token and handles JSON responses and errors.

The new feature can reuse this API communication structure.

## 3. Proposed Architecture and Data Flow

The proposed flow is:

1. The user selects a conversation in the frontend.
2. `ChatPage.jsx` requests the selected conversation's usage summary.
3. The frontend sends an authenticated GET request to the backend.
4. The backend validates the JWT using `authMiddleware`.
5. The backend verifies that the conversation belongs to the authenticated user.
6. PostgreSQL joins `usage_logs` with `messages` using `message_id`.
7. The backend calculates the sum of prompt tokens, response tokens, and estimated cost for the selected conversation.
8. The backend returns the aggregated values as JSON.
9. The frontend displays the usage summary below the conversation title.
10. After a Gemini response finishes successfully, the frontend refreshes the conversation usage summary.

The summary will represent the recorded usage for the entire conversation, not only the current month.

## 4. API Contract

### 4.1 Endpoint

**Method:** `GET`

**Path:** `/api/conversations/:id/usage`

**Authentication:** Required, using the existing JWT authentication middleware.

**Request body:** None.

**Path parameter:** `id` – the conversation identifier.

### 4.2 Successful Response

**HTTP Status:** `200 OK`

Example:

```json
{
  "status": "ok",
  "usage": {
    "conversationId": 12,
    "promptTokens": 1500,
    "candidateTokens": 950,
    "totalTokens": 2450,
    "totalCostUsd": 0.0032
  }
}
```

The example values are illustrative.

### 4.3 Response Field Definitions

| Field | Description |
|---|---|
| `conversationId` | Identifier of the requested conversation |
| `promptTokens` | Total prompt tokens recorded for the conversation |
| `candidateTokens` | Total generated response tokens |
| `totalTokens` | Sum of prompt and response tokens |
| `totalCostUsd` | Total estimated cost in USD |

Token totals will be returned as numbers. The estimated cost will also be returned as a number and displayed with six decimal places in the frontend.

### 4.4 Error Responses

| Status | Condition |
|---|---|
| `400 Bad Request` | Invalid conversation identifier |
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Conversation does not exist or belongs to another user |
| `500 Internal Server Error` | Unexpected server or database error |

Error responses will follow the existing structure:

```json
{
  "status": "error",
  "message": "Sohbet bulunamadı"
}
```

## 5. Database Query Design

The backend will first verify conversation ownership using the authenticated user's ID.

After successful authorization, it will aggregate usage records associated with messages in the selected conversation.

Proposed SQL:

```sql
SELECT
    COALESCE(SUM(ul.prompt_tokens), 0) AS prompt_tokens,
    COALESCE(SUM(ul.candidate_tokens), 0) AS candidate_tokens,
    COALESCE(SUM(ul.cost_usd), 0) AS total_cost_usd
FROM usage_logs ul
INNER JOIN messages m
    ON ul.message_id = m.id
WHERE m.conversation_id = $1
  AND ul.user_id = $2;
```

The query uses parameterized values to avoid SQL injection.

`COALESCE` ensures that a conversation without usage records returns zero totals instead of null values.

The total token count will be calculated by adding the prompt token total and candidate token total.

No new database table is required for the initial implementation.

## 6. Security Considerations

The new endpoint must use the existing `authMiddleware`.

Before returning any usage information, the backend must confirm that the requested conversation belongs to `req.user.userId`.

A conversation owned by another user must return `404 Not Found`, following the existing conversation API behavior. This prevents exposing another user's usage information or confirming whether their conversation exists.

The SQL query must use parameterized values rather than directly inserting user input into the query.

The frontend must not calculate authorization or access usage records directly. All access checks must happen in the backend.

## 7. Frontend Design

The usage summary will appear below the selected conversation title and above the message list.

It will display:

- Total prompt tokens
- Total response tokens
- Total tokens
- Total estimated cost in USD

A new API helper will be added to `frontend/src/services/api.js`:

```javascript
export function getConversationUsage(conversationId) {
  return apiRequest(
    `/api/conversations/${conversationId}/usage`
  );
}
```

`ChatPage.jsx` will maintain a separate state for the selected conversation's usage summary.

The summary will be loaded when a conversation is selected and refreshed after the streaming `done` event.

When a new conversation is created, the summary will initially display zero values.

Loading and error states must be handled so that the interface does not show outdated usage data when the user switches between conversations.

## 8. Acceptance Criteria

The feature will be considered complete when:

1. An authenticated user can request the usage summary of their own conversation.
2. The API returns correct prompt token, response token, total token, and estimated cost values.
3. Usage records are counted only once.
4. A conversation with no recorded usage returns zero totals.
5. An unauthenticated request is rejected.
6. A user cannot access another user's conversation usage.
7. Invalid conversation identifiers are handled appropriately.
8. The frontend displays the summary for the currently selected conversation.
9. The displayed summary updates after a completed Gemini response.
10. Existing messaging, streaming, and monthly budget features continue working.

## 9. Test Plan

### 9.1 Backend Tests

| Test Case | Expected Result |
|---|---|
| Conversation with multiple usage records | Correct aggregated totals |
| Conversation with no usage records | All totals are zero |
| Conversation with one usage record | Values match the stored record |
| Invalid conversation ID | HTTP 400 |
| Nonexistent conversation | HTTP 404 |
| Conversation belonging to another user | HTTP 404 |
| Missing or invalid JWT | HTTP 401 |
| Unexpected database error | HTTP 500 |

### 9.2 Data Integrity Tests

Verify that the query aggregates records from `usage_logs` without adding duplicated values from `messages`.

Verify that records belonging to other conversations are excluded.

Verify that usage records without a linked message are not assigned to a conversation.

Verify that the calculated total token count equals the sum of prompt and response tokens.

### 9.3 Frontend Tests

Verify that selecting a conversation displays its usage summary.

Verify that switching conversations replaces the previous summary.

Verify that a new conversation displays zero usage.

Verify that the summary updates after the streaming response completes.

Verify that loading and error states are displayed correctly.

Verify that the monthly budget summary and individual message usage indicators remain functional.

## 10. Implementation Plan

### Day 47 – Backend and Database Integration

Implement the conversation usage endpoint, ownership validation, and SQL aggregation.

Test successful requests, empty conversations, unauthorized access, invalid IDs, and aggregation accuracy.

### Day 48 – Frontend Integration

Add the frontend API helper and usage state.

Display the conversation summary below the conversation title and refresh it when usage changes.

Test conversation switching, streaming completion, empty conversations, and error handling.

## 11. Conclusion

The proposed conversation usage summary can be implemented using the existing database tables, Express routes, authentication middleware, and frontend API infrastructure.

Using `usage_logs` as the primary data source keeps the new calculation consistent with the current budget system. The design also maintains the existing conversation ownership checks to protect user data.

This document provides the architecture, API contract, security requirements, acceptance criteria, and test plan for the next implementation stages.
