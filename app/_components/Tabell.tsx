//#region Huvud
"use client";

import React from "react";
import TabellRad, { ColumnDefinition } from "./TabellRad";
export type { ColumnDefinition } from "./TabellRad";

export interface TableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  getRowId: (item: T) => string | number;
  activeId?: string | number | null;
  activeIds?: (string | number)[];
  handleRowClick?: (id: string | number) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
  isRowClickable?: (item: T) => boolean; // 🆕 Valfritt per rad
}
//#endregion

export default function Tabell<T>({
  data,
  columns,
  getRowId,
  activeId,
  activeIds,
  handleRowClick,
  renderExpandedRow,
  isRowClickable,
}: TableProps<T>) {
  return (
    <div className="max-w-5xl mx-auto overflow-x-auto border border-slate-700 rounded-lg shadow">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-800 text-left">
          <tr>
            {columns.map((col, colIndex) => {
              const paddingClass = colIndex === 0 ? "pl-6 pr-6 py-3" : "px-6 py-3";
              return (
                <th
                  key={String(col.key)}
                  className={`${paddingClass} ${col.className || "text-left"} ${col.hiddenOnMobile ? "hidden md:table-cell" : ""}`}
                >
                  {col.label ?? String(col.key)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const id = getRowId(item);
            // Stöd både activeId (single) och activeIds (multiple)
            const isExpanded = activeIds ? activeIds.includes(id) : activeId === id;

            // 💡 Är raden klickbar? Endast om både prop och funktion finns
            const isClickable = handleRowClick && (isRowClickable?.(item) ?? true);
            const onClick = isClickable ? () => handleRowClick(id) : undefined;

            return (
              <React.Fragment key={id}>
                <TabellRad
                  item={item}
                  columns={columns}
                  onClick={onClick}
                  isActive={isExpanded}
                  rowIndex={index}
                />
                {isExpanded && renderExpandedRow?.(item)}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
