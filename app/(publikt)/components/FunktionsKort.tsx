"use client";

import Image from "next/image";
import { useScrollAnimering } from "../hooks/useScrollAnimering";
import type { FunktionsKortProps } from "../types/types";

export default function FeatureShowcase({
  title,
  description,
  imageSrc,
  imageAlt,
  borderColor,
  animationDirection,
  priority = false,
}: FunktionsKortProps) {
  const animation = useScrollAnimering();

  const translateClass =
    animationDirection === "left" ? "-translate-x-24 opacity-0" : "translate-x-24 opacity-0";

  const outlineMap = {
    "border-blue-500": "outline-blue-500",
    "border-purple-500": "outline-purple-500",
    "border-indigo-500": "outline-indigo-500",
    "border-violet-500": "outline-violet-500",
    "border-cyan-500": "outline-cyan-500",
    "border-green-500": "outline-green-500",
  } as const;

  const outlineColor = outlineMap[borderColor as keyof typeof outlineMap] ?? "outline-blue-500";

  return (
    <section className="py-10 md:py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-10 md:mb-16">{title}</h2>
        <div className="flex justify-center">
          <div
            ref={animation.ref}
            className={`transform transition-all duration-[900ms] ease-out max-w-4xl w-full ${
              animation.isVisible ? "translate-x-0 opacity-100" : translateClass
            }`}
            style={{ transitionDelay: "0ms" }}
          >
            <div
              className={`relative rounded-2xl shadow-2xl overflow-hidden outline outline-[3px] outline-offset-[6px] ${outlineColor}`}
            >
              <div className="relative aspect-[4/3] md:aspect-[3/2] lg:aspect-[16/9]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority={priority}
                  loading={priority ? "eager" : "lazy"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Text under kort */}
        <div className="text-center mt-8 md:mt-12">
          <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">{description}</p>
        </div>
      </div>
    </section>
  );
}
