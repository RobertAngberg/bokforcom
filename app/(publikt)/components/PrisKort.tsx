import { PrisKortProps } from "../types/types";

export default function PricingCard({
  title,
  price,
  description,
  features,
  recommended = false,
  highlightColor,
  checkmarkColor,
}: PrisKortProps) {
  return (
    <div
      className={`flex-1 bg-slate-800 rounded-2xl p-8 ${
        recommended
          ? `border-2 ${highlightColor}`
          : `border border-slate-600 hover:${highlightColor}`
      } transition-all duration-300 relative`}
    >
      {recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
          För de flesta
        </div>
      )}
      <h3 className="text-2xl font-bold text-white mb-4 text-center">{title}</h3>
      <div className="text-center mb-6">
        <span className={`text-4xl font-bold ${checkmarkColor}`}>{price}</span>
        <span className="text-slate-300 ml-2">kr/månad</span>
      </div>
      <div className="text-slate-300">
        <p className="text-center mb-4 font-semibold">{description}</p>
        <ul className="space-y-2 text-base pl-6">
          {features.map((feature, index) => (
            <li key={index}>
              <span className={checkmarkColor}>✓</span> {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
