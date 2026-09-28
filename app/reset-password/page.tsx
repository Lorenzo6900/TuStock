import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
