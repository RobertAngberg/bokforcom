type TextFaltProps = {
  label: string;
  name: string;
  type?: string; // "text", "number", "date", "textarea", etc.
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string; // ✅ Lägg till placeholder
};

export default function TextFalt({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = true,
  placeholder,
}: TextFaltProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-white mb-2">
        {label}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white mb-4 h-24 resize-y placeholder-slate-400 focus:border-blue-500 focus:outline-none"
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
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white mb-4 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
        />
      )}
    </div>
  );
}
