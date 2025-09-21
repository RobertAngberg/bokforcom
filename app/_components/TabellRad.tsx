//#region Huvud
"use client";

export interface ColumnDefinition<T> {
  key: keyof T | string;
  label?: string;
  render?: (value: any, row: T) => React.ReactNode;
  hiddenOnMobile?: boolean;
  className?: string;
}

interface TableRowProps<T> {
  item: T;
  columns: ColumnDefinition<T>[];
  onClick?: (item: T) => void;
  isActive?: boolean;
  rowIndex: number;
}
//#endregion

export default function TabellRad<T>({
  item,
  columns,
  onClick,
  isActive,
  rowIndex,
}: TableRowProps<T>) {
  const rowColorClass = rowIndex % 2 === 0 ? "bg-gray-950" : "bg-gray-900";
  const activeClass = isActive ? "bg-gray-800" : "";
  const clickableClass = onClick ? "cursor-pointer hover:bg-gray-700" : "";

  return (
    <tr
      onClick={onClick ? () => onClick(item) : undefined}
      className={`transition-colors duration-200 ${rowColorClass} ${activeClass} ${clickableClass}`}
    >
      {columns.map((col, colIndex) => {
        const rawValue = (item as any)[col.key];
        const renderedValue = col.render
          ? col.render(rawValue, item)
          : (rawValue as React.ReactNode);

        const paddingClass = colIndex === 0 ? "pl-6 pr-6 py-3" : "px-6 py-3";

        return (
          <td
            key={String(col.key)}
            className={`${paddingClass} ${col.className || "text-left"} ${
              col.hiddenOnMobile ? "hidden md:table-cell" : ""
            }`}
          >
            {renderedValue}
          </td>
        );
      })}
    </tr>
  );
}
