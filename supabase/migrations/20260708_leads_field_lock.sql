-- Migration: Blocco campi lead dopo l'attivazione (CRM Commerciale — Fase 1)
-- Created: 2026-07-08
-- Spec: docs/specs/crm-commerciale-provvigione.md §14
-- Dipende da: 20260708_leads_assigned_staff.sql (usa leads.assigned_staff_id)
--
-- Perché: una volta che il lead è ATTIVATO (cliente pagante), certi campi non
-- devono più cambiare — per integrità della fatturazione e, con un agente
-- esterno a provvigione, per impedire che l'attribuzione del deal (owner) venga
-- riassegnata dopo l'incasso. Enforcement a livello DB perché le route usano il
-- service-role (RLS bypassata): il trigger vale per QUALSIASI percorso di update.
--
-- Campi bloccati: identità fiscale (vat_number, codice_fiscale, company, pec,
-- forma_giuridica, codice_ateco) + attribuzione (assigned_staff_id).
-- Restano modificabili: name (referente), phone, email, notes, tags, follow-up…
--
-- Override eccezionale (solo super_admin, da route dedicata + audit):
--   SET LOCAL app.allow_locked_lead_edit = 'on';  -- nella stessa transazione
--
-- Idempotente: CREATE OR REPLACE + DROP/CREATE TRIGGER.

CREATE OR REPLACE FUNCTION enforce_lead_field_lock()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Attivo solo su lead già attivati (alias storico: 'converted').
  IF OLD.status IN ('attivato', 'converted')
     AND coalesce(current_setting('app.allow_locked_lead_edit', true), 'off') <> 'on'
  THEN
    IF NEW.vat_number      IS DISTINCT FROM OLD.vat_number
    OR NEW.codice_fiscale  IS DISTINCT FROM OLD.codice_fiscale
    OR NEW.company         IS DISTINCT FROM OLD.company
    OR NEW.pec             IS DISTINCT FROM OLD.pec
    OR NEW.forma_giuridica IS DISTINCT FROM OLD.forma_giuridica
    OR NEW.codice_ateco    IS DISTINCT FROM OLD.codice_ateco
    OR NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id
    THEN
      RAISE EXCEPTION
        'Lead % attivato: identità fiscale e attribuzione sono bloccate e non modificabili.', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_field_lock ON leads;
CREATE TRIGGER trg_lead_field_lock
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION enforce_lead_field_lock();
