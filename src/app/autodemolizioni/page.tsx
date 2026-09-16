import type { Metadata } from "next";
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
      titleLines={["Il gestionale", "per le", "autodemolizioni."]}
      subtitle={
        <>
          {"Il software per "}
          <strong className="text-slate-200">autodemolitori</strong>
          {" che segue il veicolo fuori uso dal cancello alla pressa: "}
          <strong className="text-slate-200">certificato di rottamazione</strong>
          {", "}
          <strong className="text-slate-200">radiazione</strong>
          {", registro rifiuti e formulari "}
          <strong className="text-slate-200">RENTRI</strong>
          {", ricambi usati, fattura elettronica. Un programma solo, niente da ricopiare."}
        </>
      }
      video={{ src: "/video/demolizione.mp4", poster: "/video/demolizione-poster.jpg" }}
      blocksTitle="Cosa fa per te"
      blocks={[
        {
          title: "Dal cancello al certificato di rottamazione",
          text:
            "Il cliente è al cancello con la macchina sul carro e vuole il certificato adesso, perché deve chiudere l’assicurazione. Inserisci targa e proprietario, alleghi le foto e stampi il certificato di rottamazione prima che riparta. La pratica del veicolo fuori uso è già aperta: la radiazione dal PRA parte da lì e l’esito torna sulla pratica.",
          bullets: [
            "Presa in carico con dati, documenti e foto dello stato del veicolo",
            "Certificato di rottamazione stampato subito, con i dati già inseriti",
            "Radiazione trasmessa al Registro Unico Telematico dei veicoli fuori uso (RVFU), il collegamento con ACI e Ministero dei Trasporti",
            "Le fasi di lavorazione visibili sulla pratica, dall’ingresso alla chiusura",
          ],
          href: "/moduli/rvfu",
          cta: "Vedi il modulo Veicoli fuori uso",
          panel: {
            big: "30",
            unit: "giorni",
            small:
              "è il tempo che il D.Lgs 209/2003 dà al centro di raccolta per radiare il veicolo dal PRA dopo la consegna. La pratica li conta per te, dalla presa in carico.",
          },
        },
        {
          title: "Piazzale e lavorazione sotto controllo",
          text:
            "Ogni veicolo ha la sua posizione nel piazzale dal momento in cui entra. La bonifica si fa per isola, con le postazioni del tuo impianto; i ricambi buoni vanno a magazzino con scaffale e prezzo; chi resta in custodia ha il conto dei giorni e il verbale di riconsegna firmato dal cliente via link.",
          bullets: [
            "Posizione di ogni veicolo nel piazzale, sempre aggiornata",
            "Bonifica per isola, con le postazioni del tuo impianto",
            "Ricambi usati a magazzino con foto, prezzo, scaffale e mappa",
            "Custodia con conto dei giorni e verbale di riconsegna firmato via link",
          ],
          href: "/moduli/piazzale",
          cta: "Vedi il modulo Custodia veicoli",
          image: {
            src: "/appshots/piazzalenuovo.png",
            alt: "Piazzale e custodia veicoli in RescueManager",
            width: 1024,
            height: 648,
          },
        },
        {
          title: "Registro RENTRI e formulari senza ricopiare",
          text:
            "Il registro di carico e scarico va tenuto ogni giorno, e un errore su un codice rifiuto, una quantità o una data lo paghi al primo controllo. Il movimento guidato ti chiede solo quello che serve e controlla i dati prima della vidimazione; il formulario digitale accompagna ogni uscita; la trasmissione al RENTRI parte dal programma. A fine aprile, i dati per il MUD sono già nel registro.",
          bullets: [
            "Movimento guidato con controllo dei dati prima della vidimazione",
            "Formulario (FIR) digitale per ogni uscita di rifiuti",
            "Annullamento e correzione dei movimenti, tracciati come vuole il RENTRI",
            "Più registri e più siti, se ne hai",
          ],
          href: "/moduli/rentri",
          cta: "Vedi il modulo Registro RENTRI",
          panel: {
            big: "1",
            unit: "registro, un posto solo",
            small:
              "Carico e scarico, formulari e vidimazione stanno insieme alla pratica del veicolo. Quantità per codice, destinatari e veicoli lavorati si filtrano per anno: niente da ricostruire dai fogli.",
          },
        },
        {
          title: "Fattura, autofattura e incassi",
          text:
            "Chiusa la pratica, la demolizione va a UNRAE e la fattura o l’autofattura parte verso l’Agenzia delle Entrate con le notifiche di esito. Prima nota e scadenzario degli incassi si aggiornano da soli sulle fatture emesse. Se tra anni ti chiedono un documento, lo ritrovi dal telaio.",
          bullets: [
            "Trasmissione delle demolizioni effettuate a UNRAE, dalla pratica",
            "Fatture e autofatture elettroniche con le notifiche di esito",
            "Scadenzario degli incassi e prima nota aggiornati sulle fatture",
            "Archivio della pratica con documenti, foto e certificati",
          ],
          href: "/moduli/sdi",
          cta: "Vedi il modulo Fatturazione elettronica",
          image: {
            src: "/appshots/fatture elettroniche.png",
            alt: "Fatture elettroniche in RescueManager",
            width: 1024,
            height: 648,
          },
        },
      ]}
      flowTitle="Dal cancello alla pressa"
      flowIntro="È la sequenza reale di un veicolo fuori uso in un centro di raccolta autorizzato. Il programma la segue nello stesso ordine."
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
          desc: "La radiazione dal PRA (il Pubblico Registro Automobilistico) viene trasmessa al Registro Unico Telematico direttamente dal programma. L’esito torna sulla pratica.",
        },
        {
          title: "Lavorazione",
          desc: "Bonifica per isola, con le postazioni del tuo impianto; smontaggio; i ricambi buoni vanno a magazzino con scaffale e prezzo.",
        },
        {
          title: "Rifiuti",
          desc: "Carico e scarico sul registro RENTRI con il movimento guidato, formulario digitale per ogni uscita, vidimazione e trasmissione.",
        },
        {
          title: "Chiusura",
          desc: "Trasmissione della demolizione a UNRAE, fattura o autofattura elettronica, pratica archiviata con tutti i documenti.",
        },
      ]}
      connectionsIntro="Gli enti e i servizi con cui un’autodemolizione deve dialogare. Il programma è già collegato: niente copia e incolla, niente doppio lavoro."
      connections={[
        {
          ente: "ACI e Ministero dei Trasporti",
          title: "Registro Unico Telematico (RVFU)",
          short: "Radiazione dal PRA trasmessa dal programma al registro dei veicoli fuori uso, con l’esito sulla pratica.",
        },
        {
          ente: "Registro RENTRI",
          title: "Rifiuti e formulari",
          short: "Registro di carico e scarico, formulari digitali, vidimazione, trasmissione, annullamento e correzione.",
        },
        {
          ente: "UNRAE",
          title: "Statistiche e demolizioni",
          short: "Trasmissione delle demolizioni effettuate, direttamente dalla pratica del veicolo.",
        },
        {
          ente: "Agenzia delle Entrate",
          title: "Fatturazione elettronica",
          short: "Fatture e autofatture con le notifiche di esito, senza passare da un altro programma.",
        },
        {
          ente: "RicambiPro",
          title: "Catalogo ricambi",
          short: "Catalogo per compatibilità collegato al tuo magazzino: sai su quali veicoli monta il pezzo che hai.",
        },
      ]}
      pkg={{
        title: "Il pacchetto Autodemolizioni",
        intro:
          "Quello che consigliamo a un centro di raccolta autorizzato: i moduli che servono dal cancello alla fattura, senza pezzi lasciati fuori. Ognuno ha la sua pagina con i dettagli.",
        items: [
          { label: "Veicoli fuori uso: pratica, certificato di rottamazione, radiazione", href: "/moduli/rvfu" },
          { label: "Registro RENTRI: carico e scarico, formulari, vidimazione e trasmissione", href: "/moduli/rentri" },
          { label: "Custodia e piazzale", href: "/moduli/piazzale" },
          { label: "Ricambi usati con magazzino, scaffali e catalogo", href: "/moduli/ricambi" },
          { label: "Fatturazione elettronica e autofatture", href: "/moduli/sdi" },
          { label: "Prima nota e scadenzario degli incassi", href: "/moduli/contabilita" },
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
          a: "La fai tu, dal programma, in pochi passaggi: i dati del veicolo sono già nella pratica, la richiesta parte verso il Registro Unico Telematico e l’esito torna sulla pratica. Non serve un altro portale né un intermediario. Per i primi invii ti seguiamo noi.",
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
