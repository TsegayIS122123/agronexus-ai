"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useLocaleValue } from "@/components/LocaleProvider";
import { authApi, ApiError, errorText, RateLimitedError } from "./api";
import {
  AuthShell,
  Button,
  ErrorSummary,
  Field,
  PasswordField,
  PasswordStrength,
  SuccessNotice,
  scorePassword,
  useAuthForm,
} from "./components/AuthForm";

export default function ResetPasswordPage() {
  const { t } = useLocaleValue();
  const searchParams = useSearchParams();
  const form = useAuthForm({
    token: searchParams.get("token") ?? "",
    password: "",
    confirm: "",
  });
  const [done, setDone] = useState(false);

  const strength = scorePassword(form.values.password, {
    weak: t("authPwWeak"),
    fair: t("authPwFair"),
    good: t("authPwGood"),
    strong: t("authPwStrong"),
    addLength: t("authPwAddLength"),
    addVariety: t("authPwAddVariety"),
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);

    const errors: Record<string, string> = {};
    const token = form.values.token.trim();
    if (token.length < 16) errors.token = t("authFieldToken");
    if (form.values.password.length < 8) errors.password = t("authFieldPassword");
    if (form.values.password !== form.values.confirm) errors.confirm = t("authFieldMatch");
    if (Object.keys(errors).length > 0) {
      form.report(errors);
      return;
    }

    form.setSubmitting(true);
    try {
      await authApi.resetPassword(token, form.values.password);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 403)) {
        form.setError("token", t("authTokenInvalid"));
      } else if (error instanceof RateLimitedError) {
        form.setServerError(t("authRateLimited"));
      } else {
        form.setServerError(errorText(error) || t("authNetworkError"));
      }
    } finally {
      form.setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell title={t("authResetSuccessTitle")} subtitle={t("authResetSuccessBody")}>
        <Link
          href="/auth/login"
          className="block w-full rounded-lg bg-green-600 px-6 py-3 text-center text-base font-medium text-white hover:bg-green-700"
        >
          {t("authGoToLogin")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("authResetTitle")}
      subtitle={t("authResetSubtitle")}
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

        <Field
          label={t("authResetToken")}
          value={form.values.token}
          onChange={(value) => form.set("token", value)}
          error={form.errors.token}
          disabled={form.submitting}
          hint={t("authResetTokenHint")}
          testId="reset-token"
        />

        <div>
          <PasswordField
            label={t("authNewPassword")}
            autoComplete="new-password"
            value={form.values.password}
            onChange={(value) => form.set("password", value)}
            error={form.errors.password}
            disabled={form.submitting}
            showLabelShow={t("authShowPassword")}
            showLabelHide={t("authHidePassword")}
            testId="reset-password"
          />
          <PasswordStrength value={form.values.password} strength={strength} />
        </div>

        <PasswordField
          label={t("authConfirmPassword")}
          autoComplete="new-password"
          value={form.values.confirm}
          onChange={(value) => form.set("confirm", value)}
          error={form.errors.confirm}
          disabled={form.submitting}
          showLabelShow={t("authShowPassword")}
          showLabelHide={t("authHidePassword")}
          testId="reset-confirm"
        />

        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          {t("authResetSubmit")}
        </Button>
      </form>
    </AuthShell>
  );
}
