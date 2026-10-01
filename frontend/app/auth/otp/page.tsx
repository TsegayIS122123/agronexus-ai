import { Suspense } from "react";
import OtpPage from "@/features/auth/OtpPage";

export default function AuthOtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpPage />
    </Suspense>
  );
}
