import { Suspense } from "react";
import RegisterPage from "./RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="rm-prod flex items-center justify-center">
        <p className="rm-muted">Caricamento in corso.</p>
      </div>
    }>
      <RegisterPage />
    </Suspense>
  );
}
