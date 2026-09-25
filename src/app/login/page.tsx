"use client";
import { Suspense } from "react";
import LoginPage from "./LoginPage"; // il file che hai già scritto

export default function LoginWrapper() {
  return (
    <Suspense fallback={
      <div className="rm-prod flex items-center justify-center">
        <p className="rm-muted">Caricamento in corso.</p>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
