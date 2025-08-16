// Tillåtna input-typer för säkerhet
type AllowedInputTypes =
  | "text"
  | "number"
  | "email"
  | "password"
  | "date"
  | "datetime-local"
  | "tel"
  | "url"
  | "textarea";

type TextFaltProps = {
  label: string;
  name: string;
  type?: AllowedInputTypes;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number; // Begränsa längd för säkerhet
  pattern?: string; // RegEx validation
};

export default function TextFalt({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = true,
  placeholder,
  disabled = false,
  maxLength,
  pattern,
}: TextFaltProps) {
  // Säker escaping av label för XSS-skydd
  const safeLabel = String(label).replace(/[<>'"]/g, "");

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-white mb-2">
        {safeLabel}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white mb-4 h-24 resize-y placeholder-slate-400 focus:border-blue-500 focus:outline-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          className={`w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white mb-4 placeholder-slate-400 focus:border-blue-500 focus:outline-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      )}
    </div>
  );
}
