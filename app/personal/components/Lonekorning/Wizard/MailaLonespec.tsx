import { useMailaLonespec } from "../../../hooks/useMailaLonespec";
import Forhandsgranskning from "../../Anstallda/Lonespecar/Forhandsgranskning/Forhandsgranskning";
import Knapp from "../../../../_components/Knapp";
import type { MailaLonespecProps } from "../../../types/types";

export default function MailaLonespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader = [],
  beräknadeVärden = {},
  open,
  onClose,
  onMailComplete,
}: MailaLonespecProps) {
  const { loading, sent, handleMaila } = useMailaLonespec({
    lönespec,
    anställd,
    företagsprofil,
    extrarader,
    beräknadeVärden,
    onMailComplete,
    onClose,
    ForhandsgranskningComponent: Forhandsgranskning,
    open,
  });

  return (
    <Knapp
      text={loading ? "⏳ Skickar..." : sent ? "✅ Skickad!" : "✉️ Maila lönespec"}
      onClick={handleMaila}
      disabled={loading || sent}
    />
  );
}
