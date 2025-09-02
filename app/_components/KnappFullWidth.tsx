// Backwards compatibility - re-export Knapp with fullWidth=true
import Knapp from "./Knapp";

type KnappFullWidthProps = {
  text: string;
  pendingText?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export default function KnappFullWidth(props: KnappFullWidthProps) {
  return <Knapp {...props} fullWidth={true} />;
}
