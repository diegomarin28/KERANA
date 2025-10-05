// src/components/ui/Chip.jsx
export function Chip({ children, tono = "primary", estilo, onCerrar, icono, tamaño = "medium" }) {
    const tonos = {
        primary:  { texto: "var(--primary-700)", fondo: "rgba(14,165,163,.10)", borde: "var(--ring)" },
        blue:     { texto: "#1e40af",            fondo: "rgba(37,99,235,.10)",  borde: "rgba(37,99,235,.25)" },
        amber:    { texto: "#92400e",            fondo: "rgba(245,158,11,.10)", borde: "rgba(245,158,11,.25)" },
        gray:     { texto: "var(--muted)",       fondo: "rgba(0,0,0,.06)",      borde: "var(--border)" },
        verde:    { texto: "#065f46",            fondo: "rgba(6,95,70,.10)",    borde: "rgba(6,95,70,.25)" },
        rojo:     { texto: "#dc2626",            fondo: "rgba(220,38,38,.10)",  borde: "rgba(220,38,38,.25)" },
        // 👇 alias para compatibilidad
        secondary: { texto: "#1e40af",           fondo: "rgba(37,99,235,.10)",  borde: "rgba(37,99,235,.25)" },
    };

    const tamaños = {
        small: { padding: "2px 8px", fontSize: 11 },
        medium: { padding: "4px 10px", fontSize: 12 },
        large: { padding: "6px 12px", fontSize: 13 }
    };

    const t = tonos[tono] || tonos.primary;
    const s = tamaños[tamaño] || tamaños.medium;

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: s.padding,
                fontSize: s.fontSize,
                borderRadius: 999,
                color: t.texto,
                background: t.fondo,
                border: `1px solid ${t.borde}`,
                fontWeight: 500,
                lineHeight: 1,
                ...estilo,
            }}
        >
            {icono && <span style={{ display: 'flex' }}>{icono}</span>}
            {children}
            {onCerrar && (
                <button
                    onClick={onCerrar}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 4,
                        fontSize: '14px',
                        color: 'inherit',
                        opacity: 0.7
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '1'}
                    onMouseOut={(e) => e.target.style.opacity = '0.7'}
                >
                    ×
                </button>
            )}
        </span>
    );
}