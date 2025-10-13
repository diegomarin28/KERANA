export function Card({ children, style,onClick,onMouseEnter,onMouseLeave,...props}) {
    return (
        <div
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--card-shadow)",
                borderRadius: 16,
                padding: 16,
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
}
