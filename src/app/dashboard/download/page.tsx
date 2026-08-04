"use client";

import DownloadPage from "@/app/download/DownloadPage";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Download dentro il portale: eredita la sidebar dal layout /dashboard e il gate auth.
 * DownloadPage in modalità `embedded` (senza hero/top-bar standalone).
 */
export default function DashboardDownloadPage() {
  usePageTitle("Download");
  return <DownloadPage embedded />;
}
