-- Schema cleanup migration
-- Fixes foreign key constraints and table references

-- 1. Add missing foreign key constraints
ALTER TABLE public.barcode_lookup 
ADD CONSTRAINT barcode_lookup_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.assistance_requests 
ADD CONSTRAINT assistance_requests_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.ddt 
ADD CONSTRAINT ddt_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.outbox_emails 
ADD CONSTRAINT outbox_emails_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.recognition_logs 
ADD CONSTRAINT recognition_logs_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 2. Fix table references (orgs -> organizations)
-- Note: These tables reference 'orgs' but should reference 'organizations'
-- We'll add comments for now since we can't change the schema structure

COMMENT ON TABLE public.spare_parts IS 'References orgs(id) - should be organizations(id)';
COMMENT ON TABLE public.vehicles_catalog IS 'References orgs(id) - should be organizations(id)';
COMMENT ON TABLE public.yard_items IS 'References orgs(id) - should be organizations(id)';

-- 3. Add missing foreign keys for org_members
ALTER TABLE public.org_members 
ADD CONSTRAINT org_members_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 4. Add missing foreign keys for org_settings
ALTER TABLE public.org_settings 
ADD CONSTRAINT org_settings_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 5. Add missing foreign keys for org_subscriptions
ALTER TABLE public.org_subscriptions 
ADD CONSTRAINT org_subscriptions_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 6. Add missing foreign keys for org_billing_connections
ALTER TABLE public.org_billing_connections 
ADD CONSTRAINT org_billing_connections_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 7. Add missing foreign keys for drivers
ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 8. Add missing foreign keys for vehicles
ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 9. Add missing foreign keys for transports
ALTER TABLE public.transports 
ADD CONSTRAINT transports_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 10. Add missing foreign keys for demolition_cases
ALTER TABLE public.demolition_cases 
ADD CONSTRAINT demolition_cases_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 11. Add missing foreign keys for clients
ALTER TABLE public.clients 
ADD CONSTRAINT clients_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 12. Add missing foreign keys for quote_presets
ALTER TABLE public.quote_presets 
ADD CONSTRAINT quote_presets_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 13. Add missing foreign keys for users
ALTER TABLE public.users 
ADD CONSTRAINT users_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 14. Add missing foreign keys for staff_drivers
ALTER TABLE public.staff_drivers 
ADD CONSTRAINT staff_drivers_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 15. Add missing foreign keys for staff_vehicles
ALTER TABLE public.staff_vehicles 
ADD CONSTRAINT staff_vehicles_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

-- 16. Add missing foreign keys for rvfu_configurations
ALTER TABLE public.rvfu_configurations 
ADD CONSTRAINT rvfu_configurations_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);
