"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Knapp from "../../../../_components/Knapp";
import TextFalt from "../../../../_components/TextFalt";
import Dropdown from "../../../../_components/Dropdown";
import { dateToYyyyMmDd } from "../../../../_utils/datum";
import { useAnstallda } from "../../../hooks/useAnstallda";
import type { NyAnstalldProps } from "../../../types/types";

export default function NyAnställd({ handlers }: NyAnstalldProps) {
  const { döljNyAnställd: stängNyAnställd, hanteraNyAnställdSparad } = handlers;
  const {
    state: { nyAnställdFormulär },
    handlers: { updateNyAnställdFormulär, handleSanitizedChange, avbrytNyAnställd },
    form,
  } = useAnstallda({
    enableNyAnstalldMode: true,
    onNyAnstalldSaved: hanteraNyAnställdSparad,
    onNyAnstalldCancel: stängNyAnställd,
  });

  // Extract form actions safely
  const formAction = typeof form.formAction === "function" ? form.formAction : undefined;
  const isPending = typeof form.isPending === "boolean" ? form.isPending : false;

  return (
    <div className="space-y-8 px-2 md:px-4 lg:px-6">
      {/* React 19 Form med action */}
      <form action={formAction} className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl text-white mt-10">Personalinformation</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TextFalt
              label="Förnamn"
              name="förnamn"
              value={nyAnställdFormulär.förnamn || ""}
              onChange={handleSanitizedChange}
            />

            <TextFalt
              label="Efternamn"
              name="efternamn"
              value={nyAnställdFormulär.efternamn || ""}
              onChange={handleSanitizedChange}
            />

            <TextFalt
              label="Personnummer"
              name="personnummer"
              type="number"
              value={nyAnställdFormulär.personnummer || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Jobbtitel"
              name="jobbtitel"
              value={nyAnställdFormulär.jobbtitel || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Clearingnummer"
              name="clearingnummer"
              value={nyAnställdFormulär.clearingnummer || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Bankkonto"
              name="bankkonto"
              value={nyAnställdFormulär.bankkonto || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Mail"
              name="mail"
              type="email"
              value={nyAnställdFormulär.mail || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Adress"
              name="adress"
              value={nyAnställdFormulär.adress || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Postnummer"
              name="postnummer"
              value={nyAnställdFormulär.postnummer || ""}
              onChange={handleSanitizedChange}
              required={false}
            />

            <TextFalt
              label="Ort"
              name="ort"
              value={nyAnställdFormulär.ort || ""}
              onChange={handleSanitizedChange}
              required={false}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl text-white">Kompensation</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Startdatum</label>
              <DatePicker
                selected={nyAnställdFormulär.startdatum}
                onChange={(date) => updateNyAnställdFormulär({ startdatum: date || undefined })}
                dateFormat="yyyy-MM-dd"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:ring-cyan-500"
              />
              {/* Hidden input för FormData */}
              <input
                type="hidden"
                name="startdatum"
                value={
                  nyAnställdFormulär.startdatum ? dateToYyyyMmDd(nyAnställdFormulär.startdatum) : ""
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Förnya kontrakt</label>
              <DatePicker
                selected={nyAnställdFormulär.slutdatum}
                onChange={(date) => {
                  updateNyAnställdFormulär({ slutdatum: date || undefined });
                }}
                className="w-full rounded border border-gray-700 bg-slate-900 p-2 text-white focus:border-cyan-600 focus:outline-none"
                locale="sv"
                dateFormat="yyyy-MM-dd"
              />
              {/* Hidden input för FormData */}
              <input
                type="hidden"
                name="slutdatum"
                value={
                  nyAnställdFormulär.slutdatum ? dateToYyyyMmDd(nyAnställdFormulär.slutdatum) : ""
                }
              />
            </div>

            <Dropdown
              label="Anställningstyp"
              name="anställningstyp"
              value={nyAnställdFormulär.anställningstyp}
              onChange={(value) => updateNyAnställdFormulär({ anställningstyp: value })}
              options={[
                { value: "", label: "Välj anställningstyp" },
                { value: "Tillsvidare", label: "Tillsvidare" },
                { value: "Visstid", label: "Visstid" },
                { value: "Provanställning", label: "Provanställning" },
                { value: "Säsongsanställning", label: "Säsongsanställning" },
                { value: "Månadslön", label: "Månadslön" },
              ]}
            />

            <Dropdown
              label="Löneperiod"
              name="löneperiod"
              value={nyAnställdFormulär.löneperiod}
              onChange={(value) => updateNyAnställdFormulär({ löneperiod: value })}
              options={[
                { value: "", label: "Välj löneperiod" },
                { value: "Månadsvis", label: "Månadsvis" },
                { value: "Veckovis", label: "Veckovis" },
                { value: "14 dagar", label: "14 dagar" },
              ]}
            />

            <Dropdown
              label="Ersättning per"
              name="ersättningPer"
              value={nyAnställdFormulär.ersättningPer}
              onChange={(value) => updateNyAnställdFormulär({ ersättningPer: value })}
              options={[
                { value: "", label: "Välj period" },
                { value: "Månad", label: "Månad" },
                { value: "Timme", label: "Timme" },
                { value: "Dag", label: "Dag" },
                { value: "Vecka", label: "Vecka" },
                { value: "År", label: "År" },
              ]}
            />

            <TextFalt
              label="Kompensation (kr)"
              name="kompensation"
              type="number"
              value={nyAnställdFormulär.kompensation}
              onChange={(e) => updateNyAnställdFormulär({ kompensation: e.target.value })}
              required={false}
            />

            <TextFalt
              label="Arbetsvecka (timmar)"
              name="arbetsvecka"
              type="number"
              value={nyAnställdFormulär.arbetsvecka}
              onChange={(e) => updateNyAnställdFormulär({ arbetsvecka: e.target.value })}
              required={false}
            />

            <Dropdown
              label="Arbetsbelastning"
              name="arbetsbelastning"
              value={nyAnställdFormulär.arbetsbelastning}
              onChange={(value) => updateNyAnställdFormulär({ arbetsbelastning: value })}
              options={[
                { value: "", label: "Välj arbetsbelastning" },
                { value: "Heltid", label: "Heltid" },
                { value: "Deltid", label: "Deltid" },
              ]}
            />

            {nyAnställdFormulär.arbetsbelastning === "Deltid" && (
              <TextFalt
                label="Deltid (%)"
                name="deltidProcent"
                type="number"
                value={nyAnställdFormulär.deltidProcent}
                onChange={(e) => updateNyAnställdFormulär({ deltidProcent: e.target.value })}
                required={false}
              />
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl text-white">Tjänsteställe</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TextFalt
              label="Tjänsteställe adress"
              name="tjänsteställeAdress"
              value={nyAnställdFormulär.tjänsteställeAdress || ""}
              onChange={(e) =>
                updateNyAnställdFormulär({
                  tjänsteställeAdress: e.target.value,
                })
              }
              required={false}
            />

            <TextFalt
              label="Tjänsteställe ort"
              name="tjänsteställeOrt"
              value={nyAnställdFormulär.tjänsteställeOrt || ""}
              onChange={(e) =>
                updateNyAnställdFormulär({
                  tjänsteställeOrt: e.target.value,
                })
              }
              required={false}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl text-white">Skatt</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Dropdown
              label="Skattetabell"
              name="skattetabell"
              value={nyAnställdFormulär.skattetabell || ""}
              onChange={(value) => updateNyAnställdFormulär({ skattetabell: value })}
              options={[
                { value: "", label: "Välj skattetabell" },
                ...Array.from({ length: 14 }, (_, i) => {
                  const table = (29 + i).toString();
                  return { value: table, label: `Tabell ${table}` };
                }),
              ]}
            />

            <Dropdown
              label="Skattekolumn"
              name="skattekolumn"
              value={nyAnställdFormulär.skattekolumn || ""}
              onChange={(value) => updateNyAnställdFormulär({ skattekolumn: value })}
              options={[
                { value: "", label: "Välj skattekolumn" },
                ...Array.from({ length: 6 }, (_, i) => {
                  const column = (1 + i).toString();
                  return { value: column, label: `Kolumn ${column}` };
                }),
              ]}
            />
          </div>
        </section>

        <div className="flex gap-4 pt-4">
          <Knapp
            text={isPending ? "💾 Sparar..." : "💾 Spara"}
            type="submit"
            disabled={isPending}
          />
          <Knapp text="❌ Avbryt" onClick={avbrytNyAnställd} />
        </div>
      </form>
    </div>
  );
}
