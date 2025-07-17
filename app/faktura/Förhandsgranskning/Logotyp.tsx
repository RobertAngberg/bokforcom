import Image from "next/image";

interface LogotypProps {
  logo?: string;
  logoSize?: number;
  logoSliderValue?: number;
  setLogoSliderValue?: (value: number) => void;
  showSlider?: boolean;
}

export default function Logotyp({
  logo,
  logoSize = 200,
  logoSliderValue = 50,
  setLogoSliderValue,
  showSlider = true,
}: LogotypProps) {
  if (!logo) return null;

  return (
    <div className="absolute top-10 right-10 group flex flex-col items-end">
      <div
        style={{
          maxWidth: `${logoSize}px`,
          maxHeight: "200px",
        }}
      >
        <Image
          src={logo}
          alt="Logotyp"
          width={logoSize}
          height={200}
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            maxHeight: "200px",
          }}
          className="transition-all"
          unoptimized // Om du laddar base64/data-URL eller extern länk
        />
      </div>
      {showSlider && setLogoSliderValue && (
        <input
          type="range"
          min={0}
          max={100}
          value={logoSliderValue}
          onChange={(e) => setLogoSliderValue(Number(e.target.value))}
          className="mt-2 w-32 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );
}
