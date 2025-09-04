-- EMAIL VERIFICATION MIGRATION
-- Kör detta SQL-script i din PostgreSQL databas för att lägga till email-verifiering

-- Lägg till kolumner för email-verifiering
-- OBS: Du har redan 'emailVerified' (camelCase), vi lägger till snake_case version
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;

-- Skapa index för prestanda
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Synkronisera befintlig emailVerified (camelCase) med ny email_verified (snake_case)
UPDATE users 
SET email_verified = COALESCE("emailVerified" IS NOT NULL, FALSE)
WHERE email_verified IS NULL;

-- Märk befintliga OAuth-användare som verifierade
-- (kontrollera accounts tabellen för OAuth-användare)
UPDATE users 
SET email_verified = TRUE 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM accounts 
  WHERE provider IN ('google', 'facebook')
) AND email_verified IS NOT TRUE;

-- Optional: Märk alla befintliga användare som verifierade
-- (för befintlig prod-data - endast om du vill auto-verifiera alla)
-- UPDATE users SET email_verified = TRUE WHERE email_verified IS NOT TRUE;

-- accounts tabellen finns redan, inget behov att skapa den
-- Men lägg till index för prestanda om de inte finns
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider);

-- Visa resultat
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users,
  COUNT(CASE WHEN email_verified = FALSE OR email_verified IS NULL THEN 1 END) as unverified_users,
  COUNT(CASE WHEN "emailVerified" IS NOT NULL THEN 1 END) as legacy_verified_users
FROM users;

-- Visa resultat
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users,
  COUNT(CASE WHEN email_verified = FALSE THEN 1 END) as unverified_users
FROM users;
