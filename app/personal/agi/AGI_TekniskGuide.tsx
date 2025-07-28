"use client";

import AnimeradFlik from "../../_components/AnimeradFlik";

export default function AGI_TekniskGuide() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">AGI Teknisk Guide</h1>
        <p className="text-cyan-100">
          Teknisk beskrivning version 1.1.17.1 för arbetsgivardeklaration på individnivå
        </p>
        <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-400/30 rounded-lg">
          <p className="text-yellow-100 text-sm">
            <strong>Viktiga ändringar 2025:</strong> Nya regler för frånvarouppgifter och utvidgat
            växa-stöd
          </p>
        </div>
      </div>

      {/* Ny funktionalitet 2025 */}
      <AnimeradFlik title="Nyheter 2025" icon="🆕" forcedOpen={true}>
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              Frånvarouppgifter (från 1 januari 2025)
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                • Obligatorisk rapportering av frånvaro som ger rätt till föräldrapenning/tillfällig
                föräldrapenning
              </li>
              <li>• Uppgifter överförs automatiskt till Försäkringskassan</li>
              <li>• Redovisas per betalningsmottagare, datum och typ av frånvaro</li>
              <li>• Nya fältkoder: FK820-FK827</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Utvidgat växa-stöd (från 1 januari 2025)
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Omfattar upp till <strong>två anställda</strong> (tidigare en)
              </li>
              <li>
                • Beloppsgräns höjd till <strong>35 000 kr/månad</strong> (tidigare 25 000 kr)
              </li>
              <li>• Gäller ersättning utbetald efter 31 december 2024</li>
              <li>• Ny fältkod: FK063</li>
            </ul>
          </div>
        </div>
      </AnimeradFlik>

      {/* Teknisk implementation */}
      <AnimeradFlik title="Teknisk Implementation" icon="💻">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">XML-filformat</h3>
            <div className="bg-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Encoding:</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">UTF-8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Schema version:</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">1.1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Max filstorlek testtjänst:</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">100 MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Max filstorlek produktion:</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">500 MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Max antal deklarationer:</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-sm">1 000</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">XML-struktur</h3>
            <div className="bg-slate-800 text-green-400 rounded-lg p-4 font-mono text-sm">
              <div>&lt;root:Skatteverket omrade="Arbetsgivardeklaration"&gt;</div>
              <div className="ml-4">&lt;Avsandare&gt;</div>
              <div className="ml-4">&lt;Blankettgemensamt&gt;</div>
              <div className="ml-4">&lt;Blankett&gt;</div>
              <div className="ml-8">&lt;Agaruppgift&gt; {/* Huvuduppgift */}</div>
              <div className="ml-8">&lt;Uppgift&gt; {/* Individuppgift */}</div>
              <div className="ml-8">&lt;Franvarouppgift&gt; {/* Frånvarouppgift */}</div>
              <div className="ml-4">&lt;/Blankett&gt;</div>
              <div>&lt;/root:Skatteverket&gt;</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Obligatoriska attribut</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800">Alla uppgifter</h4>
                <ul className="text-sm text-red-700 mt-1">
                  <li>• faltkod (fast värde)</li>
                  <li>• RedovisningsPeriod (FK006)</li>
                  <li>• AgRegistreradId (FK201)</li>
                </ul>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h4 className="font-medium text-orange-800">Individuppgifter</h4>
                <ul className="text-sm text-orange-700 mt-1">
                  <li>• Specifikationsnummer (FK570)</li>
                  <li>• Minst ett ID-fält (FK215/FK222/FK224)</li>
                  <li>• Exakt ett skattefält</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AnimeradFlik>

      {/* Frånvarouppgifter detaljer */}
      <AnimeradFlik title="Frånvarouppgifter (2025)" icon="👶">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Viktigt att komma ihåg</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Redovisas samma period som ersättningen påverkas</li>
              <li>• Kan inte ändras efter inlämning</li>
              <li>• Skickas automatiskt till Försäkringskassan</li>
              <li>• Sparas som utkast tills deklarationen skickas in</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Fältkoder för frånvarouppgifter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {frånvaroFält.map((fält) => (
                <div key={fält.kod} className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold">
                      FK{fält.kod}
                    </span>
                    <span className="font-medium text-sm">{fält.titel}</span>
                  </div>
                  <p className="text-xs text-gray-600">{fält.beskrivning}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Exempel frånvarorapportering</h3>
            <div className="bg-slate-100 rounded-lg p-4">
              <h4 className="font-medium mb-2">
                Scenario: Anställd frånvarande 2 dagar i mars, påverkar april lön
              </h4>
              <div className="space-y-2 text-sm">
                <div className="bg-white p-2 rounded border">
                  <strong>Frånvaro 1:</strong> 2025-03-17, Tillfällig föräldrapenning, 100%
                  frånvaro, Redovisningsperiod: 202504
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong>Frånvaro 2:</strong> 2025-03-21, Tillfällig föräldrapenning, 75% frånvaro,
                  Redovisningsperiod: 202504
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimeradFlik>

      {/* Växa-stöd */}
      <AnimeradFlik title="Växa-stöd (Utvidgat 2025)" icon="🌱">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Tidigare regler (före 2025)</h3>
              <ul className="text-sm space-y-1">
                <li>
                  • Max <strong>en anställd</strong>
                </li>
                <li>
                  • Beloppsgräns: <strong>25 000 kr/månad</strong>
                </li>
                <li>• Gällde t.o.m. 2024-12-31</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Nya regler (från 2025)</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>
                  • Max <strong>två anställda</strong>
                </li>
                <li>
                  • Beloppsgräns: <strong>35 000 kr/månad</strong>
                </li>
                <li>• Gäller ersättning efter 2024-12-31</li>
                <li>• Anställning efter 2024-04-30 för två anställda</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Fältkod för utvidgat växa-stöd</h3>
            <div className="bg-gray-50 border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                  FK063
                </span>
                <span className="font-medium">Utvidgat växa-stöd</span>
              </div>
              <p className="text-sm text-gray-600">
                Används för att markera ersättning som omfattas av det utvidgade växa-stödet med två
                anställda och höjd beloppsgräns.
              </p>
            </div>
          </div>
        </div>
      </AnimeradFlik>

      {/* Kontroller och validering */}
      <AnimeradFlik title="Kontroller och Validering" icon="✅">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Avvisande fel</h3>
              <p className="text-sm text-red-700 mb-2">Filen kan inte laddas upp</p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• Schemavalideringsfel</li>
                <li>• Felaktigt format</li>
                <li>• För stor fil</li>
                <li>• Korrupt data</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Stoppande fel</h3>
              <p className="text-sm text-yellow-700 mb-2">Måste rättas före inlämning</p>
              <ul className="text-xs text-yellow-600 space-y-1">
                <li>• Motstridiga uppgifter</li>
                <li>• Saknade obligatoriska fält</li>
                <li>• Felaktiga samband</li>
                <li>• Ogiltiga koder</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Rimlighetskontroll</h3>
              <p className="text-sm text-blue-700 mb-2">Varning - kontrollera uppgifter</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Orimligt höga belopp</li>
                <li>• Ovanliga kombinationer</li>
                <li>• Avvikande mönster</li>
                <li>• Kan skickas in ändå</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Kontrolltyper</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>
                  <strong>ba_nnn:</strong> Bearbetningskontroller
                </span>
                <span className="text-red-600">Avvisande</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>
                  <strong>S_nnn:</strong> Sambandskontroll inom formulär
                </span>
                <span className="text-yellow-600">Stoppande</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>
                  <strong>B_nnn:</strong> Sambandskontroll mellan formulär
                </span>
                <span className="text-yellow-600">Stoppande</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <span>
                  <strong>R_nnn:</strong> Rimlighetskontroll
                </span>
                <span className="text-blue-600">Varning</span>
              </div>
            </div>
          </div>
        </div>
      </AnimeradFlik>

      {/* Behörigheter */}
      <AnimeradFlik title="Behörigheter och Åtkomst" icon="🔑">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Behörighetsroller</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>
                    <strong>Läsombud:</strong>
                  </span>
                  <span className="text-gray-600">Endast läsning</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    <strong>Registreringsombud:</strong>
                  </span>
                  <span className="text-blue-600">Spara & ändra</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    <strong>Deklarationsombud:</strong>
                  </span>
                  <span className="text-green-600">Full behörighet</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>
                    <strong>Behörig företrädare:</strong>
                  </span>
                  <span className="text-purple-600">Full behörighet</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">Åtkomstmatris</h3>
              <div className="text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Funktion</th>
                      <th className="text-center py-1">Läs</th>
                      <th className="text-center py-1">Reg</th>
                      <th className="text-center py-1">Dekl</th>
                    </tr>
                  </thead>
                  <tbody className="text-blue-700">
                    <tr>
                      <td>Läsa deklarationer</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr>
                      <td>Ladda upp filer</td>
                      <td className="text-center">✗</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr>
                      <td>Ändra uppgifter</td>
                      <td className="text-center">✗</td>
                      <td className="text-center">✓</td>
                      <td className="text-center">✓</td>
                    </tr>
                    <tr>
                      <td>Skicka in</td>
                      <td className="text-center">✗</td>
                      <td className="text-center">✗</td>
                      <td className="text-center">✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Testtjänst</h3>
            <p className="text-sm text-yellow-700">
              Skatteverkets testtjänst kräver <strong>ingen inloggning</strong> eller behörighet.
              Perfekt för att testa XML-filer innan produktion.
            </p>
            <div className="mt-2 text-xs text-yellow-600">
              <p>
                <strong>URL:</strong> Testa arbetsgivardeklaration (Skatteverkets webbplats)
              </p>
            </div>
          </div>
        </div>
      </AnimeradFlik>

      {/* Skattefält */}
      <AnimeradFlik title="Skattefält och Skatteavdrag" icon="💰">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Viktigt om skattefält</h3>
            <p className="text-sm text-red-700 mb-2">
              <strong>Exakt ett (1) skattefält</strong> måste vara ifyllt på varje individuppgift.
            </p>
            <p className="text-xs text-red-600">
              Om inget skatteavdrag gjorts ska noll (0) redovisas i det relevanta beloppsfältet.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Tillgängliga skattefält</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skattefält.map((fält) => (
                <div key={fält.kod} className="bg-gray-50 border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">
                      FK{fält.kod}
                    </span>
                    <span className="font-medium text-sm">{fält.titel}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{fält.beskrivning}</p>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Typ:</span> {fält.typ}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Utländska företag</h3>
            <p className="text-sm text-blue-700">
              Utländska företag <strong>utan fast driftställe i Sverige</strong> ska inte göra
              skatteavdrag och ska därför inte fylla i något av skattefälten.
            </p>
          </div>
        </div>
      </AnimeradFlik>

      {/* Rättelser och borttag */}
      <AnimeradFlik title="Rättelser och Borttag" icon="🔄">
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">Allmänna principer</h3>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Rätta eller ta bort uppgifter så snart du har möjlighet</li>
              <li>• Individuppgifter påverkar andra myndigheter och bidrag</li>
              <li>• Omprövningsbeslut fattas om totala skatter/avgifter ändras</li>
              <li>• Samma identifikatorer krävs för rättelser</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Rätta individuppgift</h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Metod:</strong> Skicka ny uppgift med samma identifikatorer
                </p>
                <div className="bg-white p-2 rounded border text-xs">
                  <p>
                    <strong>Krävs samma:</strong>
                  </p>
                  <ul className="mt-1 space-y-1">
                    <li>• Specifikationsnummer (FK570)</li>
                    <li>• Redovisningsperiod (FK006)</li>
                    <li>• Betalningsmottagare ID</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-600">
                  Den nya uppgiften ersätter automatiskt den gamla.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Ta bort individuppgift</h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>Metod:</strong> Skicka borttagsuppgift
                </p>
                <div className="bg-white p-2 rounded border text-xs">
                  <p>
                    <strong>Fyll endast i:</strong>
                  </p>
                  <ul className="mt-1 space-y-1">
                    <li>• Borttag (FK205)</li>
                    <li>• AgRegistreradId (FK201)</li>
                    <li>• RedovisningsPeriod (FK006)</li>
                    <li>• Specifikationsnummer (FK570)</li>
                    <li>• Betalningsmottagare ID</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Frånvarouppgifter - Viktigt!</h3>
            <div className="text-sm text-red-700 space-y-1">
              <p>
                <strong>Frånvarouppgifter kan INTE ändras efter inlämning!</strong>
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Ingen skyldighet att rätta felaktiga frånvarouppgifter</li>
                <li>• Kan inte komplettera saknade uppgifter</li>
                <li>• Skickas inte in vid senare rättelser</li>
                <li>• Planera noga innan inlämning</li>
              </ul>
            </div>
          </div>
        </div>
      </AnimeradFlik>

      {/* Praktiska tips */}
      <AnimeradFlik title="Praktiska Tips" icon="💡">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Innan implementation</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Testa alltid i testtjänsten först</li>
                <li>• Validera XML-schema lokalt</li>
                <li>• Kontrollera fältkoder mot bilagan</li>
                <li>• Planera behörighetsstrukturen</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Under utveckling</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Implementera alla kontroller lokalt</li>
                <li>• Hantera UTF-8 encoding korrekt</li>
                <li>• Begränsa filstorlek och antal deklarationer</li>
                <li>• Testa med verkliga data</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Support och kontakt</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>
                <strong>Skatteupplysningen:</strong>
              </p>
              <div className="ml-4 space-y-1">
                <p>• Telefon Sverige: 0771-567 567</p>
                <p>• Telefon utland: +46 8 564 851 60</p>
                <p>• E-post: Via kontaktformulär på Skatteverkets webbplats</p>
              </div>
              <p className="mt-2">
                <strong>Utvecklarportal:</strong> För API-implementation
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">Viktigaste deadlines</h3>
            <div className="text-sm text-purple-700 space-y-1">
              <p>
                • <strong>Månadsvis inlämning:</strong> Oftast den 12:e i månaden
              </p>
              <p>
                • <strong>Frånvarouppgifter:</strong> Samma period som påverkad ersättning
              </p>
              <p>
                • <strong>Rättelser:</strong> Så snart som möjligt
              </p>
              <p>
                • <strong>Kontaktuppgifter:</strong> Sparas för kommande perioder
              </p>
            </div>
          </div>
        </div>
      </AnimeradFlik>
    </div>
  );
}

// Data för fältkoder
const frånvaroFält = [
  {
    kod: "820",
    titel: "Borttagsmarkering",
    beskrivning: "Markering för att ta bort en frånvarouppgift från utkast",
  },
  {
    kod: "821",
    titel: "Frånvarodatum",
    beskrivning: "Datum för frånvaron (ÅÅÅÅ-MM-DD)",
  },
  {
    kod: "822",
    titel: "Specifikationsnummer frånvaro",
    beskrivning: "Unikt nummer för frånvarouppgiften",
  },
  {
    kod: "823",
    titel: "Typ av frånvaro",
    beskrivning: "Föräldrapenning eller tillfällig föräldrapenning",
  },
  {
    kod: "824",
    titel: "Frånvaro procent",
    beskrivning: "Omfattning av frånvaro i procent",
  },
  {
    kod: "825",
    titel: "Frånvaro timmar",
    beskrivning: "Omfattning av frånvaro i timmar",
  },
  {
    kod: "826",
    titel: "Frånvaro omfattning typ",
    beskrivning: "Anger om frånvaro redovisas i procent eller timmar",
  },
  {
    kod: "827",
    titel: "Frånvaro kommentar",
    beskrivning: "Fritext för ytterligare information om frånvaron",
  },
];

const skattefält = [
  {
    kod: "001",
    titel: "Avdragen preliminärskatt",
    beskrivning: "Preliminärskatt som dragits av för svensk skattskyldig",
    typ: "Belopp",
  },
  {
    kod: "274",
    titel: "Avdragen skatt SINK",
    beskrivning: "Skatt avdragen för begränsat skattskyldig (SINK)",
    typ: "Belopp",
  },
  {
    kod: "275",
    titel: "Avdragen skatt ASINK",
    beskrivning: "Skatt avdragen för artister och sportutövare (ASINK)",
    typ: "Belopp",
  },
  {
    kod: "114",
    titel: "Skattebefriad enligt avtal",
    beskrivning: "Ersättning befriad från skatteavdrag enligt skatteavtal",
    typ: "Kryssmarkering",
  },
  {
    kod: "276",
    titel: "Ej skatteavdrag/ej beskattning Sverige",
    beskrivning: "Ingen skatteavdragsskyldighet eller beskattning i Sverige",
    typ: "Kryssmarkering",
  },
  {
    kod: "253",
    titel: "Lokalanställd",
    beskrivning: "Lokalanställd vid diplomatisk eller konsulär beskickning",
    typ: "Kryssmarkering",
  },
  {
    kod: "094",
    titel: "Ambassadanställd i Sverige med avtal",
    beskrivning: "Ambassadanställd omfattad av skatteavtal",
    typ: "Kryssmarkering",
  },
];
