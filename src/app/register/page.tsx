import { Suspense } from "react";
import RegisterPage from "./RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16">Caricamento…</div>}>
      <RegisterPage />
    </Suspense>
  );
}
