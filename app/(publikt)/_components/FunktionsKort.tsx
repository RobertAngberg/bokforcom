import Image from "next/image";
import { useScrollAnimering } from "../_hooks/useScrollAnimering";
import { FunktionsKortProps } from "../_types/types";

export default function FeatureShowcase({
  title,
  description,
  imageSrc,
  imageAlt,
  borderColor,
  animationDirection,
}: FunktionsKortProps) {
  const animation = useScrollAnimering();

  const translateClass =
    animationDirection === "left" ? "-translate-x-24 opacity-0" : "translate-x-24 opacity-0";

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-16">{title}</h2>
        <div className="flex justify-center">
          <div
            ref={animation.ref}
            className={`transform transition-all duration-[900ms] ease-out max-w-4xl w-full ${
              animation.isVisible ? "translate-x-0 opacity-100" : translateClass
            }`}
            style={{ transitionDelay: "0ms" }}
          >
            <div
              className={`relative rounded-xl border-4 ${borderColor} shadow-2xl h-[600px] overflow-hidden`}
            >
              <Image src={imageSrc} alt={imageAlt} fill className="object-contain" priority />
            </div>
          </div>
        </div>

        {/* Text under kort */}
        <div className="text-center mt-12">
          <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">{description}</p>
        </div>
      </div>
    </section>
  );
}
