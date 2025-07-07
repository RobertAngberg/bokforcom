import Rad from "./Rad";
import DropdownRad from "./DropdownRad";
import { staticRows, dropdownRaderData } from "./extraraderData";
import { filtreraRader } from "./extraraderUtils";

interface Props {
  sökterm: string;
  state: Record<string, boolean>;
  open: Record<string, boolean>;
  toggleDropdown: (key: string) => void;
  toggleCheckbox: (id: string, label: string) => void;
  onRemoveRow?: (id: string) => void;
}

export default function ExtraraderGrid({
  sökterm,
  state,
  open,
  toggleDropdown,
  toggleCheckbox,
  onRemoveRow,
}: Props) {
  const filtreradeStaticRows = filtreraRader(staticRows, sökterm);

  const mittenRows = filtreradeStaticRows.slice(0, Math.ceil(filtreradeStaticRows.length / 2));
  const hogerRows = filtreradeStaticRows.slice(Math.ceil(filtreradeStaticRows.length / 2));

  const dropdownRader = {
    sjukfranvaro: filtreraRader(dropdownRaderData.sjukfranvaro, sökterm),
    skattadeFormaner: filtreraRader(dropdownRaderData.skattadeFormaner, sökterm),
    skattefrittTraktamente: filtreraRader(dropdownRaderData.skattefrittTraktamente, sökterm),
    bilersattning: filtreraRader(dropdownRaderData.bilersattning, sökterm),
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          {(!sökterm || dropdownRader.sjukfranvaro.length > 0) && (
            <>
              <DropdownRad
                label="Sjukfrånvaro"
                open={open.sjukfranvaro}
                toggle={() => toggleDropdown("sjukfranvaro")}
              />
              {open.sjukfranvaro && (
                <div className="ml-6 space-y-1">
                  {dropdownRader.sjukfranvaro
                    .sort((a: { label: string }, b: { label: string }) =>
                      a.label.localeCompare(b.label, "sv")
                    )
                    .map((item: { id: string; label: string }) => (
                      <Rad
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        checked={state[item.id]}
                        toggle={() => toggleCheckbox(item.id, item.label)}
                        onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {(!sökterm || dropdownRader.skattadeFormaner.length > 0) && (
            <>
              <DropdownRad
                label="Skattade förmåner"
                open={open.skattadeFormaner}
                toggle={() => toggleDropdown("skattadeFormaner")}
              />
              {open.skattadeFormaner && (
                <div className="ml-6 space-y-1">
                  {dropdownRader.skattadeFormaner
                    .sort((a: { label: string }, b: { label: string }) =>
                      a.label.localeCompare(b.label, "sv")
                    )
                    .map((item: { id: string; label: string }) => (
                      <Rad
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        checked={state[item.id]}
                        toggle={() => toggleCheckbox(item.id, item.label)}
                        onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {(!sökterm || dropdownRader.skattefrittTraktamente.length > 0) && (
            <>
              <DropdownRad
                label="Skattefritt traktamente"
                open={open.skattefrittTraktamente}
                toggle={() => toggleDropdown("skattefrittTraktamente")}
              />
              {open.skattefrittTraktamente && (
                <div className="ml-6 space-y-1">
                  {dropdownRader.skattefrittTraktamente
                    .sort((a: { label: string }, b: { label: string }) =>
                      a.label.localeCompare(b.label, "sv")
                    )
                    .map((item: { id: string; label: string }) => (
                      <Rad
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        checked={state[item.id]}
                        toggle={() => toggleCheckbox(item.id, item.label)}
                        onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {(!sökterm || dropdownRader.bilersattning.length > 0) && (
            <>
              <DropdownRad
                label="Bilersättning"
                open={open.bilersattning}
                toggle={() => toggleDropdown("bilersattning")}
              />
              {open.bilersattning && (
                <div className="ml-6 space-y-1">
                  {dropdownRader.bilersattning
                    .sort((a: { label: string }, b: { label: string }) =>
                      a.label.localeCompare(b.label, "sv")
                    )
                    .map((item: { id: string; label: string }) => (
                      <Rad
                        key={item.id}
                        id={item.id}
                        label={item.label}
                        checked={state[item.id]}
                        toggle={() => toggleCheckbox(item.id, item.label)}
                        onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-1">
          {mittenRows.map((item: { id: string; label: string }) => (
            <Rad
              key={item.id}
              id={item.id}
              label={item.label}
              checked={state[item.id]}
              toggle={() => toggleCheckbox(item.id, item.label)}
              onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
            />
          ))}
        </div>

        <div className="space-y-1">
          {hogerRows.map((item: { id: string; label: string }) => (
            <Rad
              key={item.id}
              id={item.id}
              label={item.label}
              checked={state[item.id]}
              toggle={() => toggleCheckbox(item.id, item.label)}
              onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
            />
          ))}
        </div>
      </div>
      {sökterm &&
        filtreradeStaticRows.length === 0 &&
        Object.values(dropdownRader).every((arr) => arr.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            <p>Inga extrarader hittades för &ldquo;{sökterm}&rdquo;</p>
            <p className="text-sm mt-2">
              Prova med andra sökord som &ldquo;lön&rdquo;, &ldquo;tillägg&rdquo;,
              &ldquo;avdrag&rdquo;
            </p>
          </div>
        )}
    </>
  );
}
