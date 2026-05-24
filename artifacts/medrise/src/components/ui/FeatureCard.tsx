import React from "react";

type FeatureCardProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function FeatureCard({ title, description, icon, className = "" }: FeatureCardProps) {
  return (
    <article className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-start gap-4">
        {icon && <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
    </article>
  );
}
