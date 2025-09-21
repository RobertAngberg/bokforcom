import Dropdown from "../../_components/Dropdown";
import { AnstalldDropdownProps } from "../_types/types";

export default function AnstalldDropdown({ anstallda, value, onChange }: AnstalldDropdownProps) {
  const options = anstallda.map((a) => ({
    label: `${a.förnamn} ${a.efternamn}`,
    value: a.id.toString(),
  }));

  return <Dropdown value={value} options={options} onChange={onChange} placeholder="Välj..." />;
}
