import type { Metadata } from "next";
import {
  Car,
  ClipboardList,
  Package,
  Warehouse,
  Receipt,
  Calculator,
  Landmark,
  ClipboardCheck,
  Send,
  FileCheck,
} from "lucide-react";
import SectorPage from "@/components/sector/SectorPage";

const TITLE = "Gestionale per autodemolizioni: RVFU, RENTRI e ricambi usati";
const DESCRIPTION =
  "Gestionale per autodemolizioni: veicolo fuori uso dal certificato di rottamazione alla radiazione, registro RENTRI, ricambi usati, fattura elettronica.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/autodemolizioni" },
  keywords: [
    "gestionale autodemolizioni",
    "software per autodemolitori",
    "gestionale autodemolitori",
    "registro veicoli fuori uso",
    "certificato di rottamazione",
    "RENTRI autodemolitori",
    "ricambi usati gestionale",
    "centro di raccolta veicoli fuori uso",
  ],
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "RescueManager",
    url: "/autodemolizioni",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/video/demolizione-poster.jpg",
        width: 1024,
        height: 576,
        alt: "RescueManager, gestionale per autodemolizioni",
      },
    ],
  },
};

export default function AutodemolizioniPage() {
  return (
    <SectorPage
      path="/autodemolizioni"
      breadcrumb="Autodemolizioni"
      eyebrow="Per gli autodemolitori"
      title="Il gestionale per le autodemolizioni"
      subtitle="Un software per autodemolitori che segue il veicolo fuori uso dal cancello alla pressa: certificato di rottamazione, radiazione, registro rifiuti e formulari RENTRI (il registro elettronico nazionale dei rifiuti), ricambi usati e fatturazione. Tutto nello stesso programma, senza ricopiare i dati."
      video={{
        src: "/video/demolizione.mp4",
        poster: "/video/demolizione-poster.jpg",
        caption:
          "Il gestionale in uso in un centro di raccolta: presa in carico del veicolo, pratica di demolizione e registro rifiuti.",
      }}
      scenariosIntro="Quattro momenti di una giornata in un centro di raccolta autorizzato (D.Lgs 209/2003), e cosa cambia con il programma."
      scenarios={[
        {
          situation:
            "Il cliente è al cancello con la macchina sul carro e vuole il certificato di rottamazione adesso, perché deve chiudere l’assicurazione.",
          change:
            "Inserisci targa e proprietario, alleghi le foto e stampi il certificato di rottamazione prima che il cliente riparta. La pratica del veicolo fuori uso è già aperta e la radiazione parte da lì, senza ribattere niente.",
        },
        {
          situation:
            "Il registro di carico e scarico va tenuto ogni giorno, e un errore su un codice rifiuto, una quantità o una data lo paghi al primo controllo.",
          change:
            "Il movimento guidato ti chiede solo quello che serve e controlla i dati prima della vidimazione. Se hai sbagliato, annulli o correggi il movimento in modo tracciato, come vuole il RENTRI.",
        },
        {
          situation:
            "È fine aprile e c’è il MUD (la dichiarazione ambientale annuale) da presentare: quantità per codice, destinatari, veicoli trattati nell’anno. Di solito partono giorni di ricostruzione tra fogli e raccoglitori.",
          change:
            "I dati sono già nel registro: carichi, scarichi, formulari e veicoli lavorati stanno in un posto solo, filtrabili per anno, codice e destinatario. Niente da ricostruire da fogli sparsi.",
        },
        {
          situation:
            "Sul veicolo appena entrato c’è un motore che vale più del rottame. Se finisce senza etichetta in fondo al capannone, nessuno lo troverà quando servirà.",
          change:
            "Il ricambio usato entra a magazzino con foto, prezzo, scaffale e posizione sulla mappa. Con il catalogo per compatibilità sai su quali modelli monta: quando arriva la richiesta, lo trovi subito.",
        },
      ]}
      modulesIntro="I moduli che un’autodemolizione apre tutti i giorni. Ognuno ha la sua pagina con i dettagli."
      modules={[
        {
          href: "/moduli/rvfu",
          title: "Veicoli fuori uso",
          desc: "Presa in carico con dati e foto, pratica con le fasi di lavorazione visibili, certificato di rottamazione e radiazione trasmessa al Registro Unico Telematico dei veicoli fuori uso (RVFU), collegato ad ACI e Ministero dei Trasporti.",
          icon: Car,
        },
        {
          href: "/moduli/rentri",
          title: "Registro RENTRI e formulari",
          desc: "Registro di carico e scarico con movimento guidato, formulario (FIR) digitale, vidimazione e trasmissione, annullamento e correzione dei movimenti, stampa del modulo. Più registri e più siti, se ne hai.",
          icon: ClipboardList,
        },
        {
          href: "/moduli/ricambi",
          title: "Ricambi usati",
          desc: "Magazzino con scaffali e mappa, foto e prezzi, catalogo per compatibilità con RicambiPro: sai cosa hai, dove sta e su quali veicoli monta.",
          icon: Package,
        },
        {
          href: "/moduli/piazzale",
          title: "Piazzale e custodia",
          desc: "La posizione di ogni veicolo nel piazzale, il conto dei giorni per chi resta in custodia, il verbale di riconsegna con firma via link.",
          icon: Warehouse,
        },
        {
          href: "/moduli/sdi",
          title: "Fatturazione elettronica",
          desc: "Fatture e autofatture inviate all’Agenzia delle Entrate con le notifiche di esito, senza passare da un altro programma.",
          icon: Receipt,
        },
        {
          href: "/moduli/contabilita",
          title: "Prima nota e incassi",
          desc: "Prima nota, scadenzario degli incassi e chi deve ancora pagare, aggiornati sulle fatture emesse.",
          icon: Calculator,
        },
      ]}
      flowTitle="Dal cancello alla pressa, in sei passi"
      flowIntro="È la sequenza reale di un veicolo fuori uso in un centro di raccolta. Il programma la segue nello stesso ordine."
      flow={[
        {
          title: "Ingresso del veicolo",
          desc: "Targa, telaio, proprietario, documenti e foto dello stato del veicolo. Il mezzo compare nel piazzale e apri la pratica alla prima fase.",
        },
        {
          title: "Certificato di rottamazione",
          desc: "Lo stampi subito per il cliente, con i dati già inseriti. Da quel momento la pratica ha una data certa e vedi quali passaggi restano.",
        },
        {
          title: "Radiazione",
          desc: "La radiazione dal PRA (il Pubblico Registro Automobilistico) viene trasmessa al Registro Unico Telematico dei veicoli fuori uso direttamente dal programma. L’esito torna sulla pratica e resta archiviato.",
        },
        {
          title: "Lavorazione",
          desc: "Bonifica per isola, con le postazioni del tuo impianto; smontaggio; i ricambi buoni vanno a magazzino con scaffale e prezzo. Ogni fase resta visibile sulla pratica.",
        },
        {
          title: "Rifiuti",
          desc: "Carico e scarico sul registro RENTRI con il movimento guidato, formulario digitale per ogni uscita, vidimazione e trasmissione. Se serve, annulli o correggi in modo tracciato.",
        },
        {
          title: "Chiusura",
          desc: "Trasmissione della demolizione a UNRAE (l’Unione Nazionale Rappresentanti Autoveicoli Esteri), fattura o autofattura elettronica, pratica archiviata. Se tra anni ti chiedono un documento, lo ritrovi dal telaio.",
        },
      ]}
      connectionsIntro="Gli enti e i servizi con cui un’autodemolizione deve dialogare. Il programma è già collegato."
      connections={[
        {
          name: "Registro Unico Telematico (RVFU)",
          desc: "Radiazione dal PRA trasmessa dal programma al Registro Unico Telematico dei veicoli fuori uso, il collegamento con ACI e Ministero dei Trasporti.",
          icon: Landmark,
        },
        {
          name: "Registro RENTRI",
          desc: "Registro di carico e scarico e formulari digitali: vidimazione, trasmissione, annullamento e correzione.",
          icon: ClipboardCheck,
        },
        {
          name: "UNRAE",
          desc: "Trasmissione delle demolizioni effettuate, direttamente dalla pratica del veicolo.",
          icon: Send,
        },
        {
          name: "Agenzia delle Entrate",
          desc: "Fatturazione elettronica e autofatture con le notifiche di esito.",
          icon: FileCheck,
        },
        {
          name: "RicambiPro",
          desc: "Catalogo dei ricambi per compatibilità, collegato al tuo magazzino.",
          icon: Package,
        },
      ]}
      pkg={{
        name: "Pacchetto Autodemolizioni",
        intro:
          "Quello che consigliamo a un centro di raccolta autorizzato: i moduli che servono dal cancello alla fattura, senza pezzi lasciati fuori.",
        modules: [
          "Veicoli fuori uso (RVFU): pratica, certificato di rottamazione, radiazione",
          "Registro RENTRI: carico e scarico, formulari, vidimazione e trasmissione",
          "Custodia e piazzale",
          "Ricambi usati con magazzino, scaffali e catalogo",
          "Fatturazione elettronica e autofatture",
        ],
        note: "Il preventivo dipende da quanti siti, registri e utenti hai. Raccontaci come lavori e ti rispondiamo con una proposta chiara.",
      }}
      faqs={[
        {
          q: "Sono già iscritto a RENTRI, devo rifare tutto?",
          a: "No. L’iscrizione resta la tua: il programma si collega al registro della tua azienda con l’accesso che hai già attivato sul portale RENTRI. Continui a tenere carico, scarico e formulari dal gestionale, con il movimento guidato e i dati del veicolo già presenti. Se hai più registri o più siti, li vedi tutti.",
        },
        {
          q: "La radiazione la fate voi?",
          a: "La fai tu, dal programma, in pochi passaggi: i dati del veicolo sono già nella pratica, la richiesta parte verso il Registro Unico Telematico dei veicoli fuori uso e l’esito torna sulla pratica. Non serve un altro portale né un intermediario. Per i primi invii ti seguiamo noi.",
        },
        {
          q: "Faccio anche soccorso con il carro.",
          a: "Allora ti serve anche la parte di soccorso stradale, nello stesso programma: interventi, autisti con l’app, committenti con le loro tariffe, custodia. Il veicolo recuperato dal carro entra direttamente in piazzale e, se va demolito, la pratica parte da lì.",
          link: { href: "/soccorso-stradale", label: "Vedi la pagina per il soccorso stradale." },
        },
        {
          q: "Posso provarlo prima?",
          a: "Sì. Ti mostriamo il programma in una demo con i dati d’esempio di un’autodemolizione: pratica, registro e magazzino come li useresti tu. Se poi lo attivi, hai 14 giorni soddisfatti o rimborsati.",
        },
        {
          q: "Serve installare qualcosa?",
          a: "Il programma si installa sul computer dell’ufficio, Windows o Mac, e l’installazione è inclusa: la facciamo noi insieme a te e impostiamo registri, siti e stampe. Non serve un server in azienda.",
        },
      ]}
      finalCta={{
        title: "Vediamolo sul tuo piazzale.",
        text: "Una demo di trenta minuti con i dati d’esempio di un’autodemolizione, dal cancello alla fattura.",
        crossQuestion: "Fai anche soccorso stradale?",
        crossLabel: "Vedi la pagina per il soccorso",
        crossHref: "/soccorso-stradale",
      }}
    />
  );
}
