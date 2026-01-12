/**
 * API Route: Trasmetti Movimenti Registro a RENTRI
 * POST /api/rentri/registri/[id]/movimenti-sync
 * 
 * Trasmette movimenti di un registro alle API RENTRI
 * Pattern asincrono NONBLOCK_PULL_REST
 * 
 * Questo endpoint è stato spostato da /movimenti per separare CRUD locale dalla sincronizzazione
 */

export { POST } from '../movimenti/route-sync-backup';

