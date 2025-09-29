export function Card({ children, style }) {
    return (
        <div
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)",
                borderRadius: 16,
                padding: 16,
                ...style
            }}
        >
            {children}
        </div>
    );
}
