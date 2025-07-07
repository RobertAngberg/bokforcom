-- Lägg till de semester-kolumner som togs bort från anställda-tabellen
ALTER TABLE semester ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE semester ADD COLUMN IF NOT EXISTS betalda_dagar DECIMAL(10,2) DEFAULT 0;
ALTER TABLE semester ADD COLUMN IF NOT EXISTS sparade_dagar DECIMAL(10,2) DEFAULT 0;
ALTER TABLE semester ADD COLUMN IF NOT EXISTS skuld DECIMAL(10,2) DEFAULT 0;
ALTER TABLE semester ADD COLUMN IF NOT EXISTS obetalda_dagar DECIMAL(10,2) DEFAULT 0;
ALTER TABLE semester ADD COLUMN IF NOT EXISTS komp_dagar DECIMAL(10,2) DEFAULT 0;
ALTER TABLE semester ADD COLUMN IF NOT EXISTS intjänade_dagar DECIMAL(10,2) DEFAULT 0;

-- Lägg till belopp-kolumn för semesterpenning
ALTER TABLE semester ADD COLUMN IF NOT EXISTS belopp DECIMAL(10,2) DEFAULT 0;

-- Skapa index för prestanda
CREATE INDEX IF NOT EXISTS idx_semester_anställd_user ON semester(anställd_id, user_id);
CREATE INDEX IF NOT EXISTS idx_semester_typ ON semester(typ);

-- Visa struktur
\d semester;
