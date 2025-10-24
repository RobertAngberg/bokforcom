"use client";

import LönespecView from "../../Anstallda/Lonespecar/SpecVy/LonespecView";
import Wizard from "../Wizard/Wizard";
import { LonespecListaProps } from "../../../types/types";
import { useLonekorning } from "../../../hooks/useLonekorning";
import { useWizard } from "../../../hooks/useWizard";
import { markeraStegFardigt } from "../../../actions/lonekorningActions";

export default function LonespecLista({
  valdaSpecar,
  anstallda,
  utlaggMap,
  lönekörning,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
  onLönekörningUppdaterad,
  onSpecLocalUpdate,
}: LonespecListaProps) {
  // Behåll bara logiken för att ta bort lönespecar från gamla hooken
  const {
    specListTaBortLaddning: taBortLaddning,
    specListHandleTaBortLönespec: handleTaBortLönespec,
  } = useLonekorning({
    enableSpecListMode: true,
    specListValdaSpecar: valdaSpecar,
    specListLönekörning: lönekörning,
    onSpecListTaBortSpec: onTaBortSpec,
    onSpecListHämtaBankgiro: onHämtaBankgiro,
  });

  // Använd nya wizard-hooken
  const wizard = useWizard({
    lönekörning: lönekörning || null,
    onMaila: onMailaSpecar,
    onBokför,
    onGenereraAGI,
    onBokförSkatter,
  });

  // Hantera "Markera färdig"-klick
  const handleMarkeraFärdig = async (lönekörningId: number) => {
    try {
      const result = await markeraStegFardigt(lönekörningId);
      if (!result.success) {
        console.error("Kunde inte markera steg som färdigt:", result.error);
      } else if (result.data && onLönekörningUppdaterad) {
        // Uppdatera parent component med ny data
        onLönekörningUppdaterad(result.data);
      }
    } catch (error) {
      console.error("Fel vid markering av steg som färdigt:", error);
    }
  };

  if (valdaSpecar.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Lönespecar */}
      <>
        {valdaSpecar.map((spec) => {
          // Konvertera alltid till nummer för säker jämförelse
          const anställdId = Number(spec.anställd_id);

          // Försök hitta i anstallda-listan först
          let anstalld = anstallda.find((a) => a.id === anställdId);

          // Om inte hittad, skapa från lönespec-data (JOINad från databasen)
          if (!anstalld && spec.förnamn && spec.efternamn) {
            anstalld = {
              id: anställdId,
              namn: `${spec.förnamn} ${spec.efternamn}`.trim(),
              förnamn: spec.förnamn,
              efternamn: spec.efternamn,
              mail: spec.mail || spec.epost || "",
              epost: spec.mail || spec.epost || "",
            };
          }

          const utlagg = anstalld ? utlaggMap[anstalld.id] || [] : [];

          return (
            <LönespecView
              key={spec.id}
              lönespec={spec}
              anställd={anstalld}
              utlägg={utlagg}
              ingenAnimering={false}
              taBortLoading={taBortLaddning[Number(spec.id)] || false}
              visaExtraRader={true}
              onLönespecDataChange={onSpecLocalUpdate}
              onTaBortLönespec={() => {
                // Convert Lönespec to LönespecData format
                const specData = {
                  ...spec,
                  id: Number(spec.id),
                  anställd_id: Number(spec.anställd_id || 0),
                  grundlön: Number(spec.grundlön || 0),
                  skatt: Number(spec.skatt || 0),
                };
                handleTaBortLönespec(specData);
              }}
            />
          );
        })}
      </>

      {/* Extra spacing */}
      <div className="h-4"></div>

      {/* Wizard */}
      <Wizard
        steps={wizard.steps}
        lönekörningId={lönekörning?.id}
        onMarkeraFärdig={handleMarkeraFärdig}
      />
    </div>
  );
}
