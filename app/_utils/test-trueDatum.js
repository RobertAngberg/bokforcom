// TESTFIL FÖR trueDatum.js - Kör med: node test-trueDatum.js

// Importera funktionerna (simulerat för test)
function ÅÅÅÅMMDDTillDate(datum) {
    if (!datum) return null;

    const [år, månad, dag] = datum.split('-').map(Number);
    if (!år || !månad || !dag) return null;

    return new Date(år, månad - 1, dag);
}

function dateTillÅÅÅÅMMDD(date) {
    if (!date) return "";

    const år = date.getFullYear();
    const månad = (date.getMonth() + 1).toString().padStart(2, '0');
    const dag = date.getDate().toString().padStart(2, '0');

    return `${år}-${månad}-${dag}`;
}

// TESTER
console.log("🧪 TESTAR trueDatum FUNKTIONER\n");

// Test 1: Grundläggande konvertering
console.log("📅 TEST 1: Grundläggande konvertering");
const testDatum = "2024-05-28";
const date = ÅÅÅÅMMDDTillDate(testDatum);
const tillbaka = dateTillÅÅÅÅMMDD(date);
console.log(`Input: ${testDatum}`);
console.log(`Konverterad till Date: ${date}`);
console.log(`Tillbaka till sträng: ${tillbaka}`);
console.log(`✅ Matchar original: ${testDatum === tillbaka ? 'JA' : 'NEJ'}\n`);

// Test 2: Problematiska datum (28:e)
console.log("📅 TEST 2: Problematiska datum (28:e)");
const problematiskDatum = "2024-02-28";
const date2 = ÅÅÅÅMMDDTillDate(problematiskDatum);
const tillbaka2 = dateTillÅÅÅÅMMDD(date2);
console.log(`Input: ${problematiskDatum}`);
console.log(`Konverterad till Date: ${date2}`);
console.log(`Tillbaka till sträng: ${tillbaka2}`);
console.log(`✅ Matchar original: ${problematiskDatum === tillbaka2 ? 'JA' : 'NEJ'}\n`);

// Test 3: Månads-gränser
console.log("📅 TEST 3: Månads-gränser");
const månadsgränser = ["2024-01-31", "2024-03-31", "2024-12-31"];
månadsgränser.forEach(datum => {
    const date = ÅÅÅÅMMDDTillDate(datum);
    const tillbaka = dateTillÅÅÅÅMMDD(date);
    console.log(`${datum} → ${tillbaka} ${datum === tillbaka ? '✅' : '❌'}`);
});

console.log("\n📅 TEST 4: Jämförelse med riskabla metoder");
const testDatum4 = "2024-05-28";

// GAMMAL RISKABEL METOD
const gammalDate = new Date(`${testDatum4}T00:00:00`);
const gammalTillbaka = gammalDate.toISOString().split("T")[0];

// NY SÄKER METOD  
const nyDate = ÅÅÅÅMMDDTillDate(testDatum4);
const nyTillbaka = dateTillÅÅÅÅMMDD(nyDate);

console.log(`Original: ${testDatum4}`);
console.log(`Gammal metod: ${gammalTillbaka} ${testDatum4 === gammalTillbaka ? '✅' : '❌'}`);
console.log(`Ny metod: ${nyTillbaka} ${testDatum4 === nyTillbaka ? '✅' : '❌'}`);

console.log("\n🎯 RESULTAT:");
console.log("- Om alla tester visar ✅, så är trueDatum bombsäkert");
console.log("- Om något visar ❌, så behöver vi fixa det");
