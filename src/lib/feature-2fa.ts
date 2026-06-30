/**
 * Interruttore 2FA (web).
 *
 * Tenuto a `false` di proposito: il secondo fattore è completo sul portale web
 * ma NON sull'app desktop (il login desktop non fa il challenge AAL2 → sarebbe
 * un bypass). Finché non è applicato su tutte le app lo teniamo disattivato per
 * non avere una sicurezza incoerente.
 *
 * Quando il 2FA sarà applicato ovunque (web + desktop), rimettere a `true`:
 *  - riattiva l'enforcement nel layout dashboard
 *  - rende di nuovo visibili gli ingressi 2FA nella pagina Sicurezza
 *  - sblocca la pagina /dashboard/security/2fa (enroll/challenge)
 */
export const TWO_FACTOR_ENABLED = false;
