import React from "react";

export default function SkatteInfo({ anställd }: any) {
  return (
    <div className="border border-gray-400 rounded p-3">
      <h4 className="font-bold mb-2 text-black text-sm">Skatt beräknad på</h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="font-semibold text-black">Skattetabell</div>
          <div className="text-sm font-bold text-black">{anställd?.skattetabell}</div>
        </div>
        <div>
          <div className="font-semibold text-black">Skattekolumn</div>
          <div className="text-sm font-bold text-black">{anställd?.skattekolumn}</div>
        </div>
      </div>
    </div>
  );
}
