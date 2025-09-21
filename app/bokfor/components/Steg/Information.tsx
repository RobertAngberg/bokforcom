"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);
import "react-datepicker/dist/react-datepicker.css";
import { InformationProps } from "../../types/types";
import { useBokforContext } from "../BokforProvider";

export default function Information({
  visaFakturadatum = false,
  fakturadatum,
  setFakturadatum,
}: InformationProps) {
  const { state, actions, handlers } = useBokforContext();
  const { belopp, handleBeloppChange, handleTransaktionsdatumChange, transaktionsdatumDate } =
    handlers.useInformationHelper();

  return (
    <div className="padder">
      <label htmlFor="belopp" className="block mb-2 text-white">
        Belopp:
      </label>
      <input
        className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700 appearance-none 
    [&::-webkit-outer-spin-button]:appearance-none 
    [&::-webkit-inner-spin-button]:appearance-none 
    [&::-moz-inner-spin-button]:appearance-none"
        type="number"
        id="belopp"
        name="belopp"
        required
        min="0"
        max="999999999"
        step="0.01"
        value={belopp || ""}
        onChange={handleBeloppChange}
      />

      {/* Fakturadatum - visas endast om fakturametod är aktiverad */}
      {visaFakturadatum && (
        <>
          <label htmlFor="fakturadatum" className="block mb-2 text-white">
            Fakturadatum (ÅÅÅÅ-MM-DD):
          </label>
          <DatePicker
            className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
            id="fakturadatum"
            selected={fakturadatum ? new Date(fakturadatum) : new Date()}
            onChange={(date) => {
              if (setFakturadatum) {
                setFakturadatum(date ? date.toISOString() : "");
              }
            }}
            dateFormat="yyyy-MM-dd"
            locale="sv"
            required
          />
        </>
      )}

      <label htmlFor="datum" className="block mb-2 text-white">
        Betaldatum (ÅÅÅÅ-MM-DD):
      </label>
      <DatePicker
        className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
        id="datum"
        selected={transaktionsdatumDate}
        onChange={handleTransaktionsdatumChange}
        dateFormat="yyyy-MM-dd"
        locale="sv"
        required
      />
    </div>
  );
}
