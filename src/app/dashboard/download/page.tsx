import { redirect } from "next/navigation";

/**
 * Redirect a /download (pagina pubblica).
 *
 * La versione embed del componente dentro il layout dashboard manteneva il
 * bug per cui il bottone Scarica non triggerava effettivamente il download
 * su alcuni browser. La pagina pubblica funziona regolarmente: redirigiamo
 * lì per usarla 1:1.
 */
export default function DashboardDownloadPage() {
  redirect("/download");
}
