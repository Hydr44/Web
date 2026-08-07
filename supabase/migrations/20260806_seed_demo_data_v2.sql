-- Migration: seed_demo_data(p_org_id uuid) — v2 MODULE-AWARE + IDEMPOTENTE
-- Popola l'app di un'organizzazione con dati realistici SOLO per i moduli
-- effettivamente attivi (orgs.desktop_modules). Sezioni: clienti, autisti, mezzi,
-- piazzale, trasporti, ricambi, fatturazione, rvfu, rentri.
--
-- IDEMPOTENZA (requisito: non incasinare i demo già popolati): OGNI sezione è
-- protetta da guardia NOT EXISTS su chiavi naturali demo (prefisso "DEMO-"), così
-- una seconda esecuzione NON crea duplicati e i contatori tornano tutti 0.
-- (Le versioni precedenti usavano ON CONFLICT DO NOTHING su clients/spare_parts/
--  transports: senza vincolo unico non bloccava nulla e duplicava.)
--
-- Tipi allineati allo schema reale prod (2026-08-06):
--   staff_drivers.id / transports.driver_id = bigint;
--   transports.status ∈ {new,assigned,enroute,done,canceled};
--   invoices.direction NOT NULL ∈ {active,passive}; payment_status ∈ {unpaid,partial,paid};
--   spare_parts_categories è GLOBALE (senza org_id) → category_id NULL, non la tocchiamo;
--   rentri_movimenti.causale_operazione = varchar(10) codice → omesso.
--
-- Uso:  select * from seed_demo_data('<org_uuid>');

