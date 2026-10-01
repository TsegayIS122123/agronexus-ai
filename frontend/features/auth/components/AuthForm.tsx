"use client";

/**
 * Shared building blocks for the auth screens.
 *
 * The accessibility rules are implemented once here rather than per screen,
 * because the rules that matter are structural and easy to get subtly wrong:
 *
 *  - every control has a real <label for>, not a placeholder standing in for one
 *  - an invalid control carries aria-invalid and points at its error with
 *    aria-describedby, so the message is announced rather than only seen
 *  - a failed submit moves focus to a summary with role="alert", so a keyboard or
 *    screen-reader user is told what went wrong without hunting for it
 *  - the first invalid control receives focus when the summary is not enough
 *  - state is never carried by colour alone; the strength meter says its value
 */

import { useCallback, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/Button";

/* ------------------------------------------------------------------ layout */

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface-secondary flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-surface-primary shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-2 text-text-secondary">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-text-secondary">{footer}</div>}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------- fields */

export interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  testId?: string;
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  hint,
  autoComplete,
  inputMode,
  required = true,
  placeholder,
  disabled,
  name,
  testId,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-primary">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={testId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={[
          "mt-1 w-full rounded-lg border px-3 py-2 text-text-primary",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          error
            ? "border-status-error focus:ring-status-error"
            : "border-border focus:ring-brand-500",
          "disabled:bg-surface-tertiary disabled:cursor-not-allowed",
        ].join(" ")}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-status-error">
          {error}
        </p>
      )}
    </div>
  );
}

export type PasswordFieldProps = Omit<FieldProps, "type"> & {
  showLabelShow: string;
  showLabelHide: string;
};

export function PasswordField({ showLabelShow, showLabelHide, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Field {...props} type={visible ? "text" : "password"} autoComplete={props.autoComplete ?? "current-password"} />
      <button
        type="button"
        onClick={() => setVisible((was) => !was)}
        aria-pressed={visible}
        className="mt-1 text-xs font-medium text-brand-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
      >
        {visible ? showLabelHide : showLabelShow}
      </button>
    </div>
  );
}

/* -------------------------------------------------------- password strength */

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  problems: string[];
}

/**
 * Length is weighted most heavily because it is what actually resists guessing;
 * character-class variety is counted but cannot rescue a short password. The
 * service only enforces 8-128 characters, so the meter is advisory and says
 * plainly what is missing.
 */
export function scorePassword(password: string, labels: { weak: string; fair: string; good: string; strong: string; addLength: string; addVariety: string }): Strength {
  if (!password) return { score: 0, label: labels.weak, problems: [] };

  const problems: string[] = [];
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length < 12) problems.push(labels.addLength);
  if (classes < 3) problems.push(labels.addVariety);

  let score: Strength["score"] = 0;
  if (password.length >= 8) score = 1;
  if (password.length >= 12 && classes >= 2) score = 2;
  if (password.length >= 12 && classes >= 3) score = 3;
  if (password.length >= 16 && classes >= 3) score = 4;

  const label = [labels.weak, labels.weak, labels.fair, labels.good, labels.strong][score];
  return { score, label, problems };
}

export function PasswordStrength({ value, strength }: { value: string; strength: Strength }) {
  if (!value) return null;
  const tone = ["bg-border", "bg-status-error", "bg-status-warning", "bg-brand-500", "bg-status-success"][strength.score];

  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= strength.score ? tone : "bg-border"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-text-secondary">
        {strength.label}
        {strength.problems.length > 0 && <span className="block">{strength.problems.join(" · ")}</span>}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- error summary */

export function ErrorSummary({
  errors,
  serverError,
  heading,
  id,
}: {
  errors: Record<string, string>;
  serverError?: string;
  heading: string;
  id: string;
}) {
  const entries = Object.entries(errors).filter(([, value]) => value);
  if (!serverError && entries.length === 0) return null;

  return (
    <div
      id={id}
      tabIndex={-1}
      role="alert"
      className="rounded-lg border border-status-error bg-red-50 p-3 text-sm text-status-error focus:outline-none focus:ring-2 focus:ring-status-error"
    >
      <p className="font-semibold">{heading}</p>
      {serverError && <p className="mt-1">{serverError}</p>}
      {entries.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {entries.map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SuccessNotice({ children, id }: { children: ReactNode; id: string }) {
  return (
    <div
      id={id}
      role="status"
      className="rounded-lg border border-status-success bg-green-50 p-3 text-sm text-text-primary"
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- hook */

export interface AuthFormState {
  values: Record<string, string>;
  set: (field: string, value: string) => void;
  errors: Record<string, string>;
  setError: (field: string, message: string) => void;
  serverError: string | undefined;
  setServerError: (message: string | undefined) => void;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  summaryId: string;
  /** Validates, then focuses the summary or the first bad control. */
  report: (errors: Record<string, string>) => void;
  noticeRef: React.RefObject<HTMLDivElement | null>;
}

export function useAuthForm(initial: Record<string, string> = {}): AuthFormState {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const noticeRef = useRef<HTMLDivElement | null>(null);
  const summaryId = useId();

  const set = useCallback((field: string, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const { [field]: _removed, ...rest } = previous;
      return rest;
    });
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setErrors((previous) => ({ ...previous, [field]: message }));
  }, []);

  const report = useCallback(
    (next: Record<string, string>) => {
      setErrors(next);
      if (Object.keys(next).length === 0) return;

      // Let the summary render before moving focus to it.
      window.requestAnimationFrame(() => {
        const summary = document.getElementById(summaryId);
        summary?.focus();
      });
    },
    [summaryId],
  );

  return {
    values,
    set,
    errors,
    setError,
    serverError,
    setServerError,
    submitting,
    setSubmitting,
    summaryId,
    report,
    noticeRef,
  };
}

export { Button };
