"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="login-form">
      <label className="f">
        <span className="f-label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required autoFocus />
      </label>
      {state?.error && (
        <p className="toast err" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "A verificar…" : "Entrar"}
      </button>
    </form>
  );
}
