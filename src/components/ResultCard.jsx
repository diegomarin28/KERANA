import { Link } from "react-router-dom"

export default function ResultCard({ title, subtitle, description, link }) {
    return (
        <Link
            to={link}
            style={{
                display: "block",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                textDecoration: "none",
                color: "inherit"
            }}
        >
            <h3 style={{ margin: "0 0 6px" }}>{title}</h3>
            <p style={{ margin: "0 0 4px", color: "#64748b" }}>{subtitle}</p>
            {description && (
                <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                    {description.length > 120 ? description.substring(0, 120) + "…" : description}
                </p>
            )}
        </Link>
    )
}
