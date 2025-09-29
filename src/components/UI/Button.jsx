export function Button({ children, variant="primary", ...props }) {
    const map = {
        primary: { bg: "var(--primary)", hover: "var(--primary-700)", fg: "#fff", brd:"transparent" },
        secondary: { bg: "var(--blue)", hover: "#1d4ed8", fg: "#fff", brd:"transparent" },
        ghost: { bg: "transparent", hover: "rgba(14,165,163,.10)", fg: "var(--text)", brd:"var(--border)" }
    }[variant];

    return (
        <button
            {...props}
            style={{
                background: map.bg,
                color: map.fg,
                border: `1px solid ${map.brd}`,
                borderRadius: 12,
                padding: "10px 14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "background .15s"
            }}
            onMouseEnter={(e)=> e.currentTarget.style.background = map.hover}
            onMouseLeave={(e)=> e.currentTarget.style.background = map.bg}
        >
            {children}
        </button>
    );
}
