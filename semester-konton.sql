-- Lägg till saknade BAS-konton för semesterhantering

-- Konto 2920 - Semesterskuld
INSERT INTO konton (kontonummer, beskrivning, kontoslag, konto_typ, under_konto, aktiv) 
VALUES ('2920', 'Semesterskuld', 'Skulder', 'Balansräkning', '29', true)
ON CONFLICT (kontonummer) DO UPDATE SET
    beskrivning = EXCLUDED.beskrivning,
    kontoslag = EXCLUDED.kontoslag,
    konto_typ = EXCLUDED.konto_typ,
    under_konto = EXCLUDED.under_konto,
    aktiv = EXCLUDED.aktiv;

-- Konto 7533 - Semesterersättning
INSERT INTO konton (kontonummer, beskrivning, kontoslag, konto_typ, under_konto, aktiv) 
VALUES ('7533', 'Semesterersättning', 'Kostnader', 'Resultaträkning', '75', true)
ON CONFLICT (kontonummer) DO UPDATE SET
    beskrivning = EXCLUDED.beskrivning,
    kontoslag = EXCLUDED.kontoslag,
    konto_typ = EXCLUDED.konto_typ,
    under_konto = EXCLUDED.under_konto,
    aktiv = EXCLUDED.aktiv;

-- Konto 7534 - Semesterlön
INSERT INTO konton (kontonummer, beskrivning, kontoslag, konto_typ, under_konto, aktiv) 
VALUES ('7534', 'Semesterlön', 'Kostnader', 'Resultaträkning', '75', true)
ON CONFLICT (kontonummer) DO UPDATE SET
    beskrivning = EXCLUDED.beskrivning,
    kontoslag = EXCLUDED.kontoslag,
    konto_typ = EXCLUDED.konto_typ,
    under_konto = EXCLUDED.under_konto,
    aktiv = EXCLUDED.aktiv;
