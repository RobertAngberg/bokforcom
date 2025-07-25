import Dropdown from "../_components/Dropdown";

export interface Anstalld {
  id: number;
  förnamn: string;
  efternamn: string;
}

interface Props {
  anstallda: Anstalld[];
  value: string;
  onChange: (id: string) => void;
}

export default function AnstalldDropdown({ anstallda, value, onChange }: Props) {
  const options = anstallda.map((a) => ({
    label: `${a.förnamn} ${a.efternamn}`,
    value: a.id.toString(),
  }));

  return <Dropdown value={value} options={options} onChange={onChange} placeholder="Välj..." />;
}
