import PricingCard from "./PrisKort";

export default function PricingSection() {
  const pricingPlans = [
    {
      title: "Gratis",
      price: 0,
      description: "För de flesta företag",
      features: ["50 kvittoscanningar/månad", "10 fakturor/månad", "1 anställd"],
      recommended: true,
      highlightColor: "border-green-500",
      checkmarkColor: "text-green-400",
    },
    {
      title: "Standard",
      price: 249,
      description: "För växande företag",
      features: ["250 kvittoscanningar/månad", "50 fakturor/månad", "3 anställda"],
      recommended: false,
      highlightColor: "border-cyan-500",
      checkmarkColor: "text-cyan-400",
    },
    {
      title: "Premium",
      price: 399,
      description: "För professionella organisationer",
      features: ["2000 kvittoscanningar/månad", "500 fakturor/månad", "10 anställda"],
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
