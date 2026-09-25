import type { Metadata } from "next";
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
      titleLines={["Il gestionale per il", "soccorso stradale", "e i carri attrezzi."]}
      subtitle={
        <>
          <strong className="text-slate-200">Dispatch</strong>
          {" degli interventi su mappa con i carri in movimento, "}
          <strong className="text-slate-200">app con navigatore</strong>
          {" per gli autisti, foto e firma del cliente sul posto, "}
          <strong className="text-slate-200">tariffari per committente</strong>
          {", custodia dei veicoli e fattura elettronica. Chi è in ufficio vede tutto, chi è sul carro non deve telefonare."}
        </>
      }
      video={{ src: "/video/soccorso.mp4", poster: "/video/soccorso-poster.jpg" }}
      blocksTitle="Cosa fa per te"
      blocks={[
        {
          title: "Tre chiamate insieme, nessuna persa",
          text:
            "Sono le 18:40 e arrivano tre chiamate: un’auto in tangenziale, un furgone fermo in un parcheggio e un committente che vuole sapere se avete un carro libero. Apri tre interventi in un minuto, vedi sulla mappa dove sono i carri e assegni autista e mezzo. Tu segui gli stati da una sola schermata, senza telefonare a nessuno.",
          bullets: [
            "Nuovo intervento in trenta secondi, con committente e prezzo già calcolato",
            "Mappa degli interventi attivi con la posizione dei carri",
            "Assegnazione di autista e mezzo con un click",
            "Stati Da fare, Assegnato, In corso, Completato, visibili a tutti",
          ],
          href: "/moduli/trasporti",
          cta: "Vedi il modulo Soccorso e trasporti",
          image: {
            src: "/appshots/trasporti.jpg",
            alt: "Elenco e mappa degli interventi di soccorso in RescueManager",
            width: 1024,
            height: 642,
          },
        },
        {
          title: "L’autista ha tutto sul telefono",
          text:
            "L’intervento arriva sull’app con la notifica. L’autista parte con il navigatore passo-passo, scatta le foto del veicolo, fa firmare il cliente sullo schermo e cambia lo stato. Il cliente in panne, intanto, riceve un messaggio WhatsApp con il link per seguire l’intervento: sa che siete partiti e quando arrivate, e il telefono dell’ufficio smette di squillare per quello.",
          bullets: [
            "App per iPhone e Android con la notifica dell’intervento",
            "Navigatore passo-passo fino al punto di ritiro",
            "Foto del veicolo e firma del cliente sul posto",
            "Messaggio WhatsApp automatico al cliente, con il link per seguire l’intervento",
          ],
          href: "/moduli/mezzi-autisti",
          cta: "Vedi il modulo Mezzi e autisti",
          image: {
            src: "/appshots/autisti.png",
            alt: "Gestione autisti e mezzi in RescueManager",
            width: 1024,
            height: 648,
          },
        },
        {
          title: "Ogni committente con la sua convenzione",
          text:
            "Il committente chiede il riepilogo del mese con le tariffe della convenzione: chilometri, uscite notturne, fermo macchina, tutto come nell’accordo firmato mesi fa. Ogni committente ha la sua convenzione e il suo tariffario: il prezzo si calcola da solo su ogni intervento, e a fine mese emetti una fattura massiva con tutti i suoi trasporti, già con gli importi giusti.",
          bullets: [
            "Tariffario per committente, prezzo calcolato sull’intervento",
            "Tariffario per i privati",
            "Fattura massiva mensile con tutti i trasporti del committente",
            "Preventivi con accettazione online: quando il cliente accetta, l’intervento è pronto",
          ],
          href: "/moduli/clienti",
          cta: "Vedi il modulo Clienti e committenti",
          image: {
            src: "/appshots/clientinuovo.png",
            alt: "Anagrafica clienti e committenti in RescueManager",
            width: 1024,
            height: 648,
          },
        },
        {
          title: "Custodia con il conto dei giorni",
          text:
            "Un veicolo è in deposito da dodici giorni e il proprietario si presenta per ritirarlo: vuole sapere quanto deve. La custodia tiene la posizione nel piazzale e il conto dei giorni, con l’importo già calcolato; alla riconsegna registri chi ha ritirato, quando e in che condizioni era il veicolo, con le foto. Se serve, stampi il DDT (documento di trasporto) e la fattura parte verso l’Agenzia delle Entrate.",
          bullets: [
            "Posizione di ogni veicolo nel piazzale",
            "Conto dei giorni dall’ingresso alla riconsegna",
            "Verbale di riconsegna firmato dal cliente via link",
            "DDT stampabile e fattura elettronica con le notifiche di esito",
          ],
          href: "/moduli/piazzale",
          cta: "Vedi il modulo Custodia veicoli",
          image: {
            src: "/appshots/piazzalenuovo.png",
            alt: "Custodia veicoli e piazzale in RescueManager",
            width: 1024,
            height: 648,
          },
        },
      ]}
      flowTitle="Dalla chiamata alla fattura"
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
          desc: "Al privato la fattura subito; al committente la fattura massiva a fine mese, alle tariffe della convenzione. Invio elettronico, esito, scadenzario degli incassi.",
        },
      ]}
      connectionsIntro="I servizi che un centro di soccorso usa ogni giorno, collegati al programma senza passaggi in più."
      connections={[
        {
          ente: "Agenzia delle Entrate",
          title: "Fatturazione elettronica",
          short: "Fatture inviate dal gestionale con le notifiche di esito e lo scadenzario degli incassi.",
        },
        {
          ente: "WhatsApp Business",
          title: "Messaggi al cliente",
          short: "Messaggi automatici alla creazione dell’intervento e a ogni cambio di stato, con il link per seguirlo.",
        },
        {
          ente: "Mappe e navigazione",
          title: "App dell’autista",
          short: "Mappa degli interventi attivi in ufficio, navigatore passo-passo nell’app dell’autista.",
        },
        {
          ente: "Foto e condizioni",
          title: "Verbali di riconsegna",
          short: "Il cliente firma dal suo telefono, il verbale resta archiviato con il veicolo.",
        },
      ]}
      pkg={{
        title: "Il pacchetto Soccorso",
        intro:
          "Quello che consigliamo a chi fa soccorso stradale con uno o più carri attrezzi: i moduli che servono dalla chiamata alla fattura. Ognuno ha la sua pagina con i dettagli.",
        items: [
          { label: "Soccorso e trasporti: interventi, stati, mappa", href: "/moduli/trasporti" },
          { label: "Mezzi e autisti, con l’app per gli autisti", href: "/moduli/mezzi-autisti" },
          { label: "Clienti e committenti, con convenzioni e tariffari", href: "/moduli/clienti" },
          { label: "Custodia veicoli", href: "/moduli/piazzale" },
          { label: "Preventivi con accettazione online", href: "/moduli/preventivi" },
          { label: "Fatturazione elettronica", href: "/moduli/sdi" },
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
          a: "La custodia è compresa: ogni veicolo ha la sua posizione nel piazzale, il conto dei giorni parte dall’ingresso e alla riconsegna resta registrato chi ha ritirato e in che condizioni, con le foto. Vale per i veicoli dei tuoi soccorsi e per la depositeria.",
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
