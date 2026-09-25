import { permanentRedirect } from "next/navigation";

// Il download vero vive nel portale (con la barra laterale e il controllo di
// accesso): /dashboard/download. Ma quella pagina e' fuori dall'indice, e
// mandarci /download significava far sparire da Google un indirizzo che la
// gente cerca e che era gia' indicizzato.
//
// /download manda quindi su /accessi, la pagina pubblica "Accessi e download":
// spiega da dove si scarica il programma e l'app, resta indicizzabile e
// raccoglie il valore del vecchio indirizzo. Chi e' collegato arriva al
// portale da li' in un clic.
export default function Page() {
  permanentRedirect("/accessi");
}
