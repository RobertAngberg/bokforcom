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
  className = "",
}: KnappProps & { className?: string }) {
  const isDisabled = disabled || loading;
  const displayText = loading ? loadingText || "⏳ Laddar..." : text;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-2 rounded font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {displayText}
    </button>
  );
}
