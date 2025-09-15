import React from "react";
import TextFalt from "../../../_components/TextFalt";
import { CommentProps } from "../../_types/types";
import { useKommentar } from "../../_hooks/useKommentar";

export default function Kommentar({
  kommentar: propsKommentar,
  setKommentar: propsSetKommentar,
}: CommentProps = {}) {
  // Använd hooken med optional props
  const { kommentar, handleChange } = useKommentar({
    kommentar: propsKommentar,
    setKommentar: propsSetKommentar,
  });

  return (
    <TextFalt
      label="Kommentar:"
      name="kommentar"
      type="textarea"
      value={kommentar || ""}
      onChange={handleChange}
      required={false}
      placeholder="Valfritt"
      maxLength={500}
    />
  );
}

export { Kommentar };
