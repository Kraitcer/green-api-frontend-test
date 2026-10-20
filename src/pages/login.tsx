import { useActionState, useEffect, useState } from "react";
import type { ChangeEvent, InvalidEvent } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import type { RootState } from "../store/store";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.credentials !== null,
  );
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    idInstance: "",
    apiTokenInstance: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [actionError, submitAction, isPending] = useActionState(
    async (
      _previous: string | null,
      formData: FormData,
    ): Promise<string | null> => {
      setShowError(true);
      try {
        const success = await login({
          idInstance: String(formData.get("idInstance") ?? ""),
          apiTokenInstance: String(formData.get("apiTokenInstance") ?? ""),
        });
        if (success) {
          await navigate("/chat", { replace: true });
        }
        return null;
      } catch {
        return "Не удалось выполнить вход. Попробуйте ещё раз.";
      }
    },
    null,
  );
  const busy = isPending || isLoading;
  const visibleError = showError ? (actionError ?? error) : null;

  useEffect(() => {
    if (isAuthenticated) void navigate("/chat", { replace: true });
  }, [isAuthenticated, navigate]);

  function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const message = input.validity.valueMissing
      ? `Введите ${input.name}.`
      : input.name === "idInstance"
        ? "idInstance должен содержать только цифры."
        : "Токен может содержать латинские буквы, цифры, дефис и подчёркивание.";
    input.setCustomValidity(message);
    setFieldErrors((previous) => ({ ...previous, [input.name]: message }));
    setShowError(false);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    input.setCustomValidity("");
    setCredentials((previous) => ({ ...previous, [input.name]: input.value }));
    setFieldErrors((previous) => ({ ...previous, [input.name]: "" }));
    setShowError(false);
  }

  return (
    <main className="login-page">
      <header className="login-brand">
        <img src="/max-logo.png" alt="" width="48" height="48" />
        <span>
          MAX <span className="login-brand-divider">/</span> GREEN-API
        </span>
      </header>

      <section className="login-content" aria-labelledby="login-title">
        <span className="login-eyebrow">Личный чат</span>
        <h1 id="login-title">Вход в MAX</h1>
        <form action={submitAction} aria-busy={busy}>
          <fieldset disabled={busy}>
            <legend className="login-sr-only">Учётные данные GREEN-API</legend>
            <div className="login-field">
              <label htmlFor="idInstance">idInstance</label>
              <input
                id="idInstance"
                name="idInstance"
                type="text"
                inputMode="numeric"
                autoComplete="username"
                required
                pattern="[0-9]+"
                value={credentials.idInstance}
                onChange={handleChange}
                onInvalid={handleInvalid}
                aria-invalid={Boolean(fieldErrors.idInstance)}
                aria-describedby={
                  fieldErrors.idInstance ? "instance-error" : undefined
                }
                placeholder="ID инстанса"
                spellCheck={false}
              />
              {fieldErrors.idInstance && (
                <p id="instance-error" className="login-field-error">
                  {fieldErrors.idInstance}
                </p>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="apiTokenInstance">apiTokenInstance</label>
              <input
                id="apiTokenInstance"
                name="apiTokenInstance"
                type="password"
                autoComplete="off"
                autoCapitalize="none"
                required
                pattern="[A-Za-z0-9_\-]+"
                value={credentials.apiTokenInstance}
                onChange={handleChange}
                onInvalid={handleInvalid}
                aria-invalid={Boolean(fieldErrors.apiTokenInstance)}
                aria-describedby={
                  fieldErrors.apiTokenInstance ? "token-error" : undefined
                }
                placeholder="Токен инстанса"
                spellCheck={false}
              />
              {fieldErrors.apiTokenInstance && (
                <p id="token-error" className="login-field-error">
                  {fieldErrors.apiTokenInstance}
                </p>
              )}
            </div>

            <div
              className="login-feedback"
              aria-live="polite"
              aria-atomic="true"
            >
              {visibleError && <p role="alert">{visibleError}</p>}
            </div>
            <button className="login-submit" type="submit" disabled={busy}>
              {busy ? "Проверяем данные..." : "Войти"}
            </button>
          </fieldset>
        </form>
      </section>
      <footer className="login-footer">MAX · GREEN-API</footer>
    </main>
  );
};

export default Login;
