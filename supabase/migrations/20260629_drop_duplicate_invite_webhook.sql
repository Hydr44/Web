-- 20260629_drop_duplicate_invite_webhook.sql
--
-- DOPPIA EMAIL D'INVITO TEAM.
-- org_invites aveva DUE trigger AFTER INSERT che portavano a inviare l'email:
--   1) "team-invite-email"      → webhook http_request alla edge function
--                                  send-team-invite  (INVIA davvero)
--   2) on_org_invite_created    → funzione send_team_invite_email() che è un
--                                  PLACEHOLDER (solo RAISE NOTICE, non invia)
-- In più il DESKTOP, alla creazione invito, chiama GIÀ a mano la stessa edge
-- function (TeamSettings.sendInviteEmail → supabase.functions.invoke) e gestisce
-- anche il "Reinvia". Quindi il webhook su INSERT è un DUPLICATO dell'invio del
-- desktop → l'utente riceveva 2 email.
--
-- FIX: il desktop resta l'unico mittente (create + reinvia). Rimuoviamo:
--   - il webhook duplicato "team-invite-email"
--   - il trigger placeholder on_org_invite_created (dead code, non invia nulla)
--
-- Idempotente. DEPLOY: PROD (ienzdgrqalltvkdkuamp) + STAGING (rqwdimgwtewrsintvwoe).

drop trigger if exists "team-invite-email" on public.org_invites;
drop trigger if exists on_org_invite_created on public.org_invites;
