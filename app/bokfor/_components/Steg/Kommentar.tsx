import React from "react";
import TextFalt from "../../../_components/TextFalt";
import { CommentProps } from "../../_types/types";
import { useBokforContext } from "../BokforProvider";

export default function Kommentar({
  kommentar: propsKommentar,
  setKommentar: propsSetKommentar,
}: CommentProps = {}) {
  // Använd hooken med optional props
  const { state, actions, handlers } = useBokforContext();
  const { kommentar, handleChange } = handlers.useKommentarHelper({
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
