-- Fix för security_logs tabellen
-- Lägg till userId kolumn om den saknas

ALTER TABLE security_logs 
ADD COLUMN IF NOT EXISTS "userId" INTEGER;

-- Lägg till foreign key constraint om tabellen users finns
-- ALTER TABLE security_logs 
-- ADD CONSTRAINT fk_security_logs_user 
-- FOREIGN KEY ("userId") REFERENCES users(id);

-- Kontrollera att tabellen nu har rätt struktur
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'security_logs';
