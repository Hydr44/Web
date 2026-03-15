-- Aggiungi campo is_admin alla tabella profiles
-- Solo il fondatore avrà is_admin = true

ALTER TABLE profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Imposta il fondatore come admin (sostituisci con il tuo user_id)
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-id-here';

-- Crea indice per performance
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);
