import { useState } from "react";
import { register } from "../services/api";

function RegisterPage({ onGoToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await register(email, password);
      setMessage("Kayıt başarılı. Giriş yapabilirsiniz.");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Kayıt Ol</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="register-email">E-posta</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="register-password">Parola</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button type="button" onClick={onGoToLogin}>
        Zaten hesabın var mı? Giriş yap
      </button>
    </div>
  );
}

export default RegisterPage;
