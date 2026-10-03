"use client";


import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLocaleValue } from "@/components/LocaleProvider";
import {
  authApi,
  errorText,
  RateLimitedError,
  type Locale4,
  type SelfAssignableRole,
} from "./api";
import {
  AuthShell,
  Button,
  ErrorSummary,
  Field,
  PasswordField,
  PasswordStrength,
  scorePassword,
  useAuthForm,
} from "./components/AuthForm";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

export default function RegisterPage() {
  const { t, locale } = useLocaleValue();
  const router = useRouter();
  const form = useAuthForm({ name: "", email: "", phone: "", password: "", confirm: "", role: "" });

  const strengthLabels = {
    weak: t("authPwWeak"),
    fair: t("authPwFair"),
    good: t("authPwGood"),
    strong: t("authPwStrong"),
    addLength: t("authPwAddLength"),
    addVariety: t("authPwAddVariety"),
  };
  const strength = scorePassword(form.values.password, strengthLabels);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    form.setServerError(undefined);

    const errors: Record<string, string> = {};
    const name = form.values.name.trim();
    const email = form.values.email.trim();
    const phone = form.values.phone.trim();
    const password = form.values.password;
    const role = form.values.role;

    if (name.length < 2) errors.name = t("authFieldName");
    if (!email) errors.email = t("authFieldRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t("authFieldEmail");
    // Same shape the service enforces, checked here so the user is not made to
    // wait for a round-trip to be told their phone number is unusable.
    if (!/^\+?[0-9]{7,20}$/.test(phone)) errors.phone = t("authFieldPhone");
    if (!role) errors.role = t("authFieldRequired");
    if (password.length < 8) errors.password = t("authFieldPassword");
    if (password !== form.values.confirm) errors.confirm = t("authFieldMatch");

    if (Object.keys(errors).length > 0) {
      form.report(errors);
      return;
    }

    form.setSubmitting(true);
    let leaving = false;
    try {
      await authApi.register({
        name,
        email,
        phone,
        password,
        role: role as SelfAssignableRole,
        language: locale as Locale4,
      });
      // The account exists but is unverified, so there is no session worth
      // storing. Send the user to verify rather than to a dashboard that would
      // reject every request.
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      leaving = true;
    } catch (error) {
      if (error instanceof RateLimitedError) {
        form.setServerError(t("authRateLimited"));
      } else {
        const detail = errorText(error);
        if (/already exists/i.test(detail)) {
          form.setError("email", t("authEmailTaken"));
        } else {
          form.setServerError(detail || t("authNetworkError"));
        }
      }
    } finally {
      // On success the button stays busy: this screen is on its way out, and
      // releasing it would flash an idle form before the navigation landed.
      if (!leaving) form.setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={t("authRegisterTitle")}
      subtitle={t("authRegisterSubtitle")}
      footer={
        <>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/auth/login" className="font-medium text-brand-700 hover:underline">
            {t("signInLink")}
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

        <Field
          label={t("fullName")}
          autoComplete="name"
          value={form.values.name}
          onChange={(value) => form.set("name", value)}
          error={form.errors.name}
          disabled={form.submitting}
          testId="register-name"
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
          testId="register-email"
        />

        <Field
          label={t("authPhone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+251911000000"
          hint={t("authPhoneHint")}
          value={form.values.phone}
          onChange={(value) => form.set("phone", value)}
          error={form.errors.phone}
          disabled={form.submitting}
          testId="register-phone"
        />

        <div>
          <PasswordField
            label={t("authPassword")}
            autoComplete="new-password"
            value={form.values.password}
            onChange={(value) => form.set("password", value)}
            error={form.errors.password}
            disabled={form.submitting}
            showLabelShow={t("authShowPassword")}
            showLabelHide={t("authHidePassword")}
            testId="register-password"
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
          testId="register-confirm"
        />

        <div className="space-y-1">
          <label htmlFor="register-role" className="block text-sm font-medium text-text-primary">
            Role
          </label>
          <select
            id="register-role"
            value={form.values.role}
            onChange={(e) => form.set("role", e.target.value)}
            disabled={form.submitting}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-brand-500 focus:ring-brand-500"
          >
            <option value="">Select a role</option>
            <option value="farmer">Farmer</option>
            <option value="processor">Processor</option>
            <option value="consumer">Consumer</option>
          </select>
          {form.errors.role && <p className="text-sm text-red-600">{form.errors.role}</p>}
        </div>

        <p className="text-xs text-text-secondary">
          {t("authLanguageNotice")} ({SUPPORTED_LOCALES.join(", ")})
        </p>

        <Button type="submit" size="lg" loading={form.submitting} className="w-full">
          {form.submitting ? t("creatingAccount") : t("createAccount")}
        </Button>
      </form>
    </AuthShell>
  );
}
