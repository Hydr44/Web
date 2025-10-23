-- Add foreign key constraints
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

ALTER TABLE public.org_members 
ADD CONSTRAINT org_members_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.org_settings 
ADD CONSTRAINT org_settings_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.org_subscriptions 
ADD CONSTRAINT org_subscriptions_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.org_billing_connections 
ADD CONSTRAINT org_billing_connections_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.vehicles 
ADD CONSTRAINT vehicles_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.transports 
ADD CONSTRAINT transports_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.demolition_cases 
ADD CONSTRAINT demolition_cases_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.clients 
ADD CONSTRAINT clients_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.quote_presets 
ADD CONSTRAINT quote_presets_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.users 
ADD CONSTRAINT users_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.staff_drivers 
ADD CONSTRAINT staff_drivers_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.staff_vehicles 
ADD CONSTRAINT staff_vehicles_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);

ALTER TABLE public.rvfu_configurations 
ADD CONSTRAINT rvfu_configurations_org_id_fkey 
FOREIGN KEY (org_id) REFERENCES public.orgs(id);
