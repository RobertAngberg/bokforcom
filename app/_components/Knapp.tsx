type KnappProps = {
  text: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
};

export default function Knapp({
  text,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  loadingText,
}: KnappProps) {
  const isDisabled = disabled || loading;
  const displayText = loading ? loadingText || "⏳ Laddar..." : text;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`h-10 px-4 rounded transition text-white ${
        isDisabled ? "bg-cyan-700/40 cursor-not-allowed" : "bg-cyan-700 hover:bg-cyan-800"
      }`}
    >
      {displayText}
    </button>
  );
}
