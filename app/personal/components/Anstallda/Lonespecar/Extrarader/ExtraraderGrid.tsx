import ExtraradRadOchDropdown from "./ExtraradRadOchDropdown";
import { staticRows, dropdownRaderData } from "../../../../utils/extraraderData";
import { filtreraRader } from "../../../../utils/extraraderUtils";

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

  function DropdownSection({
    label,
    open,
    toggleDropdown,
    rows,
    state,
    toggleCheckbox,
    onRemoveRow,
  }: {
    label: string;
    open: boolean;
    toggleDropdown: () => void;
    rows: { id: string; label: string }[];
    state: Record<string, boolean>;
    toggleCheckbox: (id: string, label: string) => void;
    onRemoveRow?: (id: string) => void;
  }) {
    return (
      <>
        <ExtraradRadOchDropdown
          label={label}
          isDropdown
          open={open}
          onToggleDropdown={toggleDropdown}
          toggle={() => {}}
        />
        {open && (
          <div className="ml-6 space-y-1">
            {rows
              .sort((a, b) => a.label.localeCompare(b.label, "sv"))
              .map((item) => (
                <ExtraradRadOchDropdown
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
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Första kolumnen: dropdown-sektioner */}
        <div className="space-y-1">
          {[
            {
              key: "sjukfranvaro",
              label: "Sjukfrånvaro",
              rows: dropdownRader.sjukfranvaro,
            },
            {
              key: "skattadeFormaner",
              label: "Skattade förmåner",
              rows: dropdownRader.skattadeFormaner,
            },
            {
              key: "skattefrittTraktamente",
              label: "Skattefritt traktamente",
              rows: dropdownRader.skattefrittTraktamente,
            },
            {
              key: "bilersattning",
              label: "Bilersättning",
              rows: dropdownRader.bilersattning,
            },
          ].map(({ key, label, rows }) =>
            !sökterm || rows.length > 0 ? (
              <DropdownSection
                key={key}
                label={label}
                open={open[key]}
                toggleDropdown={() => toggleDropdown(key)}
                rows={rows}
                state={state}
                toggleCheckbox={toggleCheckbox}
                onRemoveRow={onRemoveRow}
              />
            ) : null
          )}
        </div>
        {/* Andra kolumnen: mittenRows */}
        <div className="space-y-1">
          {mittenRows.map((item: { id: string; label: string }) => (
            <ExtraradRadOchDropdown
              key={item.id}
              id={item.id}
              label={item.label}
              checked={state[item.id]}
              toggle={() => toggleCheckbox(item.id, item.label)}
              onRemove={onRemoveRow ? () => onRemoveRow(item.id) : undefined}
            />
          ))}
        </div>
        {/* Tredje kolumnen: hogerRows */}
        <div className="space-y-1">
          {hogerRows.map((item: { id: string; label: string }) => (
            <ExtraradRadOchDropdown
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
