"use client";

import type { ReactNode } from "react";
import { cn } from "@chounting/ui";

interface TweakSectionProps {
  title: string;
  children: ReactNode;
}

export function TweakSection({ title, children }: TweakSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

interface RadioOption<V extends string> {
  value: V;
  label: string;
}

interface TweakRadioProps<V extends string> {
  label: string;
  options: RadioOption<V>[];
  value: V;
  onChange: (v: V) => void;
}

export function TweakRadio<V extends string>({
  label,
  options,
  value,
  onChange,
}: TweakRadioProps<V>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium text-foreground/80">{label}</span>
      <div
        role="radiogroup"
        className="flex rounded-md bg-secondary p-0.5"
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex-1 rounded-[5px] px-2 py-1 text-[11.5px] font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-xs"
                  : "bg-transparent text-foreground/60 hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TweakToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

export function TweakToggle({ label, value, onChange }: TweakToggleProps) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <span className="text-[11.5px] font-medium text-foreground/80">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-[18px] w-8 rounded-full transition-colors",
          value ? "bg-success" : "bg-foreground/20",
        )}
      >
        <i
          className={cn(
            "absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-card shadow-xs transition-transform",
            value && "translate-x-3.5",
          )}
        />
      </button>
    </div>
  );
}
