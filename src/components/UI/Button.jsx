export function Button({ children, variant = "primary", ...props }) {
    const map = {
        primary: {
            bg: "#2563eb",
            hover: "#1d4ed8",
            fg: "#fff",
            brd: "transparent"
        },
        secondary: {
            bg: "#1e40af",
            hover: "#1e3a8a",
            fg: "#fff",
            brd: "transparent"
        },
        ghost: {
            bg: "transparent",
            hover: "rgba(37, 99, 235, 0.1)",
            fg: "#374151",
            brd: "#d1d5db"
        },
        outline: {
            bg: "transparent",
            hover: "#f3f4f6",
            fg: "#374151",
            brd: "#d1d5db"
        }
    }[variant];

    // Si no se encuentra la variante, usar primary como fallback
    const styleMap = map || {
        bg: "#2563eb",
        hover: "#1d4ed8",
        fg: "#fff",
        brd: "transparent"
    };

    return (
        <button
            {...props}
            style={{
                background: styleMap.bg,
                color: styleMap.fg,
                border: `1px solid ${styleMap.brd}`,
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background .15s",
                ...props.style // Permitir estilos adicionales
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = styleMap.hover}
            onMouseLeave={(e) => e.currentTarget.style.background = styleMap.bg}
        >
            {children}
        </button>
    );
}