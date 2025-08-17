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
  className?: string; // Extra styling
  autoFocus?: boolean; // För fokus
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
  className = "",
  autoFocus = false,
}: TextFaltProps) {
  // Säker escaping av label för XSS-skydd
  const safeLabel = String(label).replace(/[<>'"]/g, "");

  // Säker onChange-hantering med live-validering
  const handleSafeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // ALLTID ta bort farliga tecken för alla fälttyper
    newValue = newValue.replace(/[<>'"&{}()[\]]/g, "");

    // Begränsa längd
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
    }

    // Skapa ny event med säkert värde
    const safeEvent = {
      ...e,
      target: {
        ...e.target,
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

    onChange(safeEvent);
  };

  return (
    <div>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-white mb-2">
          {safeLabel}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleSafeChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className={`w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white mb-4 h-24 resize-y placeholder-slate-400 focus:border-blue-500 focus:outline-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={handleSafeChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          pattern={pattern}
          autoFocus={autoFocus}
          className={`w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white mb-4 placeholder-slate-400 focus:border-blue-500 focus:outline-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}
        />
      )}
    </div>
  );
}
