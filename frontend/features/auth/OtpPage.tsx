"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocaleValue } from "@/components/LocaleProvider";
import { authApi, errorText, RateLimitedError, type OtpChannel } from "./api";
import { establish } from "./session";
import {
  AuthShell,
  Button,
  ErrorSummary,
  Field,
  SuccessNotice,
  useAuthForm,
} from "./components/AuthForm";

export default function OtpPage() {
  const { t } = useLocaleValue();
  const router = useRouter();
  const form = useAuthForm({ email: "", code: "" });
  const [channel, setChannel] = useState<OtpChannel>("sms");
  const [sent, setSent] = useState(false);

  function validateEmailOnly() {
    const email = form.values.email.trim();
    if (!email) {
      form.report({ email: t("authFieldRequired") });
      return null;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.report({ email: t("authFieldEmail") });
      return null;
    }
    return email;
  }

  async function onRequest(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);
    const email = validateEmailOnly();
    if (!email) return;

    form.setSubmitting(true);
    try {
      await authApi.otpRequest(email, channel, "login");
      setSent(true);
    } catch (error) {
      form.setServerError(
        error instanceof RateLimitedError ? t("authRateLimited") : t("authNetworkError"),
      );
    } finally {
      form.setSubmitting(false);
    }
  }

  async function onVerify(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);

    const errors: Record<string, string> = {};
    const email = form.values.email.trim();
    const code = form.values.code.trim();
    if (!email) errors.email = t("authFieldRequired");
    if (!/^\d{6}$/.test(code)) errors.code = t("authFieldOtp");

    if (Object.keys(errors).length > 0) {
      form.report(errors);
      return;
    }

    form.setSubmitting(true);
    try {
      const result = await authApi.otpVerify(email, code, "login");
      await establish(result);
      router.push(`/${result.user.role ?? "farmer"}/dashboard`);
    } catch (error) {
      if (error instanceof RateLimitedError) {
        form.setServerError(t("authRateLimited"));
      } else {
        form.setError("code", errorText(error) || t("authNetworkError"));
      }
    } finally {
      form.setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={t("authOtpTitle")}
      subtitle={t("authOtpSubtitle")}
      footer={
        <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
          {t("authBackToLogin")}
        </Link>
      }
    >
      <div className="space-y-4">
        <ErrorSummary
          id={form.summaryId}
          heading={t("authErrorsHeading")}
          serverError={form.serverError}
          errors={form.errors}
        />

        {sent && <SuccessNotice id="otp-sent">{t("authOtpSent")}</SuccessNotice>}

        <form onSubmit={onRequest} noValidate className="space-y-4 border-b border-border pb-4">
          <Field
            label={t("authEmail")}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.values.email}
            onChange={(value) => form.set("email", value)}
            error={form.errors.email}
            disabled={form.submitting}
            testId="otp-email"
          />

          <fieldset>
            <legend className="text-sm font-medium text-text-primary">{t("authOtpChannel")}</legend>
            <div className="mt-2 flex gap-4">
              {(["sms", "email"] as const).map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="otp-channel"
                    value={option}
                    checked={channel === option}
                    onChange={() => setChannel(option)}
                    disabled={form.submitting}
                  />
                  {t(option === "sms" ? "authOtpChannelSms" : "authOtpChannelEmail")}
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" variant="secondary" loading={form.submitting} className="w-full">
            {t("authOtpRequest")}
          </Button>
        </form>

        <form onSubmit={onVerify} noValidate className="space-y-4">
          <Field
            label={t("authOtpCode")}
            value={form.values.code}
            onChange={(value) => form.set("code", value.replace(/\D/g, "").slice(0, 6))}
            error={form.errors.code}
            disabled={form.submitting}
            inputMode="numeric"
            autoComplete="one-time-code"
            hint={t("authOtpCodeHint")}
            placeholder="123456"
            testId="otp-code"
          />

          <Button type="submit" size="lg" loading={form.submitting} className="w-full">
            {t("authOtpSubmit")}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
