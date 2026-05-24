import React from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/Container";

type HeroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  cta?: { label: string; href: string }[];
  className?: string;
};

export function Hero({ eyebrow, title, subtitle, cta, className = "" }: HeroProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <Container>
        <div className="py-20 md:py-28">
          <div className="max-w-3xl">
            {eyebrow && <span className="inline-block bg-secondary text-white py-1 px-3 rounded-full text-sm mb-4">{eyebrow}</span>}
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">{title}</h1>
            {subtitle && <p className="mt-4 text-lg text-gray-600">{subtitle}</p>}
            {cta && (
              <div className="mt-8 flex flex-wrap gap-3">
                {cta.map((c) => (
                  <a key={c.href} href={c.href}>
                    <Button className="rounded-full" >{c.label}</Button>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
