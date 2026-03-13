import { Suspense } from "react";
import RegisterPage from "./RegisterPage";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    }>
      <RegisterPage />
    </Suspense>
  );
}
