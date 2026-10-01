"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useLocaleValue } from "@/components/LocaleProvider";
import { authApi, ApiError, errorText, RateLimitedError } from "./api";
import {
  AuthShell,
  Button,
  ErrorSummary,
  Field,
  SuccessNotice,
  useAuthForm,
} from "./components/AuthForm";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { t } = useLocaleValue();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const form = useAuthForm({ email: emailFromQuery, token: "" });

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  // Read inside the interval without re-creating it every second.
  const emailRef = useRef(emailFromQuery);
  emailRef.current = form.values.email;

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((was) => was - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    // Spoken once when the wait starts and once when it ends. A live region that
    // re-announced a number every second would make the page unusable with a
    // screen reader, so the ticking digits themselves are hidden from assistive
    // technology and only the sentence below is announced.
    if (secondsLeft === RESEND_COOLDOWN_SECONDS) {
      setAnnouncement(t("authResendWaitAria"));
    } else if (secondsLeft === 0) {
      setAnnouncement(t("authResendReadyAria"));
    }
  }, [secondsLeft, t]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);

    const errors: Record<string, string> = {};
    const token = form.values.token.trim();
    if (token.length < 16) errors.token = t("authFieldToken");
    if (Object.keys(errors).length > 0) {
      form.report(errors);
      return;
    }

    setBusy(true);
    try {
      await authApi.verifyEmail(token);
      setVerified(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        // The service burns a token on first use, so a replay means this code
        // was already spent. Say that rather than calling it invalid.
        form.setServerError(t("authTokenAlreadyUsed"));
      } else if (error instanceof RateLimitedError) {
        form.setServerError(t("authRateLimited"));
      } else {
        form.setServerError(errorText(error) || t("authNetworkError"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    const email = emailRef.current.trim();
    if (!email) {
      form.setError("email", t("authFieldRequired"));
      return;
    }
    setBusy(true);
    try {
      await authApi.resendVerification(email);
      setSent(true);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      form.setServerError(
        error instanceof RateLimitedError ? t("authRateLimited") : t("authNetworkError"),
      );
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <AuthShell title={t("authVerifySuccessTitle")} subtitle={t("authVerifySuccessBody")}>
        <Button
          onClick={() => {
            window.location.href = "/auth/login";
          }}
          size="lg"
          className="w-full"
        >
          {t("authGoToLogin")}
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("authVerifyTitle")}
      subtitle={t("authVerifySubtitle")}
      footer={
        <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
          {t("authBackToLogin")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <ErrorSummary
          id={form.summaryId}
          heading={t("authErrorsHeading")}
          serverError={form.serverError}
          errors={form.errors}
        />

        {sent && <SuccessNotice id="verify-sent">{t("authResendSent")}</SuccessNotice>}

        <Field
          label={t("authEmail")}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.values.email}
          onChange={(value) => form.set("email", value)}
          error={form.errors.email}
          disabled={busy}
          hint={t("authEmailOptionalHint")}
          testId="verify-email"
        />

        <Field
          label={t("authVerifyToken")}
          value={form.values.token}
          onChange={(value) => form.set("token", value)}
          error={form.errors.token}
          disabled={busy}
          hint={t("authVerifyTokenHint")}
          testId="verify-token"
        />

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <Button type="submit" size="lg" loading={busy} className="w-full">
          {t("authVerifySubmit")}
        </Button>

        <div className="border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onResend}
            disabled={busy || secondsLeft > 0}
            className="w-full"
          >
            {secondsLeft > 0 ? (
              <>
                <span aria-hidden="true">{t("authResendIn", { seconds: secondsLeft })}</span>
                <span className="sr-only">{t("authResendWaitAria")}</span>
              </>
            ) : (
              t("authResend")
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
