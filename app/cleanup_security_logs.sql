-- Ta bort överflödig userId kolumn från security_logs tabellen
-- Vi behåller user_id (text, NOT NULL) och tar bort userId (integer, nullable)

-- Först kontrollera att user_id kolumnen har data och userId inte används
SELECT 
    COUNT(*) as total_rows,
    COUNT(user_id) as user_id_populated,
    COUNT("userId") as userId_populated
FROM security_logs;

-- Ta bort userId kolumnen
ALTER TABLE security_logs 
DROP COLUMN IF EXISTS "userId";

-- Verifiera att kolumnen är borttagen
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'security_logs'
ORDER BY ordinal_position;
