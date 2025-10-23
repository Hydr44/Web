-- Create missing org records
INSERT INTO public.orgs (id, name, created_at, created_by)
VALUES 
(
    '1ea3be12-a439-46ac-94d9-eaff1bb346c2',
    'RescueManager Organization 1',
    NOW(),
    (SELECT id FROM auth.users LIMIT 1)
),
(
    '4eb45d62-3173-4f62-9d06-c60d7f184ff4',
    'RescueManager Organization 2',
    NOW(),
    (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;
