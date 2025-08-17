import React from "react";
import TextFalt from "../_components/TextFalt";

interface CommentProps {
  kommentar: string;
  setKommentar: (value: string) => void;
}

export default function Kommentar({ kommentar, setKommentar }: CommentProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setKommentar(e.target.value);
  };

  return (
    <TextFalt
      label="Kommentar:"
      name="kommentar"
      type="textarea"
      value={kommentar}
      onChange={handleChange}
      required={false}
      placeholder="Valfritt"
      maxLength={500}
    />
  );
}

export { Kommentar };
