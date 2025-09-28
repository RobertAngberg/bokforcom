"use client";

import React from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);
import "react-datepicker/dist/react-datepicker.css";
import { InformationProps } from "../../types/types";
import { useBokforContext } from "../BokforProvider";
import TextFalt from "../../../_components/TextFalt";

export default function Information({
  visaFakturadatum = false,
  fakturadatum,
  setFakturadatum,
}: InformationProps) {
  const { handlers } = useBokforContext();
  const { belopp, handleBeloppChange, handleTransaktionsdatumChange, transaktionsdatumDate } =
    handlers.useInformationHelper();

  return (
    <div className="padder">
      <TextFalt
        label="Belopp"
        name="belopp"
        type="number"
        value={belopp || ""}
        onChange={handleBeloppChange}
        placeholder="0.00"
        className="w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700"
        maxLength={12}
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