CREATE OR REPLACE FUNCTION public.seed_demo_data(p_org_id uuid)
RETURNS TABLE(
  clients_added integer,
  drivers_added integer,
  vehicles_added integer,
  yard_added integer,
  transports_added integer,
  invoices_added integer,
  spare_parts_added integer,
  rvfu_added integer,
  rentri_added integer
) LANGUAGE plpgsql AS $$
DECLARE
  v_modules text[] := (SELECT COALESCE(desktop_modules, '{}') FROM orgs WHERE id = p_org_id);

  v_clients integer := 0;
  v_drivers integer := 0;
  v_vehicles integer := 0;
  v_yard integer := 0;
  v_transports integer := 0;
  v_invoices integer := 0;
  v_parts integer := 0;
  v_rvfu integer := 0;
  v_rentri integer := 0;
  v_tmp integer := 0;

  c_acme uuid; c_demolizioni uuid; c_sanmarco uuid; c_garage uuid;
  c_rossi uuid; c_bianchi uuid; c_logistica uuid; c_aci uuid;
  c_carrozzeria uuid; c_municipio uuid;

  d_giovanni bigint; d_mario bigint; d_luca bigint;  -- staff_drivers.id / transports.driver_id sono bigint
  v_furgone1 uuid; v_camion1 uuid; v_carroattrezzi uuid; v_pianale uuid; v_furgone2 uuid;

  inv1 uuid; inv2 uuid; inv3 uuid; inv4 uuid; inv5 uuid;

  r_registro uuid;

  v_year int := EXTRACT(YEAR FROM now())::int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orgs WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization % does not exist', p_org_id;
  END IF;

  -- ── 1) CLIENTI (10) — idempotente su codice DEMO-C001 ────────────────
  IF 'clienti' = ANY(v_modules) OR 'trasporti' = ANY(v_modules) OR 'fatturazione' = ANY(v_modules) THEN
    IF NOT EXISTS (SELECT 1 FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C001') THEN
      INSERT INTO clients (org_id, codice, nome, is_company, piva, tax_code, email, phone, address, zip, city, province, country, categoria_cliente, modalita_pagamento, giorni_dilazione)
      VALUES
        (p_org_id, 'DEMO-C001', 'ACME Trasporti S.r.l.', true, '01234567890', '01234567890', 'info@acmetrasporti.it', '+39 02 1234567', 'Via Roma 12', '20121', 'Milano', 'MI', 'IT', 'business', 'bonifico', 30),
        (p_org_id, 'DEMO-C002', 'Demolizioni Veloci SPA', true, '09876543210', '09876543210', 'fatturazione@demolizioniveloci.it', '+39 06 9876543', 'Via dei Fori 45', '00184', 'Roma', 'RM', 'IT', 'business', 'bonifico', 60),
        (p_org_id, 'DEMO-C003', 'Officina San Marco', true, '11223344556', '11223344556', 'ordini@officinasanmarco.it', '+39 045 1122334', 'Via Verdi 3', '37121', 'Verona', 'VR', 'IT', 'business', 'rb', 30),
        (p_org_id, 'DEMO-C004', 'Garage Centrale Sud', true, '55667788990', '55667788990', 'garage.sud@example.it', '+39 081 5566778', 'Via Toledo 88', '80132', 'Napoli', 'NA', 'IT', 'business', 'contanti', 0),
        (p_org_id, 'DEMO-C005', 'Mario Rossi', false, NULL, 'RSSMRA70A01H501Z', 'mario.rossi@example.it', '+39 333 1112222', 'Via Garibaldi 7', '00100', 'Roma', 'RM', 'IT', 'privato', 'contanti', 0),
        (p_org_id, 'DEMO-C006', 'Lucia Bianchi', false, NULL, 'BNCLCU85D45F205X', 'lucia.bianchi@example.it', '+39 340 3344556', 'Corso Italia 22', '20122', 'Milano', 'MI', 'IT', 'privato', 'contanti', 0),
        (p_org_id, 'DEMO-C007', 'Logistica Mediterranea', true, '22334455667', '22334455667', 'amministrazione@logmed.it', '+39 091 2233445', 'Via del Porto 1', '90133', 'Palermo', 'PA', 'IT', 'business', 'bonifico', 90),
        (p_org_id, 'DEMO-C008', 'ACI Soccorso Italia', true, '33445566778', '33445566778', 'soccorso@aci-demo.it', '+39 06 3344556', 'Via Marsala 8', '00185', 'Roma', 'RM', 'IT', 'convenzione', 'bonifico', 60),
        (p_org_id, 'DEMO-C009', 'Carrozzeria Moderna', true, '44556677889', '44556677889', 'info@carrozzeriamoderna.it', '+39 011 4455667', 'Via Po 14', '10124', 'Torino', 'TO', 'IT', 'business', 'bonifico', 30),
        (p_org_id, 'DEMO-C010', 'Comune di Gela', true, '82001310854', '82001310854', 'protocollo@comune.gela.cl.it', '+39 0933 906111', 'Piazza San Francesco 1', '93012', 'Gela', 'CL', 'IT', 'pa', 'bonifico_pa', 60);
      GET DIAGNOSTICS v_clients = ROW_COUNT;
    END IF;
    SELECT id INTO c_acme         FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C001';
    SELECT id INTO c_demolizioni  FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C002';
    SELECT id INTO c_sanmarco     FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C003';
    SELECT id INTO c_garage       FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C004';
    SELECT id INTO c_rossi        FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C005';
    SELECT id INTO c_bianchi      FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C006';
    SELECT id INTO c_logistica    FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C007';
    SELECT id INTO c_aci          FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C008';
    SELECT id INTO c_carrozzeria  FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C009';
    SELECT id INTO c_municipio    FROM clients WHERE org_id = p_org_id AND codice = 'DEMO-C010';
  END IF;

  -- ── 2) AUTISTI (3) — per-riga NOT EXISTS, contatore reale ────────────
  IF 'autisti' = ANY(v_modules) THEN
    INSERT INTO staff_drivers (org_id, nome, cognome, telefono, email, patente, stato, note)
    SELECT p_org_id, 'Giovanni', 'Esposito', '+39 348 1111222', 'giovanni.esposito@demo.it', 'CE', 'disponibile', 'Demo seed - autista esperto'
    WHERE NOT EXISTS (SELECT 1 FROM staff_drivers WHERE org_id = p_org_id AND nome = 'Giovanni' AND cognome = 'Esposito');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_drivers := v_drivers + v_tmp;
    INSERT INTO staff_drivers (org_id, nome, cognome, telefono, email, patente, stato, note)
    SELECT p_org_id, 'Mario', 'Verdi', '+39 348 3334444', 'mario.verdi@demo.it', 'C', 'disponibile', 'Demo seed - turno pomeridiano'
    WHERE NOT EXISTS (SELECT 1 FROM staff_drivers WHERE org_id = p_org_id AND nome = 'Mario' AND cognome = 'Verdi');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_drivers := v_drivers + v_tmp;
    INSERT INTO staff_drivers (org_id, nome, cognome, telefono, email, patente, stato, note)
    SELECT p_org_id, 'Luca', 'Ferrari', '+39 348 5556666', 'luca.ferrari@demo.it', 'B', 'occupato', 'Demo seed - in servizio'
    WHERE NOT EXISTS (SELECT 1 FROM staff_drivers WHERE org_id = p_org_id AND nome = 'Luca' AND cognome = 'Ferrari');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_drivers := v_drivers + v_tmp;
    SELECT id INTO d_giovanni FROM staff_drivers WHERE org_id = p_org_id AND nome = 'Giovanni' AND cognome = 'Esposito';
    SELECT id INTO d_mario    FROM staff_drivers WHERE org_id = p_org_id AND nome = 'Mario'    AND cognome = 'Verdi';
    SELECT id INTO d_luca     FROM staff_drivers WHERE org_id = p_org_id AND nome = 'Luca'     AND cognome = 'Ferrari';
  END IF;

  -- ── 3) MEZZI AZIENDALI (5) — per-riga NOT EXISTS ─────────────────────
  IF 'mezzi' = ANY(v_modules) THEN
    INSERT INTO vehicles (org_id, targa, marca, modello, tipo, portata, telaio, stato, scad_assicurazione, scad_revisione, scad_bollo, note)
    SELECT p_org_id, 'DEMO-FR01', 'Fiat', 'Ducato', 'furgone', '1500 kg', 'ZFA250000DEMO0001', 'disponibile', '2027-03-15', '2027-06-30', '2027-12-31', 'Demo seed - furgone leggero'
    WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-FR01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_vehicles := v_vehicles + v_tmp;
    INSERT INTO vehicles (org_id, targa, marca, modello, tipo, portata, telaio, stato, scad_assicurazione, scad_revisione, scad_bollo, note)
    SELECT p_org_id, 'DEMO-CM01', 'Iveco', 'Daily 70C18', 'camion', '7000 kg', 'ZCFC700000DEMO001', 'in_uso', '2027-05-20', '2027-08-15', '2027-12-31', 'Demo seed - camion medio'
    WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-CM01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_vehicles := v_vehicles + v_tmp;
    INSERT INTO vehicles (org_id, targa, marca, modello, tipo, portata, telaio, stato, scad_assicurazione, scad_revisione, scad_bollo, note)
    SELECT p_org_id, 'DEMO-CA01', 'Mercedes', 'Atego carro attrezzi', 'camion', '12000 kg', 'WDB970000DEMO0001', 'disponibile', '2027-02-10', '2027-07-20', '2027-12-31', 'Demo seed - carro attrezzi'
    WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-CA01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_vehicles := v_vehicles + v_tmp;
    INSERT INTO vehicles (org_id, targa, marca, modello, tipo, portata, telaio, stato, scad_assicurazione, scad_revisione, scad_bollo, note)
    SELECT p_org_id, 'DEMO-PI01', 'Scania', 'R450 con pianale', 'camion', '26000 kg', 'YS2R000000DEMO001', 'disponibile', '2027-04-30', '2027-09-10', '2027-12-31', 'Demo seed - pianale per trasporti speciali'
    WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-PI01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_vehicles := v_vehicles + v_tmp;
    INSERT INTO vehicles (org_id, targa, marca, modello, tipo, portata, telaio, stato, scad_assicurazione, scad_revisione, scad_bollo, note)
    SELECT p_org_id, 'DEMO-FR02', 'Ford', 'Transit', 'furgone', '1400 kg', 'WF0XXX000DEMO0002', 'manutenzione', '2027-01-15', '2027-05-10', '2027-12-31', 'Demo seed - in officina'
    WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-FR02');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_vehicles := v_vehicles + v_tmp;
    SELECT id INTO v_furgone1      FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-FR01';
    SELECT id INTO v_camion1       FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-CM01';
    SELECT id INTO v_carroattrezzi FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-CA01';
    SELECT id INTO v_pianale       FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-PI01';
    SELECT id INTO v_furgone2      FROM vehicles WHERE org_id = p_org_id AND targa = 'DEMO-FR02';
  END IF;

  -- ── 4) PIAZZALE (6) — per-riga NOT EXISTS ────────────────────────────
  IF 'piazzale' = ANY(v_modules) THEN
    INSERT INTO yard_vehicles (org_id, targa, marca, modello, telaio, zona, posizione, tag, numero_pratica, autorita_competente, data_sequestro, stato, note)
    SELECT p_org_id, 'DEMO-SQ01', 'Fiat', 'Panda', 'ZFA169000YARD0001', 'Zona A', 'A1', 'sequestro', 'PR-2026-001', 'Polizia Locale Gela', '2026-04-10', 'attivo', 'Demo seed - sequestro stradale'
    WHERE NOT EXISTS (SELECT 1 FROM yard_vehicles WHERE org_id = p_org_id AND targa = 'DEMO-SQ01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_yard := v_yard + v_tmp;
    INSERT INTO yard_vehicles (org_id, targa, marca, modello, telaio, zona, posizione, tag, numero_pratica, autorita_competente, data_confisca, stato, note)
    SELECT p_org_id, 'DEMO-CF01', 'Volkswagen', 'Golf', 'WVW000000YARD0001', 'Zona B', 'B2', 'confisca', 'CF-2026-007', 'Tribunale di Caltanissetta', '2026-03-22', 'attivo', 'Demo seed - confisca penale'
    WHERE NOT EXISTS (SELECT 1 FROM yard_vehicles WHERE org_id = p_org_id AND targa = 'DEMO-CF01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_yard := v_yard + v_tmp;
    INSERT INTO yard_vehicles (org_id, targa, marca, modello, telaio, zona, posizione, tag, stato, note)
    SELECT p_org_id, 'DEMO-DM01', 'Renault', 'Clio', 'VF1000000YARD0001', 'Zona D', 'D5', 'demolizione', 'attivo', 'Demo seed - pronto per VFU'
    WHERE NOT EXISTS (SELECT 1 FROM yard_vehicles WHERE org_id = p_org_id AND targa = 'DEMO-DM01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_yard := v_yard + v_tmp;
    INSERT INTO yard_vehicles (org_id, targa, marca, modello, telaio, zona, posizione, tag, stato, note)
    SELECT p_org_id, 'DEMO-DM02', 'Peugeot', '208', 'VF3000000YARD0002', 'Zona D', 'D6', 'demolizione', 'attivo', 'Demo seed - in attesa smontaggio'
    WHERE NOT EXISTS (SELECT 1 FROM yard_vehicles WHERE org_id = p_org_id AND targa = 'DEMO-DM02');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_yard := v_yard + v_tmp;
    INSERT INTO yard_vehicles (org_id, targa, marca, modello, telaio, zona, posizione, tag, stato, note)
    SELECT p_org_id, 'DEMO-VE01', 'BMW', 'Serie 3', 'WBA000000YARD0001', 'Zona V', 'V3', 'vendita', 'attivo', 'Demo seed - veicolo da vendere'
    WHERE NOT EXISTS (SELECT 1 FROM yard_vehicles WHERE org_id = p_org_id AND targa = 'DEMO-VE01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_yard := v_yard + v_tmp;
    INSERT INTO yard_vehicles (org_id, targa, marca, modello, telaio, zona, posizione, tag, stato, note)
    SELECT p_org_id, 'DEMO-AT01', 'Audi', 'A4', 'WAU000000YARD0001', 'Zona E', 'E2', 'attesa', 'attivo', 'Demo seed - in attesa documenti'
    WHERE NOT EXISTS (SELECT 1 FROM yard_vehicles WHERE org_id = p_org_id AND targa = 'DEMO-AT01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_yard := v_yard + v_tmp;
  END IF;

  -- ── 5) TRASPORTI (12) — idempotente (skip se già seminati) ───────────
  IF 'trasporti' = ANY(v_modules) THEN
    IF NOT EXISTS (SELECT 1 FROM transports WHERE org_id = p_org_id AND notes = 'Trasporto merce generica') THEN
      INSERT INTO transports (org_id, client_id, customer_name, pickup_address, dropoff_address, driver_id, vehicle_id, status, notes, meta)
      VALUES
        (p_org_id, c_acme, NULL, 'Via Roma 12, Milano', 'Via Verdi 3, Verona', d_giovanni, v_camion1, 'done', 'Trasporto merce generica',
         jsonb_build_object('service_type','standard','scheduled_date', (now() - interval '5 days')::date::text, 'scheduled_time','08:30','is_urgent',false,'price',450)),
        (p_org_id, c_sanmarco, NULL, 'Via Verdi 3, Verona', 'Via del Porto 1, Palermo', d_mario, v_pianale, 'enroute', 'Carico ricambi voluminosi',
         jsonb_build_object('service_type','standard','scheduled_date', now()::date::text, 'scheduled_time','06:00','is_urgent',false,'price',1850)),
        (p_org_id, c_garage, NULL, 'Via Toledo 88, Napoli', 'Via Garibaldi 7, Roma', d_luca, v_furgone1, 'new', 'Consegna ricambi officina',
         jsonb_build_object('service_type','standard','scheduled_date', (now() + interval '2 days')::date::text, 'scheduled_time','09:00','is_urgent',false,'price',320)),
        (p_org_id, c_aci, NULL, 'A1 km 528 direzione Nord', 'Officina San Marco, Verona', d_giovanni, v_carroattrezzi, 'done', 'Recupero veicolo in panne',
         jsonb_build_object('service_type','soccorso_stradale','scheduled_date', (now() - interval '2 days')::date::text, 'scheduled_time','14:20','is_urgent',true,'price',280,
           'service_data', jsonb_build_object('soc_tipo_intervento','traino','soc_targa','EH123XX','soc_marca_modello','Fiat 500','soc_motivo','guasto motore','soc_convenzione','ACI','soc_pratica','ACI-2026-04125','soc_km',45))),
        (p_org_id, c_rossi, 'Mario Rossi', 'Via Garibaldi 7, Roma', 'Officina ACI Roma Est', d_luca, v_carroattrezzi, 'done', 'Traino su autostrada',
         jsonb_build_object('service_type','soccorso_stradale','scheduled_date', (now() - interval '7 days')::date::text, 'scheduled_time','03:15','is_urgent',true,'price',180,
           'service_data', jsonb_build_object('soc_tipo_intervento','traino','soc_targa','FK987YZ','soc_marca_modello','VW Golf','soc_motivo','incidente lieve','soc_convenzione','Privato','soc_km',22))),
        (p_org_id, c_bianchi, 'Lucia Bianchi', 'Corso Italia 22, Milano', 'Carrozzeria Moderna, Torino', d_mario, v_carroattrezzi, 'done', 'Trasporto post-incidente',
         jsonb_build_object('service_type','soccorso_stradale','scheduled_date', (now() - interval '1 days')::date::text, 'scheduled_time','11:00','is_urgent',true,'price',420,
           'service_data', jsonb_build_object('soc_tipo_intervento','traino','soc_targa','GH456AB','soc_marca_modello','Audi A3','soc_motivo','incidente','soc_convenzione','Assicurazione','soc_km',140))),
        (p_org_id, c_logistica, NULL, 'Via del Porto 1, Palermo', 'Interporto di Catania', d_giovanni, v_pianale, 'assigned', 'Trasporto container',
         jsonb_build_object('service_type','conto_terzi','scheduled_date', (now() + interval '4 days')::date::text, 'scheduled_time','07:30','is_urgent',false,'price',780,
           'service_data', jsonb_build_object('ct_committente','Logistica Mediterranea','ct_committente_piva','22334455667','ct_ordine','ORD-2026-1287','ct_merce','Container 40ft'))),
        (p_org_id, c_demolizioni, NULL, 'Via dei Fori 45, Roma', 'Cantiere periferia Roma', d_mario, v_pianale, 'done', 'Trasporto inerti demolizione',
         jsonb_build_object('service_type','conto_terzi','scheduled_date', (now() - interval '3 days')::date::text, 'scheduled_time','06:00','is_urgent',false,'price',650,
           'service_data', jsonb_build_object('ct_committente','Demolizioni Veloci SPA','ct_committente_piva','09876543210','ct_ordine','DV-2026-0451','ct_merce','Macerie edili - 18 t'))),
        (p_org_id, c_carrozzeria, NULL, 'Via Po 14, Torino', 'Capannone industriale Settimo T.', d_luca, v_pianale, 'assigned', 'Trasporto eccezionale',
         jsonb_build_object('service_type','mezzi_speciali','scheduled_date', (now() + interval '7 days')::date::text, 'scheduled_time','05:00','is_urgent',false,'price',2400,
           'service_data', jsonb_build_object('ms_tipo_mezzo','escavatore','ms_peso_t',28,'ms_adr',false,'ms_autorizzazione','AUT-MIT-2026-0918','ms_scorta_tecnica',true))),
        (p_org_id, c_municipio, NULL, 'Piazza San Francesco 1, Gela', 'Discarica autorizzata Caltanissetta', d_giovanni, v_camion1, 'assigned', 'Trasporto rifiuti speciali - convenzione Comune',
         jsonb_build_object('service_type','mezzi_speciali','scheduled_date', (now() + interval '10 days')::date::text, 'scheduled_time','08:00','is_urgent',false,'price',520,
           'service_data', jsonb_build_object('ms_tipo_mezzo','rifiuti speciali','ms_peso_t',8,'ms_adr',true,'ms_adr_classe','Classe 9','ms_autorizzazione','ALBO-GEST-RIF-IT-12345','ms_scorta_tecnica',false))),
        (p_org_id, c_rossi, 'Mario Rossi', 'Via Garibaldi 7, Roma', 'Officina Centro Roma', NULL, NULL, 'canceled', 'Annullato dal cliente',
         jsonb_build_object('service_type','standard','scheduled_date', (now() - interval '4 days')::date::text, 'scheduled_time','15:00','is_urgent',false,'price',120)),
        (p_org_id, c_acme, NULL, 'Via Roma 12, Milano', 'Magazzino centrale Sesto', d_mario, v_furgone1, 'new', 'URGENTE - consegna ricambi linea produzione',
         jsonb_build_object('service_type','standard','scheduled_date', now()::date::text, 'scheduled_time','16:30','is_urgent',true,'price',230));
      GET DIAGNOSTICS v_transports = ROW_COUNT;
    END IF;
  END IF;

  -- ── 6) RICAMBI (10) — idempotente su DEMO-SP-001, category_id NULL ───
  IF 'ricambi' = ANY(v_modules) THEN
    IF NOT EXISTS (SELECT 1 FROM spare_parts WHERE org_id = p_org_id AND internal_code = 'DEMO-SP-001') THEN
      INSERT INTO spare_parts (org_id, internal_code, name, description, category_id, oem_code, condition, status, quantity, price_buy, price_sell, warehouse_location)
      VALUES
        (p_org_id, 'DEMO-SP-001', 'Alternatore Fiat Panda 1.2',      'Alternatore 80A revisionato',              NULL, '46823549',   'refurbished', 'available', 2, 35,  95,  'Scaffale A-12'),
        (p_org_id, 'DEMO-SP-002', 'Motorino avviamento Golf 1.6 TDI','Motorino di avviamento usato OK',           NULL, '02M911024A', 'used',        'available', 1, 40,  110, 'Scaffale A-14'),
        (p_org_id, 'DEMO-SP-003', 'Cofano anteriore Renault Clio',   'Cofano grigio metallizzato, lievi graffi', NULL, 'CC44-CLIO',  'used',        'available', 1, 25,  80,  'Settore B - Z3'),
        (p_org_id, 'DEMO-SP-004', 'Paraurti posteriore Peugeot 208', 'Paraurti completo con sensori',            NULL, 'PG208-PB',   'used',        'available', 1, 30,  95,  'Settore B - Z4'),
        (p_org_id, 'DEMO-SP-005', 'Specchietto retrovisore destro Golf','Specchietto elettrico con frecce',       NULL, 'VW-GOLF-SRD','used',        'available', 3, 12,  45,  'Cassetto C-08'),
        (p_org_id, 'DEMO-SP-006', 'Pinza freno anteriore Fiat 500',  'Pinza freno revisionata',                  NULL, 'F500-PFA',   'refurbished', 'available', 4, 18,  65,  'Scaffale F-02'),
        (p_org_id, 'DEMO-SP-007', 'Disco freno anteriore Audi A4',   'Disco freno ventilato 320mm',              NULL, 'AUDI-A4-DFA','used',        'available', 2, 22,  70,  'Scaffale F-05'),
        (p_org_id, 'DEMO-SP-008', 'Centralina motore VW Polo 1.2',   'Centralina ECU programmabile',             NULL, '03E906033',  'used',        'reserved',  1, 80,  220, 'Cassettiera E-01'),
        (p_org_id, 'DEMO-SP-009', 'Batteria 70Ah BMW Serie 3',       'Batteria al piombo testata',               NULL, 'BMW-BAT-70', 'used',        'available', 1, 25,  75,  'Scaffale E-03'),
        (p_org_id, 'DEMO-SP-010', 'Cambio manuale 5 marce Clio',     'Cambio manuale completo',                  NULL, 'CLIO-CMB5',  'used',        'sold',      0, 120, 380, 'Scaffale A-22');
      GET DIAGNOSTICS v_parts = ROW_COUNT;
    END IF;
  END IF;

  -- ── 7) FATTURE (5) + righe — per-fattura IF NOT EXISTS ───────────────
  IF 'fatturazione' = ANY(v_modules) THEN
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = p_org_id AND number = 'DEMO-001/' || v_year::text) THEN
      INSERT INTO invoices (org_id, number, date, currency, customer_name, customer_vat, customer_tax_code, customer_address, total, sdi_status, payment_status, direction, provider_id, meta)
      VALUES (p_org_id, 'DEMO-001/' || v_year::text, (now() - interval '20 days')::date, 'EUR', 'ACME Trasporti S.r.l.', '01234567890', '01234567890',
              jsonb_build_object('street','Via Roma 12','zip','20121','city','Milano','province','MI','country','IT'),
              549.00, 'draft', 'paid', 'active', 'sdi_prod',
              jsonb_build_object('sdi', jsonb_build_object('documento', jsonb_build_object('tipo_documento','TD01'))))
      RETURNING id INTO inv1;
      INSERT INTO invoice_items (invoice_id, item_code, item_description, qty, price, vat_perc) VALUES
        (inv1, 'Trasporto Milano-Verona', 'Trasporto merce generica', 1, 450, 22);
      v_invoices := v_invoices + 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = p_org_id AND number = 'DEMO-002/' || v_year::text) THEN
      INSERT INTO invoices (org_id, number, date, currency, customer_name, customer_vat, customer_tax_code, customer_address, total, sdi_status, payment_status, direction, provider_id, meta)
      VALUES (p_org_id, 'DEMO-002/' || v_year::text, (now() - interval '12 days')::date, 'EUR', 'Officina San Marco', '11223344556', '11223344556',
              jsonb_build_object('street','Via Verdi 3','zip','37121','city','Verona','province','VR','country','IT'),
              220.00, 'draft', 'unpaid', 'active', 'sdi_prod',
              jsonb_build_object('sdi', jsonb_build_object('documento', jsonb_build_object('tipo_documento','TD01'))))
      RETURNING id INTO inv2;
      INSERT INTO invoice_items (invoice_id, item_code, item_description, qty, price, vat_perc) VALUES
        (inv2, 'Ricambio motorino avviamento', 'Motorino avviamento Golf revisionato', 1, 110, 22),
        (inv2, 'Ricambio alternatore', 'Alternatore Panda revisionato',                 1, 95,  22);
      v_invoices := v_invoices + 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = p_org_id AND number = 'DEMO-003/' || v_year::text) THEN
      INSERT INTO invoices (org_id, number, date, currency, customer_name, customer_vat, customer_tax_code, customer_address, total, sdi_status, payment_status, direction, provider_id, meta)
      VALUES (p_org_id, 'DEMO-003/' || v_year::text, (now() - interval '7 days')::date, 'EUR', 'Mario Rossi', NULL, 'RSSMRA70A01H501Z',
              jsonb_build_object('street','Via Garibaldi 7','zip','00100','city','Roma','province','RM','country','IT'),
              219.60, 'draft', 'paid', 'active', 'sdi_prod',
              jsonb_build_object('sdi', jsonb_build_object('documento', jsonb_build_object('tipo_documento','TD01'))))
      RETURNING id INTO inv3;
      INSERT INTO invoice_items (invoice_id, item_code, item_description, qty, price, vat_perc) VALUES
        (inv3, 'Soccorso stradale traino', 'Traino A1 a Officina', 1, 180, 22);
      v_invoices := v_invoices + 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = p_org_id AND number = 'DEMO-004/' || v_year::text) THEN
      INSERT INTO invoices (org_id, number, date, currency, customer_name, customer_vat, customer_tax_code, customer_address, total, sdi_status, payment_status, direction, provider_id, meta)
      VALUES (p_org_id, 'DEMO-004/' || v_year::text, (now() - interval '3 days')::date, 'EUR', 'Comune di Gela', '82001310854', '82001310854',
              jsonb_build_object('street','Piazza San Francesco 1','zip','93012','city','Gela','province','CL','country','IT'),
              634.40, 'draft', 'unpaid', 'active', 'sdi_prod',
              jsonb_build_object('sdi', jsonb_build_object('documento', jsonb_build_object('tipo_documento','TD01'))))
      RETURNING id INTO inv4;
      INSERT INTO invoice_items (invoice_id, item_code, item_description, qty, price, vat_perc) VALUES
        (inv4, 'Trasporto rifiuti speciali', 'Trasporto autorizzato a discarica', 1, 520, 22);
      v_invoices := v_invoices + 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE org_id = p_org_id AND number = 'DEMO-005/' || v_year::text) THEN
      INSERT INTO invoices (org_id, number, date, currency, customer_name, customer_vat, customer_tax_code, customer_address, total, sdi_status, payment_status, direction, provider_id, meta)
      VALUES (p_org_id, 'DEMO-005/' || v_year::text, (now() - interval '1 days')::date, 'EUR', 'Logistica Mediterranea', '22334455667', '22334455667',
              jsonb_build_object('street','Via del Porto 1','zip','90133','city','Palermo','province','PA','country','IT'),
              2257.00, 'draft', 'partial', 'active', 'sdi_prod',
              jsonb_build_object('sdi', jsonb_build_object('documento', jsonb_build_object('tipo_documento','TD01'))))
      RETURNING id INTO inv5;
      INSERT INTO invoice_items (invoice_id, item_code, item_description, qty, price, vat_perc) VALUES
        (inv5, 'Trasporto Palermo-Catania container', 'Container 40ft - viaggio singolo', 1, 780,  22),
        (inv5, 'Trasporto inerti edili',              'Macerie - 18 t',                   1, 650,  22),
        (inv5, 'Trasporto eccezionale escavatore',    'Mezzo speciale - scorta tecnica',  1, 420,  22);
      v_invoices := v_invoices + 1;
    END IF;
  END IF;

  -- ── 8) RVFU / DEMOLIZIONI (4) — per-riga NOT EXISTS ──────────────────
  IF 'rvfu' = ANY(v_modules) THEN
    INSERT INTO demolition_cases (org_id, stato, meta, normativa_applicabile, targa, marca_modello, anno, note, rvfu_causale, rvfu_data_demolizione, rvfu_proprietario_nome, rvfu_proprietario_cognome, rvfu_proprietario_cf)
    SELECT p_org_id, 'bozza', '{}'::jsonb, '209/03', 'DEMO-RV01', 'Fiat Panda 1.2', 2008, 'Demo seed - pratica in compilazione', 'radiazione per demolizione', NULL, 'Mario', 'Rossi', 'RSSMRA70A01H501Z'
    WHERE NOT EXISTS (SELECT 1 FROM demolition_cases WHERE org_id = p_org_id AND targa = 'DEMO-RV01');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rvfu := v_rvfu + v_tmp;
    INSERT INTO demolition_cases (org_id, stato, meta, normativa_applicabile, targa, marca_modello, anno, note, rvfu_causale, rvfu_data_demolizione, rvfu_proprietario_nome, rvfu_proprietario_cognome, rvfu_proprietario_cf)
    SELECT p_org_id, 'documenti', '{}'::jsonb, '209/03', 'DEMO-RV02', 'Volkswagen Golf 1.6 TDI', 2011, 'Demo seed - smontaggio in corso', 'radiazione per demolizione', NULL, 'Lucia', 'Bianchi', 'BNCLCU85D45F205X'
    WHERE NOT EXISTS (SELECT 1 FROM demolition_cases WHERE org_id = p_org_id AND targa = 'DEMO-RV02');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rvfu := v_rvfu + v_tmp;
    INSERT INTO demolition_cases (org_id, stato, meta, normativa_applicabile, targa, marca_modello, anno, note, rvfu_causale, rvfu_data_demolizione, rvfu_proprietario_nome, rvfu_proprietario_cognome, rvfu_proprietario_cf)
    SELECT p_org_id, 'inviata', '{}'::jsonb, '152/06', 'DEMO-RV03', 'Renault Clio 1.5 dCi', 2006, 'Demo seed - veicolo demolito, certificato emesso', 'radiazione per demolizione', (now() - interval '15 days')::date, 'Giovanni', 'Esposito', 'SPSGNN75M12F205K'
    WHERE NOT EXISTS (SELECT 1 FROM demolition_cases WHERE org_id = p_org_id AND targa = 'DEMO-RV03');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rvfu := v_rvfu + v_tmp;
    INSERT INTO demolition_cases (org_id, stato, meta, normativa_applicabile, targa, marca_modello, anno, note, rvfu_causale, rvfu_data_demolizione, rvfu_proprietario_nome, rvfu_proprietario_cognome, rvfu_proprietario_cf)
    SELECT p_org_id, 'completata', '{}'::jsonb, '209/03', 'DEMO-RV04', 'Peugeot 208 1.4 HDi', 2013, 'Demo seed - pratica chiusa e trasmessa', 'radiazione per demolizione', (now() - interval '40 days')::date, 'Luca', 'Ferrari', 'FRRLCU80A01L219T'
    WHERE NOT EXISTS (SELECT 1 FROM demolition_cases WHERE org_id = p_org_id AND targa = 'DEMO-RV04');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rvfu := v_rvfu + v_tmp;
  END IF;

  -- ── 9) RENTRI (registro + 3 movimenti + 2 formulari) — per-riga NOT EXISTS ──
  IF 'rentri' = ANY(v_modules) THEN
    INSERT INTO rentri_registri (org_id, anno, tipo, numero_registro, sezione, stato, descrizione)
    SELECT p_org_id, v_year, 'carico_scarico', 'DEMO-REG-' || v_year::text, 'AUT', 'attivo', 'Demo seed - registro cronologico veicoli fuori uso'
    WHERE NOT EXISTS (SELECT 1 FROM rentri_registri WHERE org_id = p_org_id AND numero_registro = 'DEMO-REG-' || v_year::text);
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rentri := v_rentri + v_tmp;
    SELECT id INTO r_registro FROM rentri_registri WHERE org_id = p_org_id AND numero_registro = 'DEMO-REG-' || v_year::text;
    INSERT INTO rentri_movimenti (org_id, registro_id, tipo_operazione, data_operazione, numero_riga, codice_eer, descrizione_eer, quantita, unita_misura)
    SELECT p_org_id, r_registro, 'carico', (now() - interval '10 days')::date, 1, '160104*', 'Veicoli fuori uso', 850, 'kg'
    WHERE NOT EXISTS (SELECT 1 FROM rentri_movimenti WHERE org_id = p_org_id AND registro_id = r_registro AND codice_eer = '160104*' AND data_operazione = (now() - interval '10 days')::date);
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rentri := v_rentri + v_tmp;
    INSERT INTO rentri_movimenti (org_id, registro_id, tipo_operazione, data_operazione, numero_riga, codice_eer, descrizione_eer, quantita, unita_misura)
    SELECT p_org_id, r_registro, 'carico', (now() - interval '8 days')::date, 2, '160106', 'Veicoli fuori uso, non contenenti liquidi ne altre componenti pericolose', 1200, 'kg'
    WHERE NOT EXISTS (SELECT 1 FROM rentri_movimenti WHERE org_id = p_org_id AND registro_id = r_registro AND codice_eer = '160106' AND data_operazione = (now() - interval '8 days')::date);
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rentri := v_rentri + v_tmp;
    INSERT INTO rentri_movimenti (org_id, registro_id, tipo_operazione, data_operazione, numero_riga, codice_eer, descrizione_eer, quantita, unita_misura)
    SELECT p_org_id, r_registro, 'scarico', (now() - interval '5 days')::date, 3, '160107*', 'Filtri dell''olio', 45, 'kg'
    WHERE NOT EXISTS (SELECT 1 FROM rentri_movimenti WHERE org_id = p_org_id AND registro_id = r_registro AND codice_eer = '160107*' AND data_operazione = (now() - interval '5 days')::date);
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rentri := v_rentri + v_tmp;
    INSERT INTO rentri_formulari (org_id, numero_fir, anno, data_creazione, produttore_cf, produttore_nome, trasportatore_cf, trasportatore_nome, trasportatore_targa, destinatario_cf, destinatario_nome, codici_eer, stato, note)
    SELECT p_org_id, 'DEMO-FIR-001', v_year, (now() - interval '5 days')::date, '01234567890', 'ACME Trasporti S.r.l.', '02176370852', 'RescueManager SRL', 'DEMO-CM01', '44556677889', 'Carrozzeria Moderna', '["160104"]'::jsonb, 'bozza', 'Demo seed - FIR filtri olio a recupero'
    WHERE NOT EXISTS (SELECT 1 FROM rentri_formulari WHERE org_id = p_org_id AND numero_fir = 'DEMO-FIR-001');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rentri := v_rentri + v_tmp;
    INSERT INTO rentri_formulari (org_id, numero_fir, anno, data_creazione, produttore_cf, produttore_nome, trasportatore_cf, trasportatore_nome, trasportatore_targa, destinatario_cf, destinatario_nome, codici_eer, stato, note)
    SELECT p_org_id, 'DEMO-FIR-002', v_year, (now() - interval '2 days')::date, '09876543210', 'Demolizioni Veloci SPA', '02176370852', 'RescueManager SRL', 'DEMO-PI01', '22334455667', 'Logistica Mediterranea', '["160106","160107"]'::jsonb, 'bozza', 'Demo seed - FIR carcasse a impianto'
    WHERE NOT EXISTS (SELECT 1 FROM rentri_formulari WHERE org_id = p_org_id AND numero_fir = 'DEMO-FIR-002');
    GET DIAGNOSTICS v_tmp = ROW_COUNT; v_rentri := v_rentri + v_tmp;
  END IF;

  RETURN QUERY SELECT v_clients, v_drivers, v_vehicles, v_yard, v_transports, v_invoices, v_parts, v_rvfu, v_rentri;
