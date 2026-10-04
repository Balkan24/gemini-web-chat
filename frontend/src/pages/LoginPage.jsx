import { useState } from "react";
import { login } from "../services/api";

function LoginPage({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await login(email, password);

      localStorage.setItem("token", data.token);
      onLogin(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Giriş Yap</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">E-posta</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="login-password">Parola</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button type="button" onClick={onGoToRegister}>
        Hesabın yok mu? Kayıt ol
      </button>
    </div>
  );
}

export default LoginPage;
