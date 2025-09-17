"use client";

import AnställdaRad from "./AnstalldaRad";
import { useAnstallda } from "../_hooks/useAnstallda";

export default function AnställdaLista() {
  const { state } = useAnstallda();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th className="text-left text-gray-400">Namn</th>
            <th className="text-left text-gray-400">E-post</th>
            <th className="text-left text-gray-400">Roll</th>
            <th className="text-left text-gray-400"></th>
          </tr>
        </thead>
        <tbody>
          {state.anställda.map((anställd) => (
            <AnställdaRad key={anställd.id} anställd={anställd} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
