import { Suspense } from "react";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";

export default function AuthResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}
