-- Add only missing foreign key constraints
-- Check and add constraints only if they don't exist

-- barcode_lookup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'barcode_lookup_org_id_fkey' 
        AND table_name = 'barcode_lookup'
    ) THEN
        ALTER TABLE public.barcode_lookup 
        ADD CONSTRAINT barcode_lookup_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added barcode_lookup_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'barcode_lookup_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding barcode_lookup_org_id_fkey: %', SQLERRM;
END $$;

-- assistance_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assistance_requests_org_id_fkey' 
        AND table_name = 'assistance_requests'
    ) THEN
        ALTER TABLE public.assistance_requests 
        ADD CONSTRAINT assistance_requests_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added assistance_requests_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'assistance_requests_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding assistance_requests_org_id_fkey: %', SQLERRM;
END $$;

-- invoices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoices_org_id_fkey' 
        AND table_name = 'invoices'
    ) THEN
        ALTER TABLE public.invoices 
        ADD CONSTRAINT invoices_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added invoices_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'invoices_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding invoices_org_id_fkey: %', SQLERRM;
END $$;

-- outbox_emails
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'outbox_emails_org_id_fkey' 
        AND table_name = 'outbox_emails'
    ) THEN
        ALTER TABLE public.outbox_emails 
        ADD CONSTRAINT outbox_emails_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added outbox_emails_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'outbox_emails_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding outbox_emails_org_id_fkey: %', SQLERRM;
END $$;

-- quotes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotes_org_id_fkey' 
        AND table_name = 'quotes'
    ) THEN
        ALTER TABLE public.quotes 
        ADD CONSTRAINT quotes_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added quotes_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'quotes_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding quotes_org_id_fkey: %', SQLERRM;
END $$;

-- recognition_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recognition_logs_org_id_fkey' 
        AND table_name = 'recognition_logs'
    ) THEN
        ALTER TABLE public.recognition_logs 
        ADD CONSTRAINT recognition_logs_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added recognition_logs_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'recognition_logs_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding recognition_logs_org_id_fkey: %', SQLERRM;
END $$;

-- org_members
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'org_members_org_id_fkey' 
        AND table_name = 'org_members'
    ) THEN
        ALTER TABLE public.org_members 
        ADD CONSTRAINT org_members_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added org_members_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'org_members_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding org_members_org_id_fkey: %', SQLERRM;
END $$;

-- org_settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'org_settings_org_id_fkey' 
        AND table_name = 'org_settings'
    ) THEN
        ALTER TABLE public.org_settings 
        ADD CONSTRAINT org_settings_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added org_settings_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'org_settings_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding org_settings_org_id_fkey: %', SQLERRM;
END $$;

-- org_subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'org_subscriptions_org_id_fkey' 
        AND table_name = 'org_subscriptions'
    ) THEN
        ALTER TABLE public.org_subscriptions 
        ADD CONSTRAINT org_subscriptions_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added org_subscriptions_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'org_subscriptions_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding org_subscriptions_org_id_fkey: %', SQLERRM;
END $$;

-- org_billing_connections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'org_billing_connections_org_id_fkey' 
        AND table_name = 'org_billing_connections'
    ) THEN
        ALTER TABLE public.org_billing_connections 
        ADD CONSTRAINT org_billing_connections_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added org_billing_connections_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'org_billing_connections_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding org_billing_connections_org_id_fkey: %', SQLERRM;
END $$;

-- drivers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'drivers_org_id_fkey' 
        AND table_name = 'drivers'
    ) THEN
        ALTER TABLE public.drivers 
        ADD CONSTRAINT drivers_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added drivers_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'drivers_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding drivers_org_id_fkey: %', SQLERRM;
END $$;

-- vehicles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicles_org_id_fkey' 
        AND table_name = 'vehicles'
    ) THEN
        ALTER TABLE public.vehicles 
        ADD CONSTRAINT vehicles_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added vehicles_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'vehicles_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding vehicles_org_id_fkey: %', SQLERRM;
END $$;

-- transports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transports_org_id_fkey' 
        AND table_name = 'transports'
    ) THEN
        ALTER TABLE public.transports 
        ADD CONSTRAINT transports_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added transports_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'transports_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding transports_org_id_fkey: %', SQLERRM;
END $$;

-- demolition_cases
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'demolition_cases_org_id_fkey' 
        AND table_name = 'demolition_cases'
    ) THEN
        ALTER TABLE public.demolition_cases 
        ADD CONSTRAINT demolition_cases_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added demolition_cases_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'demolition_cases_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding demolition_cases_org_id_fkey: %', SQLERRM;
END $$;

-- clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clients_org_id_fkey' 
        AND table_name = 'clients'
    ) THEN
        ALTER TABLE public.clients 
        ADD CONSTRAINT clients_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added clients_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'clients_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding clients_org_id_fkey: %', SQLERRM;
END $$;

-- quote_presets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quote_presets_org_id_fkey' 
        AND table_name = 'quote_presets'
    ) THEN
        ALTER TABLE public.quote_presets 
        ADD CONSTRAINT quote_presets_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added quote_presets_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'quote_presets_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding quote_presets_org_id_fkey: %', SQLERRM;
END $$;

-- users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_org_id_fkey' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added users_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'users_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding users_org_id_fkey: %', SQLERRM;
END $$;

-- staff_drivers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_drivers_org_id_fkey' 
        AND table_name = 'staff_drivers'
    ) THEN
        ALTER TABLE public.staff_drivers 
        ADD CONSTRAINT staff_drivers_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added staff_drivers_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'staff_drivers_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding staff_drivers_org_id_fkey: %', SQLERRM;
END $$;

-- staff_vehicles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_vehicles_org_id_fkey' 
        AND table_name = 'staff_vehicles'
    ) THEN
        ALTER TABLE public.staff_vehicles 
        ADD CONSTRAINT staff_vehicles_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added staff_vehicles_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'staff_vehicles_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding staff_vehicles_org_id_fkey: %', SQLERRM;
END $$;

-- rvfu_configurations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rvfu_configurations_org_id_fkey' 
        AND table_name = 'rvfu_configurations'
    ) THEN
        ALTER TABLE public.rvfu_configurations 
        ADD CONSTRAINT rvfu_configurations_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES public.orgs(id);
        RAISE NOTICE 'Added rvfu_configurations_org_id_fkey constraint';
    ELSE
        RAISE NOTICE 'rvfu_configurations_org_id_fkey constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding rvfu_configurations_org_id_fkey: %', SQLERRM;
END $$;
