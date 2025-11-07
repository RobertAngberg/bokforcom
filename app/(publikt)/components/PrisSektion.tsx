import PricingCard from "./PrisKort";

export default function PricingSection() {
  const pricingPlans = [
    {
      title: "Gratis",
      price: 0,
      description: "För de flesta företag",
      features: [
        "Upp till 100 000 kr i omsättning",
        "Obegränsat antal fakturor",
        "Obegränsat antal anställda",
      ],
      recommended: true,
      highlightColor: "border-green-500",
      checkmarkColor: "text-green-400",
    },
    {
      title: "Standard",
      price: 149,
      description: "För växande företag",
      features: [
        "100 000 - 500 000 kr i omsättning",
        "Obegränsat antal fakturor",
        "Obegränsat antal anställda",
      ],
      recommended: false,
      highlightColor: "border-cyan-500",
      checkmarkColor: "text-cyan-400",
    },
    {
      title: "Premium",
      price: 249,
      description: "För professionella organisationer",
      features: [
        "Över 500 000 kr i omsättning",
        "Obegränsat antal fakturor",
        "Obegränsat antal anställda",
      ],
      recommended: false,
      highlightColor: "border-purple-500",
      checkmarkColor: "text-purple-400",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-16 max-w-7xl mx-auto">
      {pricingPlans.map((plan, index) => (
        <PricingCard key={index} {...plan} />
      ))}
    </div>
  );
}
