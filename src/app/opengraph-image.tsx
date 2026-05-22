import { renderSocialImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const runtime = "edge";
export const alt = "RescueManager — Gestionale soccorso stradale e autodemolizione";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return renderSocialImage();
}
