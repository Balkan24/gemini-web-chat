import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createConversation,
  getConversations,
  getMessages,
  getBudget,
  getConversationUsage,
  streamMessage,
  updateConversation,
  deleteConversation,
} from "../services/api";

function ChatPage({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const deleteModalRef = useRef(null);
  const cancelDeleteButtonRef = useRef(null);
  const deleteTriggerButtonRef = useRef(null);
  const newChatButtonRef = useRef(null);
  const shouldRestoreDeleteFocusRef = useRef(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [budget, setBudget] = useState(null);

  const [conversationUsage, setConversationUsage] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");

  // Eski sohbetlere ait API yanıtlarının yeni sohbeti
  // etkilemesini önlemek için istek kimliği tutulur.
  const usageRequestId = useRef(0);
  const messagesRequestId = useRef(0);

  useEffect(() => {
    async function initialize() {
      try {
        const [conversationData, budgetData] = await Promise.all([
          getConversations(),
          getBudget(),
        ]);

        setConversations(conversationData.conversations || []);
        setBudget(budgetData.budget);
      } catch (err) {
        setError(err.message);
      }
    }

    initialize();
  }, []);

  async function loadBudget() {
    try {
      const data = await getBudget();
      setBudget(data.budget);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadConversationUsage(conversationId) {
    const requestId = ++usageRequestId.current;

    setConversationUsage(null);
    setUsageError("");
    setUsageLoading(true);

    try {
      const data = await getConversationUsage(conversationId);

      if (requestId !== usageRequestId.current) {
        return;
      }

      setConversationUsage(data.usage);
    } catch (err) {
      if (requestId !== usageRequestId.current) {
        return;
      }

      setUsageError(err.message);
    } finally {
      if (requestId === usageRequestId.current) {
        setUsageLoading(false);
      }
    }
  }

  async function refreshConversationUsage(conversationId) {
    const requestId = ++usageRequestId.current;

    setUsageError("");
    setUsageLoading(true);

    try {
      const data = await getConversationUsage(conversationId);

      if (requestId !== usageRequestId.current) {
        return;
      }

      setConversationUsage(data.usage);
    } catch (err) {
      if (requestId === usageRequestId.current) {
        setUsageError(err.message);
      }
    } finally {
      if (requestId === usageRequestId.current) {
        setUsageLoading(false);
      }
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

      ++messagesRequestId.current;
      setSelectedConversation(conversation);
      setMessages([]);
      setInput("");

      loadConversationUsage(conversation.id);
    } catch (err) {
      setError(err.message);
    }
  }
  function handleStartEditing(conversation) {
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
    setError("");
  }
  async function handleSaveTitle(conversationId) {
    const newTitle = editingTitle.trim();

    if (!newTitle) {
      setError("Sohbet başlığı boş olamaz.");
      return;
    }

    if (savingTitle) {
      return;
    }

    try {
      setSavingTitle(true);
      setError("");

      const data = await updateConversation(conversationId, newTitle);
      const updatedConversation = data.conversation;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === updatedConversation.id
            ? updatedConversation
            : conversation
        )
      );

      setSelectedConversation((current) =>
        current?.id === updatedConversation.id
          ? updatedConversation
          : current
      );

      setEditingConversationId(null);
      setEditingTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingTitle(false);
    }
  }
  function handleCancelEditing() {
    setEditingConversationId(null);
    setEditingTitle("");
    setError("");
  }
  useEffect(() => {
    if (!conversationToDelete) {
      if (shouldRestoreDeleteFocusRef.current) {
        const trigger = deleteTriggerButtonRef.current;
        const focusTarget = trigger?.isConnected ? trigger : newChatButtonRef.current;
        focusTarget?.focus();
        shouldRestoreDeleteFocusRef.current = false;
      }
      return;
    }

    if (!deleteModalRef.current?.contains(document.activeElement)) {
      (deletingConversation ? deleteModalRef.current : cancelDeleteButtonRef.current)?.focus();
    }

    function handleModalKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!deletingConversation) {
          setConversationToDelete(null);
          setError("");
        }
        return;
      }

      if (event.key !== "Tab") return;

      const modal = deleteModalRef.current;
      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !modal.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !modal.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleFocusOutside(event) {
      if (!deleteModalRef.current?.contains(event.target)) {
        if (deletingConversation) {
          deleteModalRef.current?.focus();
        } else {
          cancelDeleteButtonRef.current?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleModalKeyDown);
    document.addEventListener("focusin", handleFocusOutside);
    return () => {
      document.removeEventListener("keydown", handleModalKeyDown);
      document.removeEventListener("focusin", handleFocusOutside);
    };
  }, [conversationToDelete, deletingConversation]);

  function handleStartDeleting(conversation, triggerButton) {
    deleteTriggerButtonRef.current = triggerButton;
    shouldRestoreDeleteFocusRef.current = true;
    setConversationToDelete(conversation);
    setError("");
  }

  function handleCancelDeleting() {
    setConversationToDelete(null);
    setError("");
  }
  async function handleConfirmDeleting() {
    if (!conversationToDelete || deletingConversation) {
      return;
    }

    const conversationId = conversationToDelete.id;

    try {
      setDeletingConversation(true);
      setError("");

      await deleteConversation(conversationId);

      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId)
      );

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
        setInput("");
      }

      setConversationToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingConversation(false);
    }
  }
  async function handleSelectConversation(conversation) {
    if (streaming) {
      return;
    }

    setError("");
    setSelectedConversation(conversation);
    setMessages([]);
    setInput("");

    const requestId = ++messagesRequestId.current;

    loadConversationUsage(conversation.id);

    try {
      const data = await getMessages(conversation.id);

      if (requestId !== messagesRequestId.current) {
        return;
      }

      setMessages(data.messages || []);
    } catch (err) {
      if (requestId === messagesRequestId.current) {
        setError(err.message);
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const content = input.trim();

    if (!content || !selectedConversation || streaming) {
      return;
    }

    const conversationId = selectedConversation.id;

    setInput("");
    setError("");
    setStreaming(true);

    const temporaryAssistantId = `stream-${Date.now()}`;

    try {
      await streamMessage(
        conversationId,
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

            refreshConversationUsage(conversationId);
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
      const isNetworkError =
        err instanceof TypeError ||
        err.message === "Load failed" ||
        err.message === "Failed to fetch";

      setError(
        isNetworkError
          ? "Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin ve tekrar deneyin."
          : err.message
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <h2>Gemini Web Chat</h2>

        <button
          ref={newChatButtonRef}
          className="new-chat-button"
          type="button"
          onClick={handleNewConversation}
          disabled={streaming}
        >
          + Yeni Sohbet
        </button>

        <h3 className="sidebar-title">Sohbetler</h3>
        <input
          className="conversation-search"
          type="search"
          placeholder="Sohbetlerde ara..."
          aria-label="Sohbetlerde ara"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        {conversations
          .filter((conversation) =>
            (conversation.title || "")
              .toLocaleLowerCase("tr-TR")
              .includes(searchQuery.trim().toLocaleLowerCase("tr-TR"))
          )
          .map((conversation) => (
            <div className="conversation-item" key={conversation.id}>
              {editingConversationId === conversation.id ? (
                <div className="conversation-edit">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    aria-label="Yeni sohbet başlığı"
                    disabled={savingTitle}
                  />

                  <button
                    type="button"
                    onClick={() => handleSaveTitle(conversation.id)}
                    disabled={savingTitle}
                  >
                    {savingTitle ? "Kaydediliyor..." : "Kaydet"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={savingTitle}
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className={`conversation-button ${selectedConversation?.id === conversation.id ? "active" : ""
                      }`}
                    type="button"
                    disabled={streaming}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    {conversation.title}
                  </button>

                  <button
                    type="button"
                    className="edit-conversation-button"
                    disabled={streaming}
                    onClick={() => handleStartEditing(conversation)}
                    aria-label={`${conversation.title} başlığını düzenle`}
                    title="Sohbet adını düzenle"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="delete-conversation-button"
                    onClick={(event) => handleStartDeleting(conversation, event.currentTarget)}
                    aria-label={`${conversation.title} sohbetini sil`}
                    title="Sohbeti sil"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          ))}
      </aside>
      {conversationToDelete && (
        <div className="delete-confirmation-overlay">
          <div
            className="delete-confirmation-modal"
            ref={deleteModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
            aria-describedby="delete-confirmation-description"
            tabIndex={-1}
          >
            <h3 id="delete-confirmation-title">
              Sohbeti silmek istiyor musun?
            </h3>

            <p id="delete-confirmation-description">
              <strong>{conversationToDelete.title}</strong> adlı sohbet
              silinecek. Bu işlem geri alınamaz.
            </p>

            <div className="delete-confirmation-actions">
              <button
                ref={cancelDeleteButtonRef}
                type="button"
                onClick={handleCancelDeleting}
                disabled={deletingConversation}
              >
                İptal
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleting}
                disabled={deletingConversation}
              >
                {deletingConversation ? "Siliniyor..." : "Sohbeti Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="chat-main">
        <header className="chat-header">
          <p className="user-email">{user?.email}</p>

          <button type="button" onClick={onLogout}>
            Çıkış Yap
          </button>

          {budget && (
            <div className="budget-summary">
              <strong>Aylık Kullanım</strong>

              <p>
                Aylık Bütçe: ${Number(budget.monthlyBudget).toFixed(2)}
              </p>

              <p>
                Kullanılan: ${Number(budget.monthlyUsage).toFixed(6)}
              </p>

              <p>
                <strong>
                  Kalan Bütçe: ${Math.max(
                    0,
                    Number(budget.remainingBudget)
                  ).toFixed(6)}
                </strong>
              </p>

              <p>
                Kullanım Oranı: %{Number(budget.usagePercentage).toFixed(2)}
              </p>

              <div
                className="budget-progress"
                role="progressbar"
                aria-label="Aylık bütçe kullanım oranı"
                aria-valuenow={Math.min(
                  100,
                  Math.max(0, Number(budget.usagePercentage))
                )}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="budget-progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(budget.usagePercentage))
                    )}%`,
                  }}
                />
              </div>

              {budget.limitExceeded ? (
                <p className="budget-alert">
                  Aylık bütçe limitinize ulaştınız. Yeni mesaj gönderemeyebilirsiniz.
                </p>
              ) : budget.warning ? (
                <p className="budget-alert">
                  Dikkat! Aylık bütçenizin en az %80'ini kullandınız.
                </p>
              ) : null}
            </div>
          )}
        </header>

        {selectedConversation ? (
          <>
            <h1>{selectedConversation.title}</h1>

            <section
              className="conversation-usage-summary"
              aria-label="Sohbet kullanım özeti"
            >
              <div className="conversation-usage-heading">
                <h2>Sohbet Kullanım Özeti</h2>
                <button
                  type="button"
                  disabled={usageLoading || streaming}
                  onClick={() =>
                    refreshConversationUsage(
                      selectedConversation.id
                    )
                  }
                >
                  Yenile
                </button>
              </div>

              {usageLoading && !conversationUsage && (
                <p role="status">
                  Kullanım bilgileri yükleniyor...
                </p>
              )}

              {usageError && (
                <p className="conversation-usage-error" role="alert">
                  Kullanım bilgileri alınamadı: {usageError}
                </p>
              )}

              {conversationUsage && (
                <div className="conversation-usage-grid">
                  <div>
                    <span>Prompt Token</span>
                    <strong>
                      {conversationUsage.promptTokens}
                    </strong>
                  </div>

                  <div>
                    <span>Cevap Token</span>
                    <strong>
                      {conversationUsage.candidateTokens}
                    </strong>
                  </div>

                  <div>
                    <span>Toplam Token</span>
                    <strong>
                      {conversationUsage.totalTokens}
                    </strong>
                  </div>

                  <div>
                    <span>Toplam Maliyet</span>
                    <strong>
                      $
                      {Number(
                        conversationUsage.totalCostUsd
                      ).toFixed(6)}
                    </strong>
                  </div>
                </div>
              )}

              {usageLoading && conversationUsage && (
                <p className="conversation-usage-updating" role="status">
                  Kullanım bilgileri güncelleniyor...
                </p>
              )}
            </section>

            <div className="messages-container">
              {messages.map((message) => (
                <div
                  className={`message ${message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                    }`}
                  key={message.id}
                >
                  <strong>
                    {message.role === "user"
                      ? "Sen"
                      : "Gemini"}
                    :
                  </strong>{" "}

                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}

                  {message.role === "assistant" &&
                    (message.usage ||
                      message.prompt_tokens != null) && (
                      <small className="usage-badge">
                        {" "}
                        | Prompt:{" "}
                        {message.usage?.promptTokens ??
                          message.prompt_tokens}{" "}
                        token | Cevap:{" "}
                        {message.usage?.candidateTokens ??
                          message.candidate_tokens}{" "}
                        token | Maliyet: $
                        {Number(
                          message.usage?.costUsd ??
                          message.cost_usd
                        ).toFixed(6)}
                      </small>
                    )}

                  {message.streaming && <span> ▌</span>}
                </div>
              ))}
            </div>

            <form
              className="message-form"
              onSubmit={handleSubmit}
            >
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
                disabled={streaming || !input.trim()}
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

        {error && <p role="alert">{error}</p>}
      </main>
    </div>
  );
}

export default ChatPage;
