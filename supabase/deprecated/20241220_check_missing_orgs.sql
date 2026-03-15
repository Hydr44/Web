-- Check missing org_ids
SELECT DISTINCT org_id FROM public.barcode_lookup 
WHERE org_id NOT IN (SELECT id FROM public.orgs)
UNION
SELECT DISTINCT org_id FROM public.assistance_requests 
WHERE org_id NOT IN (SELECT id FROM public.orgs)
UNION
SELECT DISTINCT org_id FROM public.ddt 
WHERE org_id NOT IN (SELECT id FROM public.orgs)
UNION
SELECT DISTINCT org_id FROM public.invoices 
WHERE org_id NOT IN (SELECT id FROM public.orgs)
UNION
SELECT DISTINCT org_id FROM public.outbox_emails 
WHERE org_id NOT IN (SELECT id FROM public.orgs)
UNION
SELECT DISTINCT org_id FROM public.quotes 
WHERE org_id NOT IN (SELECT id FROM public.orgs)
UNION
SELECT DISTINCT org_id FROM public.recognition_logs 
WHERE org_id NOT IN (SELECT id FROM public.orgs);
