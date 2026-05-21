/**
 * Validazione P.IVA e Codice Fiscale italiani.
 * Implementa il checksum ufficiale (no librerie esterne, leggero).
 */

/** P.IVA: 11 cifre, ultima cifra = checksum Luhn-like (algoritmo AdE). */
export function isValidPIVA(input: string): boolean {
  const s = (input || "").replace(/\s/g, "");
  if (!/^\d{11}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let n = Number(s[i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

/**
 * Codice fiscale persona fisica: 16 caratteri, ultimo è la cifra di controllo
 * alfabetica (algoritmo MEF). Accetta anche CF "numerico" (11 cifre = P.IVA).
 */
export function isValidCF(input: string): boolean {
  const s = (input || "").replace(/\s/g, "").toUpperCase();
  // CF org / P.IVA: 11 cifre
  if (/^\d{11}$/.test(s)) return isValidPIVA(s);
  // CF persona fisica: 16 char alfanumerici (con sostituzioni omocodia)
  if (!/^[A-Z0-9]{16}$/.test(s)) return false;

  const odd = [
    1, 0, 5, 7, 9, 13, 15, 17, 19, 21,
    1, 0, 5, 7, 9, 13, 15, 17, 19, 21,
    2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23,
  ];
  const even = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
  ];
  const indexOf = (ch: string) => {
    if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - "0".charCodeAt(0);
    return ch.charCodeAt(0) - "A".charCodeAt(0) + 10;
  };
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const idx = indexOf(s[i]);
    sum += i % 2 === 0 ? odd[idx] : even[idx];
  }
  const expectedChar = String.fromCharCode("A".charCodeAt(0) + (sum % 26));
  return expectedChar === s[15];
}

/**
 * Heuristic: input è una P.IVA o un CF accettabile?
 * Per i campi che ammettono entrambi (es. anagrafica org).
 */
export function isValidPIVAorCF(input: string): boolean {
  return isValidPIVA(input) || isValidCF(input);
}
