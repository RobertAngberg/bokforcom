import React from "react";
import TextFalt from "../../../_components/TextFalt";
import { CommentProps } from "../../_types/types";
import { useBokforStore } from "../../_stores/bokforStore";

export default function Kommentar({}: CommentProps) {
  // Hämta från Zustand store istället för props
  const { kommentar, setKommentar } = useBokforStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setKommentar(e.target.value);
  };

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
