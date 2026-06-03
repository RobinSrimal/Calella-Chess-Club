import { useState, type FormEvent } from "react";
import { getCurrentUser, loginUser } from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";
import { messageForErrorCode, redirectPathForUser } from "./auth-form-state";

type LoginFormProps = {
  locale: Locale;
  labels: {
    usernameOrEmail: string;
    password: string;
    submit: string;
    submitting: string;
  };
};

export function LoginForm({ locale, labels }: LoginFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const loginResult = await loginUser({ usernameOrEmail, password });
    if (!loginResult.ok) {
      setError(messageForErrorCode(loginResult.code));
      setIsSubmitting(false);
      return;
    }

    const meResult = await getCurrentUser();
    if (!meResult.ok) {
      setError(messageForErrorCode(meResult.code));
      setIsSubmitting(false);
      return;
    }

    window.location.assign(redirectPathForUser(meResult.data.user, locale));
  }

  return (
    <form className="field-stack" onSubmit={onSubmit}>
      <label>
        {labels.usernameOrEmail}
        <input
          name="usernameOrEmail"
          autoComplete="username"
          value={usernameOrEmail}
          onChange={(event) => setUsernameOrEmail(event.currentTarget.value)}
          required
        />
      </label>
      <label>
        {labels.password}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
        />
      </label>
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button-link" type="submit" disabled={isSubmitting}>
        {isSubmitting ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
