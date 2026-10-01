"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocaleValue } from "@/components/LocaleProvider";
import { authApi, EmailNotVerifiedError, RateLimitedError } from "./api";
import { establish } from "./session";
import {
  AuthShell,
  Button,
  ErrorSummary,
  Field,
  PasswordField,
  SuccessNotice,
  useAuthForm,
} from "./components/AuthForm";

export default function LoginPage() {
  const { t } = useLocaleValue();
  const router = useRouter();
  const form = useAuthForm({ email: "", password: "" });
  const [unverified, setUnverified] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);
    setUnverified(null);
    setResent(false);

    const errors: Record<string, string> = {};
    if (!form.values.email.trim()) errors.email = t("authFieldRequired");
    if (!form.values.password) errors.password = t("authFieldRequired");
    if (Object.keys(errors).length > 0) {
      form.report(errors);
      return;
    }

    form.setSubmitting(true);
    try {
      const result = await authApi.login({
        email: form.values.email.trim(),
        password: form.values.password,
      });
      await establish(result);
      const role = result.user.role ?? "farmer";
      router.push(`/${role}/dashboard`);
    } catch (error) {
      if (error instanceof EmailNotVerifiedError) {
        setUnverified(form.values.email.trim());
      } else if (error instanceof RateLimitedError) {
        form.setServerError(t("authRateLimited"));
      } else {
        // The service returns one message for a wrong password and for an
        // unknown account. Showing anything more specific here would turn the
        // form into a way to discover which addresses have accounts.
        form.setServerError(t("authInvalidCredentials"));
      }
    } finally {
      form.setSubmitting(false);
    }
  }

  async function onResend() {
    if (!unverified) return;
    setResending(true);
    try {
      await authApi.resendVerification(unverified);
      setResent(true);
    } catch {
      form.setServerError(t("authNetworkError"));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title={t("authSignInTitle")}
      subtitle={t("authSignInSubtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="font-medium text-brand-700 hover:underline">
            {t("createOneNow")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <ErrorSummary
          id={form.summaryId}
          heading={t("authErrorsHeading")}
          serverError={form.serverError}
          errors={form.errors}
        />

        {unverified && !resent && (
          <div role="status" className="rounded-lg border border-status-warning bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-text-primary">{t("authUnverifiedTitle")}</p>
            <p className="mt-1 text-text-secondary">{t("authUnverifiedBody")}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={resending}
                onClick={onResend}
              >
                {t("authResendVerification")}
              </Button>
              <Link
                href="/auth/verify-email"
                className="self-center text-sm font-medium text-brand-700 hover:underline"
              >
                {t("authEnterTokenManually")}
              </Link>
            </div>
          </div>
        )}

        {resent && <SuccessNotice id="resent-notice">{t("authResendSent")}</SuccessNotice>}

        <Field
          label={t("authEmail")}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.values.email}
          onChange={(value) => form.set("email", value)}
          error={form.errors.email}
          disabled={form.submitting}
          testId="login-email"
        />

        <PasswordField
          label={t("authPassword")}
          value={form.values.password}
          onChange={(value) => form.set("password", value)}
          error={form.errors.password}
          disabled={form.submitting}
          showLabelShow={t("authShowPassword")}
          showLabelHide={t("authHidePassword")}
          testId="login-password"
        />

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            {t("authForgotLink")}
          </Link>
        </div>

        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          {form.submitting ? t("signingIn") : t("authSignIn")}
        </Button>
      </form>
    </AuthShell>
  );
}
