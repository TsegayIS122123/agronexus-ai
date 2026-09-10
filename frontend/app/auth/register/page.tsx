import { Suspense } from "react";
import Register from "@/features/auth/RegisterPage";

export default function AuthRegisterPage() {
  return (
    <Suspense fallback={null}>
      <Register />
    </Suspense>
  );
}
