import React from "react";

interface CommentProps {
  kommentar: string;
  setKommentar: (value: string) => void;
}

export default function Kommentar({ kommentar, setKommentar }: CommentProps) {
  return (
    <div className="mb-4">
      <label htmlFor="kommentar" className="text-white block mb-2">
        Kommentar:
      </label>
      <textarea
        className="w-full p-2 mb-0 text-white bg-slate-900 border-2 border-gray-700 rounded"
        id="kommentar"
        name="kommentar"
        maxLength={500}
        placeholder="Valfritt"
        rows={1}
        value={kommentar}
        onChange={(e) => setKommentar(e.target.value)}
      />
    </div>
  );
}

export { Kommentar };
