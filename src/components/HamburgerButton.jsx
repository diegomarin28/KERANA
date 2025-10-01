import { useMemo } from "react";

export default function HamburgerButton({
  open,
  onToggle,
  size = 26,
  color = "currentColor",
  label = "Abrir menú"
}) {
  // accesible: aria-pressed y aria-label cambian según estado
  const ariaLabel = useMemo(() => (open ? "Cerrar menú" : label), [open, label]);

  const line = {
    display: "block",
    width: size,
    height: 2,
    background: color,
    borderRadius: 2,
    transition: "transform .3s ease, opacity .2s ease, background .2s ease",
      marginLeft: "10px"

  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={open}
      onClick={onToggle}
      style={{
        all: "unset",
        cursor: "pointer",
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "inline-block",
        }}
      >
        {/* Top */}
        <span style={{
          ...line,
          position: "absolute",
          top: 6,
          transform: open ? "translateY(7px) rotate(45deg)" : "none",
        }} />
        {/* Middle */}
        <span style={{
          ...line,
          position: "absolute",
          top: 12,
          opacity: open ? 0 : 1,
        }} />
        {/* Bottom */}
        <span style={{
          ...line,
          position: "absolute",
          top: 18,
          transform: open ? "translateY(-7px) rotate(-45deg)" : "none",
        }} />
      </span>
    </button>
  );
}
