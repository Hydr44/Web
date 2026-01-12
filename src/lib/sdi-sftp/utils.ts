/**
 * Utility per gestione SDI-SFTP
 * Naming convention, calcolo date giuliane, ecc.
 */

/**
 * Calcola il giorno giuliano (001-366) per una data
 * @param date Data (default: oggi)
 * @returns Stringa con anno (4 cifre) + giorno giuliano (3 cifre)
 */
export function getJulianDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diffTime = date.getTime() - startOfYear.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const julianDay = String(diffDays).padStart(3, '0');
  return `${year}${julianDay}`;
}

/**
 * Genera nome file FI secondo convenzione SDI
 * @param idNodo Identificativo nodo (P.IVA/CF)
 * @param progressivo Progressivo (000-899 produzione, 900-999 test)
 * @param testMode Se true, usa progressivo test (900-999)
 * @returns Nome file formato: FI.{IdNodo}.{aaaaggg}.{hhmm}.{nnn}.zip
 */
export function generateFIFilename(
  idNodo: string,
  progressivo: number,
  testMode: boolean = false
): string {
  const now = new Date();
  const aaaaggg = getJulianDate(now);
  const hhmm = String(now.getHours()).padStart(2, '0') + 
               String(now.getMinutes()).padStart(2, '0');
  
  // Progressivo: test 900-999, produzione 000-899
  const nnn = testMode 
    ? String(Math.min(999, Math.max(900, progressivo))).padStart(3, '0')
    : String(Math.min(899, Math.max(0, progressivo))).padStart(3, '0');
  
  return `FI.${idNodo}.${aaaaggg}.${hhmm}.${nnn}.zip`;
}

/**
 * Estrae informazioni da nome file SDI
 * @param filename Nome file (es: FI.12345678901.2025012.1430.001.zip)
 * @returns Oggetto con informazioni estratte
 */
export function parseSDIFilename(filename: string): {
  tipo: string;
  idNodo: string;
  aaaaggg: string;
  hhmm: string;
  nnn: string;
  testMode: boolean;
} | null {
  const match = filename.match(/^(FI|FO|EO|ER)\.([^.]+)\.(\d{7})\.(\d{4})\.(\d{3})/);
  if (!match) return null;
  
  const [, tipo, idNodo, aaaaggg, hhmm, nnn] = match;
  const progressivo = parseInt(nnn, 10);
  const testMode = progressivo >= 900;
  
  return {
    tipo,
    idNodo,
    aaaaggg,
    hhmm,
    nnn,
    testMode,
  };
}

/**
 * Verifica se un nome file segue la convenzione SDI
 */
export function isValidSDIFilename(filename: string): boolean {
  return parseSDIFilename(filename) !== null;
}

/**
 * Converte data da formato giuliano (aaaaggg) a Date
 */
export function julianDateToDate(aaaaggg: string): Date {
  const year = parseInt(aaaaggg.substring(0, 4), 10);
  const julianDay = parseInt(aaaaggg.substring(4, 7), 10);
  const date = new Date(year, 0, 1);
  date.setDate(julianDay);
  return date;
}