END;
$$;

COMMENT ON FUNCTION public.seed_demo_data(uuid) IS
  'Popola org con dati demo realistici SOLO per i moduli attivi (orgs.desktop_modules). Idempotente: ogni sezione è protetta da NOT EXISTS su chiavi naturali DEMO-, ri-eseguibile senza duplicati (contatori 0 alla 2a esecuzione).';

-- ─────────────────────────────────────────────────────────────────
-- Helper: rimuovi i dati demo per testare il reset (rvfu + rentri inclusi).
-- NB: spare_parts_categories NON viene toccata (tabella globale senza org_id).
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.clear_demo_data(p_org_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_year int := EXTRACT(YEAR FROM now())::int;
BEGIN
  DELETE FROM invoice_items WHERE invoice_id IN (
    SELECT id FROM invoices WHERE org_id = p_org_id AND number LIKE 'DEMO-%/' || v_year::text
  );
  DELETE FROM invoices       WHERE org_id = p_org_id AND number LIKE 'DEMO-%/' || v_year::text;
  DELETE FROM spare_parts    WHERE org_id = p_org_id AND internal_code LIKE 'DEMO-SP-%';
  DELETE FROM transports     WHERE org_id = p_org_id AND (
    notes LIKE '%Demo seed%' OR notes IN (
      'Trasporto merce generica','Carico ricambi voluminosi','Consegna ricambi officina',
      'Recupero veicolo in panne','Traino su autostrada','Trasporto post-incidente',
      'Trasporto container','Trasporto inerti demolizione','Trasporto eccezionale',
      'Trasporto rifiuti speciali - convenzione Comune','Annullato dal cliente',
      'URGENTE - consegna ricambi linea produzione'
    )
  );
  DELETE FROM yard_vehicles  WHERE org_id = p_org_id AND targa LIKE 'DEMO-%';
  DELETE FROM vehicles       WHERE org_id = p_org_id AND targa LIKE 'DEMO-%';
  DELETE FROM staff_drivers  WHERE org_id = p_org_id AND email LIKE '%@demo.it';
  DELETE FROM clients        WHERE org_id = p_org_id AND codice LIKE 'DEMO-C%';
  DELETE FROM demolition_cases WHERE org_id = p_org_id AND targa LIKE 'DEMO-RV%';
  DELETE FROM rentri_movimenti WHERE org_id = p_org_id AND registro_id IN (
    SELECT id FROM rentri_registri WHERE org_id = p_org_id AND numero_registro LIKE 'DEMO-REG-%'
  );
  DELETE FROM rentri_registri  WHERE org_id = p_org_id AND numero_registro LIKE 'DEMO-REG-%';
  DELETE FROM rentri_formulari WHERE org_id = p_org_id AND numero_fir LIKE 'DEMO-FIR-%';
END;
$$;

COMMENT ON FUNCTION public.clear_demo_data(uuid) IS
  'Rimuove tutti i dati seed creati da seed_demo_data() per la org indicata (incluse sezioni rvfu e rentri). Non tocca spare_parts_categories (globale).';
