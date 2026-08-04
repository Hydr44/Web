import { redirect } from "next/navigation";

// Il download vive nel portale (con sidebar e gate auth): /dashboard/download.
// /download resta come scorciatoia e reindirizza lì.
export default function Page() {
  redirect("/dashboard/download");
}
