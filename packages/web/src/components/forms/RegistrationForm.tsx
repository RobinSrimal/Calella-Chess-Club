import { useState, type FormEvent } from "react";
import { registerUser } from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";
import { messageForErrorCode } from "./auth-form-state";

type RegistrationFormProps = {
  locale: Locale;
  labels: {
    username: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    success: string;
  };
};

export function RegistrationForm({ locale, labels }: RegistrationFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setMessage(undefined);
    setIsSubmitting(true);

    const result = await registerUser({ username, email, password, locale });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(messageForErrorCode(result.code));
      return;
    }

    setPassword("");
    setMessage(labels.success);
  }

  return (
    <form className="field-stack" onSubmit={onSubmit}>
      <label>
        {labels.username}
        <input
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
          required
        />
      </label>
      <label>
        {labels.email}
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
        />
      </label>
      <label>
        {labels.password}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          required
        />
      </label>
      {message ? (
        <p className="form-message success" role="status">
          {message}
        </p>
      ) : null}
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
