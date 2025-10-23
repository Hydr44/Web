-- Safe schema cleanup migration
-- First check what org_ids exist, then add constraints only for existing ones

-- 1. Check existing org_ids in barcode_lookup
SELECT DISTINCT org_id FROM public.barcode_lookup 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

-- 2. Check existing org_ids in other tables
SELECT DISTINCT org_id FROM public.assistance_requests 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

SELECT DISTINCT org_id FROM public.ddt 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

SELECT DISTINCT org_id FROM public.invoices 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

SELECT DISTINCT org_id FROM public.outbox_emails 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

SELECT DISTINCT org_id FROM public.quotes 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

SELECT DISTINCT org_id FROM public.recognition_logs 
WHERE org_id NOT IN (SELECT id FROM public.orgs);

-- 3. Add constraints only if no orphaned records exist
-- We'll add them one by one and handle errors gracefully

-- Try to add barcode_lookup constraint
DO $$
BEGIN
    -- Check if there are orphaned records
    IF NOT EXISTS (
        SELECT 1 FROM public.barcode_lookup 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.barcode_lookup 
        ADD CONSTRAINT barcode_lookup_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added barcode_lookup_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped barcode_lookup_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding barcode_lookup_org_id_fkey: %', SQLERRM;
END $$;

-- Try to add assistance_requests constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.assistance_requests 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.assistance_requests 
        ADD CONSTRAINT assistance_requests_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added assistance_requests_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped assistance_requests_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding assistance_requests_org_id_fkey: %', SQLERRM;
END $$;

-- Try to add ddt constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.ddt 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.ddt 
        ADD CONSTRAINT ddt_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added ddt_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped ddt_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding ddt_org_id_fkey: %', SQLERRM;
END $$;

-- Try to add invoices constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.invoices 
        ADD CONSTRAINT invoices_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added invoices_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped invoices_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding invoices_org_id_fkey: %', SQLERRM;
END $$;

-- Try to add outbox_emails constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.outbox_emails 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.outbox_emails 
        ADD CONSTRAINT outbox_emails_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added outbox_emails_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped outbox_emails_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding outbox_emails_org_id_fkey: %', SQLERRM;
END $$;

-- Try to add quotes constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.quotes 
        ADD CONSTRAINT quotes_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added quotes_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped quotes_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding quotes_org_id_fkey: %', SQLERRM;
END $$;

-- Try to add recognition_logs constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.recognition_logs 
        WHERE org_id NOT IN (SELECT id FROM public.orgs)
    ) THEN
        ALTER TABLE public.recognition_logs 
        ADD CONSTRAINT recognition_logs_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added recognition_logs_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'Skipped recognition_logs_org_id_fkey - orphaned records exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding recognition_logs_org_id_fkey: %', SQLERRM;
END $$;
