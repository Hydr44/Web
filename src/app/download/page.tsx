import { Suspense } from "react";
import DownloadPage from "./DownloadPage";

export const metadata = {
  title: "Scarica RescueManager Desktop",
  description: "Download dell'app desktop RescueManager per Windows, macOS e Linux.",
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full" />
      </div>
    }>
      <DownloadPage />
    </Suspense>
  );
}
