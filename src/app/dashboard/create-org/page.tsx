import { redirect } from "next/navigation";

/**
 * Pagina deprecata — la creazione dell'organizzazione è ora parte del
 * flusso di onboarding (`/onboarding`). Manteniamo un redirect per
 * compatibilità con eventuali bookmark/email vecchie.
 */
export default function CreateOrgRedirect() {
  redirect("/onboarding");
}
