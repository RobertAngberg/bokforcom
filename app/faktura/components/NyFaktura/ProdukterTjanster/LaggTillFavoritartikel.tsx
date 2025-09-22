import type { LäggTillFavoritartikelProps } from "../../../types/types";

export default function LäggTillFavoritartikel({
  checked,
  onChange,
  className = "w-6 h-6",
  labelClassName = "text-base text-white cursor-pointer",
}: LäggTillFavoritartikelProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="saveAsFavorite"
        checked={checked}
        onChange={() => onChange(!checked)}
        className={className}
      />
      <label htmlFor="saveAsFavorite" className={labelClassName}>
        Lägg till som favoritartikel 📌
      </label>
    </div>
  );
}
