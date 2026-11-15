import type React from "react";

export function ProductVisual({ type = "luggage", large = false }: { type?: string; large?: boolean }) {
  return (
    <div
      className={`product-visual ${large ? "product-visual--large" : ""} product-visual--${type}`}
      aria-hidden="true"
    >
      {type === "luggage" && (
        <div className="luggage">
          <span className="luggage-handle" />
          <span className="luggage-body">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}
      {type === "headphones" && (
        <div className="headphones">
          <span className="headphones-band" />
          <span className="headphones-left" />
          <span className="headphones-right" />
        </div>
      )}
      {type === "ceramic" && (
        <div className="ceramics">
          <span className="plate plate-one" />
          <span className="plate plate-two" />
          <span className="cup" />
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  icon?: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      className={`button button--${variant}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {icon}
    </button>
  );
}

