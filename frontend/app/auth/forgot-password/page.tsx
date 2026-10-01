import { Suspense } from "react";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";

export default function AuthForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
