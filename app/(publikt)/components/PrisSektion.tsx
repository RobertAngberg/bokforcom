import PricingCard from "./PrisKort";

export default function PricingSection() {
  const pricingPlans = [
    {
      title: "Gratis",
      price: 0,
      description: "För de flesta företag",
      features: [
        "50 kvittoscanningar/månad",
        "10 fakturor/månad",
        "1 anställd",
        "1 lönekörning/månad",
      ],
      recommended: true,
      highlightColor: "border-green-500",
      checkmarkColor: "text-green-400",
    },
    {
      title: "Standard",
      price: 249,
      description: "För växande företag",
      features: [
        "100 kvittoscanningar/månad",
        "50 fakturor/månad",
        "2 anställda",
        "2 lönekörningar/månad",
      ],
      recommended: false,
      highlightColor: "border-cyan-500",
      checkmarkColor: "text-cyan-400",
    },
    {
      title: "Premium",
      price: 399,
      description: "För professionella organisationer",
      features: [
        "500 kvittoscanningar/månad",
        "500 fakturor/månad",
        "5 anställda",
        "5 lönekörningar/månad",
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
