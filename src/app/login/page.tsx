"use client";
import { Suspense } from "react";
import LoginPage from "./LoginPage"; // il file che hai già scritto

export default function LoginWrapper() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <LoginPage />
    </Suspense>
  );
}
