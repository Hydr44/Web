import { ImageResponse } from "next/og";

/**
 * Render condiviso dell'immagine social (Open Graph + Twitter).
 * Usato da:
 *   - src/app/opengraph-image.tsx
 *   - src/app/twitter-image.tsx
 *
 * Dimensione 1200×630 — funziona per OG e per Twitter "summary_large_image".
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

export function renderSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #0f172a 0%, #0b1224 60%, #060912 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            R
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            RESCUE<span style={{ color: "#3b82f6" }}>MANAGER</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Gestisci. Demolisci.{" "}
            <span style={{ color: "#3b82f6" }}>Fattura.</span>
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#94a3b8",
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Software gestionale per soccorso stradale e autodemolizioni —
            soccorso & trasporti, RVFU, RENTRI, fatturazione SDI.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22,
            color: "#64748b",
          }}
        >
          <div>rescuemanager.eu</div>
          <div style={{ display: "flex", gap: 24 }}>
            <span>Soccorso & trasporti</span>
            <span>·</span>
            <span>RVFU</span>
            <span>·</span>
            <span>RENTRI</span>
            <span>·</span>
            <span>SDI</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
