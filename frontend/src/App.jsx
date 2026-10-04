import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import { getProfile } from "./services/api";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await getProfile();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
  }

  if (authLoading) {
    return <div>Oturum kontrol ediliyor...</div>;
  }

  if (user) {
    return <ChatPage user={user} />;
  }

  if (page === "register") {
    return (
      <RegisterPage
        onGoToLogin={() => setPage("login")}
      />
    );
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onGoToRegister={() => setPage("register")}
    />
  );
}

export default App;