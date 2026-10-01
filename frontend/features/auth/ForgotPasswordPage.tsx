"use client";

import { useState } from "react";
import Link from "next/link";

import { useLocaleValue } from "@/components/LocaleProvider";
import { authApi, RateLimitedError } from "./api";
import {
  AuthShell,
  Button,
  ErrorSummary,
  Field,
  SuccessNotice,
  useAuthForm,
} from "./components/AuthForm";

export default function ForgotPasswordPage() {
  const { t } = useLocaleValue();
  const form = useAuthForm({ email: "" });
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);

    const email = form.values.email.trim();
    if (!email) {
      form.report({ email: t("authFieldRequired") });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.report({ email: t("authFieldEmail") });
      return;
    }

    form.setSubmitting(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      form.setServerError(
        error instanceof RateLimitedError ? t("authRateLimited") : t("authNetworkError"),
      );
    } finally {
      form.setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={t("authForgotTitle")}
      subtitle={t("authForgotSubtitle")}
      footer={
        <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
          {t("authBackToLogin")}
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          {/* Deliberately identical whether or not the address has an account:
              the service always answers 200 so this form cannot be used to find
              out who is registered. */}
          <SuccessNotice id="forgot-sent">{t("authForgotSent")}</SuccessNotice>
          <Link href="/auth/login" className="block text-center text-sm font-medium text-brand-700 hover:underline">
            {t("authBackToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <ErrorSummary
            id={form.summaryId}
            heading={t("authErrorsHeading")}
            serverError={form.serverError}
            errors={form.errors}
          />

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
            testId="forgot-email"
          />

          <Button type="submit" size="lg" loading={form.submitting} className="w-full">
            {t("authForgotSubmit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
