"use client";

import { useEffect } from "react";
import React from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
registerLocale("sv", sv);
import "react-datepicker/dist/react-datepicker.css";
import { InformationProps } from "./_types/types";

export default function Information({
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  visaFakturadatum = false,
  fakturadatum,
  setFakturadatum,
}: InformationProps) {
  // Säker beloppvalidering
  const handleBeloppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = Number(value);

    // Begränsa till rimliga värden
    if (isNaN(numValue) || numValue < 0 || numValue > 999999999) {
      return; // Ignorera ogiltiga värden
    }

    setBelopp(numValue);
  };

  // Datepicker
  useEffect(() => {
    const datePickerEl = document.querySelector(".react-datepicker-wrapper");
    if (datePickerEl) {
      (datePickerEl as HTMLElement).style.width = "100%";
    }

    const inputEl = document.querySelector(".react-datepicker__input-container input");
    if (inputEl) {
      (inputEl as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    }

    if (!transaktionsdatum) {
      // Default dagens datum
      setTransaktionsdatum(new Date().toISOString());
    }
  }, [transaktionsdatum, setTransaktionsdatum]);

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
        value={belopp}
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
        selected={transaktionsdatum ? new Date(transaktionsdatum) : new Date()}
        onChange={(date) => {
          setTransaktionsdatum(date ? date.toISOString() : "");
        }}
        dateFormat="yyyy-MM-dd"
        locale="sv"
        required
      />
    </div>
  );
}
