// Test script för att verifiera extrarad mappningar
const fs = require('fs');
const path = require('path');

// Läs extraradDefinitioner.ts
const extraradPath = path.join(__dirname, 'personal/Lönespecar/Extrarader/extraradDefinitioner.ts');
const extraradContent = fs.readFileSync(extraradPath, 'utf8');

// Läs BokförLöner.tsx
const bokforPath = path.join(__dirname, 'personal/Lönespecar/BokförLöner.tsx');
const bokforContent = fs.readFileSync(bokforPath, 'utf8');

// Extrahera alla extraradtyper från definitionen
const extraradRegex = /(\w+):\s*{[^}]*skattepliktig:\s*(true|false)/g;
let match;
const definieradeTyper = {};
while ((match = extraradRegex.exec(extraradContent)) !== null) {
    definieradeTyper[match[1]] = match[2] === 'true';
}

// Extrahera alla mappade typer från EXTRARAD_TILL_KONTO
const mappingRegex = /(\w+):\s*{\s*konto:/g;
const mappadeTyper = [];
let mappingMatch;
while ((mappingMatch = mappingRegex.exec(bokforContent)) !== null) {
    mappadeTyper.push(mappingMatch[1]);
}

console.log('=== EXTRARAD MAPPING VERIFIERING ===\n');

console.log('📋 Alla definierade extraradtyper:');
Object.entries(definieradeTyper).forEach(([typ, skattepliktig]) => {
    const status = skattepliktig ? '🟡 skattepliktig' : '🟢 skattefri';
    console.log(`  ${typ}: ${status}`);
});

console.log('\n📌 Mappade typer i BokförLöner:');
mappadeTyper.forEach(typ => {
    console.log(`  ${typ}`);
});

// Kontrollera täckning
const definieradeNycklar = Object.keys(definieradeTyper);
const skattepliktigaOchSkattefria = definieradeNycklar.filter(typ =>
    definieradeTyper[typ] === true || definieradeTyper[typ] === false
);

const saknarMapping = skattepliktigaOchSkattefria.filter(typ => !mappadeTyper.includes(typ));
const extaMapping = mappadeTyper.filter(typ => !definieradeNycklar.includes(typ));

console.log('\n🔍 RESULTAT:');
if (saknarMapping.length > 0) {
    console.log('❌ Saknar bokföringskonto:');
    saknarMapping.forEach(typ => console.log(`  - ${typ}`));
} else {
    console.log('✅ Alla extraradtyper har bokföringskonto');
}

if (extaMapping.length > 0) {
    console.log('⚠️  Extra mappningar (finns ej i definition):');
    extaMapping.forEach(typ => console.log(`  - ${typ}`));
} else {
    console.log('✅ Inga överflödiga mappningar');
}

if (saknarMapping.length === 0 && extaMapping.length === 0) {
    console.log('\n🎉 PERFEKT! Alla mappningar är kompletta och konsistenta.');
} else {
    console.log('\n⚠️  Mappningarna behöver uppdateras.');
}
