import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
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
