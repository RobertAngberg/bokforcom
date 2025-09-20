"use client";

import Knapp from "../../../../_components/Knapp";
import type { AnställdaRadProps } from "../../../types/types";

interface AnställdaRadPropsWithHandlers extends AnställdaRadProps {
  handlers: any;
}

export default function AnställdaRad({ anställd, handlers }: AnställdaRadPropsWithHandlers) {
  return (
    <tr
      className="border-b border-slate-600 hover:bg-slate-800 cursor-pointer"
      onClick={() => handlers.hanteraAnställdKlick(anställd.id)}
    >
      <td className="py-2 px-2 text-2xl w-10" title="Anställd">
        👤
      </td>
      <td className="py-2 px-2">{anställd.namn}</td>
      <td className="py-2 px-2">{anställd.epost}</td>
      <td className="py-2 px-2">{anställd.roll ?? ""}</td>
      <td className="py-2 px-2 flex gap-2 justify-end">
        <Knapp
          text="❌ Ta bort"
          onClick={() => handlers.taBortAnställdFrånLista(anställd.id)}
          type="button"
        />
      </td>
    </tr>
  );
}
