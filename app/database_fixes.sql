-- 🔒 SÄKERHETSFIX FÖR SIE-MODULEN
-- Lägg till userId kolumn i konton-tabellen och skapa security_logs

-- 1. Lägg till userId kolumn i konton-tabellen
ALTER TABLE konton ADD COLUMN "userId" TEXT;

-- 2. Uppdatera unique constraint för att inkludera userId
-- (Ta bort gamla constraint först)
ALTER TABLE konton DROP CONSTRAINT IF EXISTS unique_kontonummer;

-- Lägg till ny constraint som tillåter samma kontonummer för olika användare
ALTER TABLE konton ADD CONSTRAINT unique_kontonummer_per_user UNIQUE (kontonummer, "userId");

-- 3. Skapa security_logs tabellen för säkerhetsloggning
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    module TEXT,
    ip_address INET,
    user_agent TEXT
);

-- 4. Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_module ON security_logs(module);
CREATE INDEX IF NOT EXISTS idx_konton_userid ON konton("userId");

-- 5. Lägg till foreign key constraint om users tabellen finns
-- ALTER TABLE konton ADD CONSTRAINT fk_konton_user FOREIGN KEY ("userId") REFERENCES users(id);
-- ALTER TABLE security_logs ADD CONSTRAINT fk_security_logs_user FOREIGN KEY (user_id) REFERENCES users(id);

-- 6. Sätt upp Row Level Security (RLS) för konton
ALTER TABLE konton ENABLE ROW LEVEL SECURITY;

-- Policy: Användare kan bara se sina egna konton
CREATE POLICY konton_user_policy ON konton
    FOR ALL
    USING ("userId" = current_setting('app.current_user_id', true));

-- 7. Sätt upp Row Level Security för security_logs
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Användare kan bara se sina egna loggar (eller admin kan se alla)
CREATE POLICY security_logs_user_policy ON security_logs
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true));

-- 8. Skapa sie_importer tabellen om den inte finns (för import-spårning)
CREATE TABLE IF NOT EXISTS sie_importer (
    id SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    filnamn TEXT NOT NULL,
    filstorlek INTEGER,
    sie_program TEXT,
    sie_organisationsnummer TEXT,
    sie_företagsnamn TEXT,
    sie_datumintervall_från DATE,
    sie_datumintervall_till DATE,
    antal_verifikationer INTEGER DEFAULT 0,
    antal_transaktionsposter INTEGER DEFAULT 0,
    antal_balansposter INTEGER DEFAULT 0,
    antal_resultatposter INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pågående',
    skapad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    slutförd TIMESTAMP
);

-- Index för sie_importer
CREATE INDEX IF NOT EXISTS idx_sie_importer_userid ON sie_importer("userId");
CREATE INDEX IF NOT EXISTS idx_sie_importer_status ON sie_importer(status);

-- RLS för sie_importer
ALTER TABLE sie_importer ENABLE ROW LEVEL SECURITY;
CREATE POLICY sie_importer_user_policy ON sie_importer
    FOR ALL
    USING ("userId" = current_setting('app.current_user_id', true));

-- Säkerhetsmeddelande
SELECT 'Databasschema uppdaterat för SIE-säkerhet!' AS status;
