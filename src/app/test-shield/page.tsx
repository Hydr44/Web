"use client";

import { Shield } from "lucide-react";

export default function TestShield() {
  return (
    <div className="p-4">
      <h1>Test Shield Icon</h1>
      <Shield className="h-8 w-8 text-blue-600" />
      <p>Se vedi l'icona Shield sopra, l'import funziona.</p>
    </div>
  );
}
