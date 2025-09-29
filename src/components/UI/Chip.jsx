// src/components/ui/Chip.jsx
export function Chip({ children, tone = "primary", style }) {
    const tones = {
        primary:  { text: "var(--primary-700)", bg: "rgba(14,165,163,.10)", brd: "var(--ring)" },
        blue:     { text: "#1e40af",            bg: "rgba(37,99,235,.10)",  brd: "rgba(37,99,235,.25)" },
        amber:    { text: "#92400e",            bg: "rgba(245,158,11,.10)", brd: "rgba(245,158,11,.25)" },
        gray:     { text: "var(--muted)",       bg: "rgba(0,0,0,.06)",      brd: "var(--border)" },
        // 👇 alias para no romper si alguien usa "secondary"
        secondary:{ text: "#1e40af",            bg: "rgba(37,99,235,.10)",  brd: "rgba(37,99,235,.25)" },
    };

    const t = tones[tone] || tones.primary; // fallback seguro

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                fontSize: 12,
                borderRadius: 999,
                color: t.text,
                background: t.bg,
                border: `1px solid ${t.brd}`,
                ...style,
            }}
        >
      {children}
    </span>
    );
}
