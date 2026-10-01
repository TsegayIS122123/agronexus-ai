import { Suspense } from "react";
import VerifyEmailPage from "@/features/auth/VerifyEmailPage";

export default function AuthVerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
