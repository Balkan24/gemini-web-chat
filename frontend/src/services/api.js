const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bir hata oluştu.");
  }

  return data;
}

export { API_BASE_URL, apiRequest };

export function register(email, password) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getConversations() {
  return apiRequest("/api/conversations");
}

export function createConversation(title) {
  return apiRequest("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function getConversation(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}`);
}

export function updateConversation(conversationId, title) {
  return apiRequest(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function deleteConversation(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

export function getMessages(conversationId) {
  return apiRequest(`/api/conversations/${conversationId}/messages`);
}

export async function streamMessage(conversationId, content, onEvent) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/messages/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Mesaj gönderilemedi.");
  }

  if (!response.body) {
    throw new Error("Streaming yanıtı alınamadı.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventBlock of events) {
      const lines = eventBlock.split("\n");

      const eventLine = lines.find((line) =>
        line.startsWith("event:")
      );

      const dataLine = lines.find((line) =>
        line.startsWith("data:")
      );

      if (!eventLine || !dataLine) {
        continue;
      }

      const eventName = eventLine.slice(6).trim();
      const eventData = JSON.parse(dataLine.slice(5).trim());

      onEvent(eventName, eventData);
    }
  }
}

export function getBudget() {
  return apiRequest("/api/budget");
}
