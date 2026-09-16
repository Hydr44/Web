import type { Metadata } from "next";
import {
  Truck,
  Smartphone,
  Handshake,
  Warehouse,
  FileSignature,
  Receipt,
  FileCheck,
  MessageCircle,
  Navigation,
  PenLine,
} from "lucide-react";
import SectorPage from "@/components/sector/SectorPage";

const TITLE = "Gestionale soccorso stradale e carri attrezzi";
const DESCRIPTION =
  "Gestionale soccorso stradale e carri attrezzi: interventi su mappa, app autisti con navigatore, tariffe per committente, custodia veicoli e fattura elettronica.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/soccorso-stradale" },
  keywords: [
    "gestionale soccorso stradale",
    "software soccorso stradale",
    "gestionale carro attrezzi",
    "software carroattrezzi",
    "dispatch soccorso stradale",
    "app autisti carro attrezzi",
    "custodia veicoli gestionale",
    "convenzioni committenti soccorso stradale",
  ],
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "RescueManager",
    url: "/soccorso-stradale",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/video/soccorso-poster.jpg",
        width: 1024,
        height: 576,
        alt: "RescueManager, gestionale per soccorso stradale e carri attrezzi",
      },
    ],
  },
};

export default function SoccorsoStradalePage() {
  return (
    <SectorPage
      path="/soccorso-stradale"
      breadcrumb="Soccorso stradale"
      eyebrow="Per chi fa soccorso stradale"
      title="Il gestionale per il soccorso stradale e i carri attrezzi"
      subtitle="Dispatch degli interventi su mappa con i carri in movimento, app con navigatore per gli autisti, foto e firma del cliente sul posto, tariffari per ogni committente, custodia dei veicoli e fattura elettronica. Chi è in ufficio vede tutto, chi è sul carro non deve telefonare."
      video={{
        src: "/video/soccorso.mp4",
        poster: "/video/soccorso-poster.jpg",
        caption:
          "Il gestionale in uso in un centro di soccorso stradale: mappa degli interventi, assegnazione ai carri attrezzi e app degli autisti.",
      }}
      scenariosIntro="Quattro momenti di una giornata normale per chi fa soccorso stradale, e cosa cambia quando il programma lavora con te."
      scenarios={[
        {
          situation:
            "Sono le 18:40 e arrivano tre chiamate insieme: un’auto in tangenziale, un furgone fermo in un parcheggio e un committente che vuole sapere se avete un carro libero.",
          change:
            "Apri tre interventi in un minuto, vedi sulla mappa dove sono i carri e assegni autista e mezzo. Ognuno riceve la notifica sul telefono e parte con il navigatore; tu segui gli stati (Da fare, Assegnato, In corso, Completato) da una sola schermata.",
        },
        {
          situation:
            "Il committente chiede il riepilogo del mese con le tariffe della convenzione: chilometri, uscite notturne, fermo macchina, tutto come nell’accordo firmato mesi fa.",
          change:
            "Ogni committente ha la sua convenzione e il suo tariffario: il prezzo si calcola da solo su ogni intervento. A fine mese emetti una fattura massiva con tutti i trasporti di quel committente, già con gli importi giusti.",
        },
        {
          situation:
            "Il cliente in panne richiama per la terza volta per sapere quando arrivate. L’autista non risponde perché sta guidando, e in ufficio non sapete dirgli di più.",
          change:
            "Alla creazione dell’intervento e a ogni cambio di stato il cliente riceve un messaggio WhatsApp automatico con il link per seguire l’intervento. Sa che siete partiti, sa quando arrivate, e il telefono dell’ufficio smette di squillare per quello.",
        },
        {
          situation:
            "Un veicolo è in deposito da dodici giorni. Il proprietario si presenta per ritirarlo e vuole sapere quanto deve e dove firmare.",
          change:
            "La custodia tiene la posizione nel piazzale e il conto dei giorni. Alla riconsegna generi il verbale, il cliente firma via link dal suo telefono e il documento resta archiviato con foto e firma.",
        },
      ]}
      modulesIntro="I moduli che un centro di soccorso apre tutti i giorni. Ognuno ha la sua pagina con i dettagli."
      modules={[
        {
          href: "/moduli/trasporti",
          title: "Soccorso e trasporti",
          desc: "Creazione dell’intervento, assegnazione di autista e mezzo, stati aggiornati in tempo reale, mappa degli interventi attivi con la posizione dei carri, DDT (documento di trasporto) stampabile.",
          icon: Truck,
        },
        {
          href: "/moduli/mezzi-autisti",
          title: "Mezzi e autisti",
          desc: "Il parco mezzi con le scadenze di revisione e assicurazione, i turni degli autisti e l’app iOS e Android con notifica, navigatore passo-passo, foto e firma sul posto.",
          icon: Smartphone,
        },
        {
          href: "/moduli/clienti",
          title: "Clienti e committenti",
          desc: "Anagrafica, convenzioni e tariffari per committente con il prezzo calcolato in automatico, tariffario per i privati, fattura massiva mensile.",
          icon: Handshake,
        },
        {
          href: "/moduli/piazzale",
          title: "Custodia veicoli",
          desc: "Posizioni nel piazzale, conto dei giorni, verbale di riconsegna con firma via link. Funziona allo stesso modo per la depositeria.",
          icon: Warehouse,
        },
        {
          href: "/moduli/preventivi",
          title: "Preventivi",
          desc: "Preventivo inviato al cliente con accettazione online: quando accetta, l’intervento è già pronto da assegnare.",
          icon: FileSignature,
        },
        {
          href: "/moduli/sdi",
          title: "Fatturazione elettronica",
          desc: "Fatture inviate all’Agenzia delle Entrate con le notifiche di esito, scadenzario degli incassi e prima nota.",
          icon: Receipt,
        },
      ]}
      flowTitle="Dalla chiamata alla fattura, in cinque passi"
      flowIntro="È la sequenza reale di un intervento di soccorso. Il programma la segue nello stesso ordine, dall’ufficio al carro."
      flow={[
        {
          title: "Chiamata",
          desc: "Cliente, luogo, tipo di veicolo, committente se c’è. Se il committente ha una convenzione, il prezzo compare già. Trenta secondi e l’intervento è nella lista.",
        },
        {
          title: "Assegnazione",
          desc: "Guardi la mappa, scegli autista e mezzo liberi. L’autista riceve la notifica sull’app e il cliente il primo messaggio WhatsApp con il link per seguire l’intervento.",
        },
        {
          title: "Sul posto",
          desc: "L’autista arriva con il navigatore passo-passo, scatta le foto del veicolo, fa firmare il cliente sullo schermo e cambia lo stato. In ufficio lo vedete in tempo reale.",
        },
        {
          title: "Chiusura",
          desc: "Intervento completato: il veicolo va in custodia con posizione e conto dei giorni, oppure viene consegnato. Se serve stampi il DDT. Tutto resta nello storico con foto e firma.",
        },
        {
          title: "Fattura",
          desc: "Al privato la fattura subito; al committente la fattura massiva a fine mese, con tutti i trasporti alle tariffe della convenzione. Invio elettronico, esito, scadenzario degli incassi.",
        },
      ]}
      connectionsIntro="I servizi che un centro di soccorso usa ogni giorno, collegati al programma senza passaggi in più."
      connections={[
        {
          name: "Agenzia delle Entrate",
          desc: "Fatturazione elettronica con le notifiche di esito, direttamente dal gestionale.",
          icon: FileCheck,
        },
        {
          name: "WhatsApp Business",
          desc: "Messaggi automatici al cliente alla creazione dell’intervento e a ogni cambio di stato, con il link per seguirlo.",
          icon: MessageCircle,
        },
        {
          name: "Mappe e navigazione",
          desc: "Mappa degli interventi attivi in ufficio, navigatore passo-passo nell’app dell’autista.",
          icon: Navigation,
        },
        {
          name: "Firma via link",
          desc: "Verbale di riconsegna firmato dal cliente dal suo telefono, archiviato con il veicolo.",
          icon: PenLine,
        },
      ]}
      pkg={{
        name: "Pacchetto Soccorso",
        intro:
          "Quello che consigliamo a chi fa soccorso stradale con uno o più carri attrezzi: i moduli che servono dalla chiamata alla fattura.",
        modules: [
          "Soccorso e trasporti: interventi, stati, mappa",
          "Mezzi e autisti, con l’app per gli autisti",
          "Clienti e committenti, con convenzioni e tariffari",
          "Custodia veicoli",
          "Fatturazione elettronica",
        ],
        note: "Il preventivo dipende da quanti carri, autisti e committenti hai. Raccontaci come lavori e ti rispondiamo con una proposta chiara.",
      }}
      faqs={[
        {
          q: "Gli autisti devono avere uno smartphone?",
          a: "Sì, uno qualsiasi con iOS o Android: l’app si installa dal link che ti diamo noi e serve a ricevere l’intervento con la notifica, navigare fino al posto, scattare le foto e far firmare il cliente. Non servono tablet o dispositivi dedicati.",
        },
        {
          q: "Lavoro per più committenti con tariffe diverse.",
          a: "È il caso normale. Ogni committente ha la sua convenzione con il suo tariffario; quando crei l’intervento e scegli il committente, il prezzo si calcola da solo. A fine mese emetti una fattura massiva per ciascun committente con tutti i suoi trasporti. Per i privati usi il tuo tariffario.",
        },
        {
          q: "Faccio anche deposito e custodia.",
          a: "La custodia è compresa: ogni veicolo ha la sua posizione nel piazzale, il conto dei giorni parte dall’ingresso e alla riconsegna generi il verbale con la firma via link. Vale per i veicoli dei tuoi soccorsi e per la depositeria.",
        },
        {
          q: "Cosa devo installare?",
          a: "Il programma sul computer dell’ufficio, Windows o Mac, con l’installazione inclusa: la facciamo noi insieme a te e impostiamo mezzi, autisti, committenti e tariffari. Gli autisti installano l’app sul loro telefono con il link che ti diamo noi. Non serve un server in azienda.",
        },
        {
          q: "Faccio anche demolizioni.",
          a: "Allora il veicolo recuperato dal carro non finisce in un altro programma: entra in piazzale e, se va demolito, apri la pratica con certificato di rottamazione, radiazione e registro rifiuti nello stesso gestionale.",
          link: { href: "/autodemolizioni", label: "Vedi la pagina per gli autodemolitori." },
        },
      ]}
      finalCta={{
        title: "Vediamolo sul tuo caso.",
        text: "Una demo di trenta minuti sul tuo modo di lavorare: i tuoi committenti, i tuoi carri, la tua custodia.",
        crossQuestion: "Fai anche demolizioni?",
        crossLabel: "Vedi la pagina per gli autodemolitori",
        crossHref: "/autodemolizioni",
      }}
    />
  );
}
