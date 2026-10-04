import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createConversation,
  getConversations,
  getMessages,
  getBudget,
  streamMessage,
} from "../services/api";

function ChatPage({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    loadConversations();
    loadBudget();
  }, []);

  async function loadBudget() {
    try {
      const data = await getBudget();
      setBudget(data.budget);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadConversations() {
    try {
      setError("");

      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleNewConversation() {
    try {
      setError("");

      const data = await createConversation("Yeni Sohbet");
      const conversation = data.conversation;

      setConversations((current) => [
        conversation,
        ...current,
      ]);

      setSelectedConversation(conversation);
      setMessages([]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSelectConversation(conversation) {
    try {
      setError("");
      setSelectedConversation(conversation);

      const data = await getMessages(conversation.id);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const content = input.trim();

    if (!content || !selectedConversation || streaming) {
      return;
    }

    setInput("");
    setError("");
    setStreaming(true);

    const temporaryAssistantId = `stream-${Date.now()}`;

    try {
      await streamMessage(
        selectedConversation.id,
        content,
        (eventName, eventData) => {
          if (eventName === "user_message") {
            setMessages((current) => [
              ...current,
              eventData,
              {
                id: temporaryAssistantId,
                role: "assistant",
                content: "",
                streaming: true,
              },
            ]);
          }

          if (eventName === "chunk") {
            setMessages((current) =>
              current.map((message) =>
                message.id === temporaryAssistantId
                  ? {
                      ...message,
                      content:
                        message.content + eventData.text,
                    }
                  : message
              )
            );
          }

          if (eventName === "done") {
            setMessages((current) =>
              current.map((message) =>
                message.id === temporaryAssistantId
                  ? {
                      ...eventData.assistantMessage,
                      usage: eventData.usage,
                      streaming: false,
                    }
                  : message
              )
            );

            loadBudget();
          }

          if (eventName === "error") {
            setError(
              eventData.message ||
                "Streaming sırasında bir hata oluştu."
            );
          }
        }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <h2>Gemini Web Chat</h2>

        <button className="new-chat-button" type="button" onClick={handleNewConversation}>
          + Yeni Sohbet
        </button>

        <h3 className="sidebar-title">Sohbetler</h3>

        {conversations.map((conversation) => (
          <button
            className={`conversation-button ${selectedConversation?.id === conversation.id ? "active" : ""}`}
            type="button"
            key={conversation.id}
            onClick={() => handleSelectConversation(conversation)}
          >
            {conversation.title}
          </button>
        ))}
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <p className="user-email">{user?.email}</p>

        {budget && (
          <div className="budget-summary">
            <strong>Aylık Kullanım</strong>
            <p>
              Bütçe: ${Number(budget.monthlyBudget).toFixed(2)}
              {" | "}
              Kullanılan: ${Number(budget.monthlyUsage).toFixed(6)}
              {" | "}
              Kalan: ${Number(budget.remainingBudget).toFixed(6)}
              {" | "}
              Kullanım: %{Number(budget.usagePercentage).toFixed(2)}
            </p>

            {budget.warning && (
              <p>{budget.warning}</p>
            )}
          </div>
        )}
        </header>

        {selectedConversation ? (
          <>
            <h1>{selectedConversation.title}</h1>

            <div className="messages-container">
              {messages.map((message) => (
                <div
                  className={`message ${message.role === "user" ? "user-message" : "assistant-message"}`}
                  key={message.id}
                >
                  <strong>
                    {message.role === "user" ? "Sen" : "Gemini"}:
                  </strong>{" "}

                  {message.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}

                  {message.role === "assistant" &&
                    (message.usage ||
                      message.prompt_tokens !== null) && (
                      <small className="usage-badge">
                        {" "}
                        | Prompt:{" "}
                        {message.usage?.promptTokens ??
                          message.prompt_tokens} token
                        | Cevap:{" "}
                        {message.usage?.candidateTokens ??
                          message.candidate_tokens} token
                        | Maliyet: $
                        {Number(
                          message.usage?.costUsd ??
                            message.cost_usd
                        ).toFixed(6)}
                      </small>
                    )}

                  {message.streaming && (
                    <span> ▌</span>
                  )}
                </div>
              ))}
            </div>

            <form className="message-form" onSubmit={handleSubmit}>
              <input
                className="message-input"
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Mesajınızı yazın..."
                disabled={streaming}
              />

              <button
                className="send-button"
                type="submit"
                disabled={
                  streaming || !input.trim()
                }
              >
                {streaming
                  ? "Gemini yanıtlıyor..."
                  : "Gönder"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1>Gemini ile sohbet et</h1>
            <p>
              Yeni bir sohbet başlat veya geçmişten bir
              sohbet seç.
            </p>
          </>
        )}

        {error && <p>{error}</p>}
      </main>
    </div>
  );
}

export default ChatPage;
