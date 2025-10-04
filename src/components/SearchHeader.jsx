export default function SearchHeader({ title, subtitle }) {
    return (
        <div
            style={{
                background: `
          radial-gradient(1200px 420px at 15% -40%, rgba(14,165,163,.22), transparent),
          radial-gradient(900px 340px at 100% -30%, rgba(37,99,235,.16), transparent), /* azul */
          radial-gradient(700px 300px at 60% -20%, rgba(245,158,11,.12), transparent),  /* amber */
          linear-gradient(180deg, rgba(14,165,163,.08), transparent)
        `,
                borderBottom: "1px solid var(--border)",
                position: "relative",
                zIndex: 100
            }}
        >
            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 16px" }}>
                {subtitle && <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 4 }}>{subtitle}</div>}
                <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>{title}</h1>
            </div>
        </div>
    );
}
