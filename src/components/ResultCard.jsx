import { Link } from "react-router-dom"
import { Card } from "../components/ui/Card"
import { Chip } from "../components/ui/Chip"

export default function ResultCard({ title, subtitle, description, link, pill }) {
    return (
        <Link to={link} style={{ textDecoration: "none", color: "inherit" }}>
            <Card>
                <h3 style={{ margin: "0 0 6px" }}>{title}</h3>
                <p style={{ margin: "0 0 4px", color: "#64748b" }}>{subtitle}</p>
                {description && (
                    <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
                        {description.length > 120 ? description.substring(0, 120) + "…" : description}
                    </p>
                )}
                {pill && <div style={{ marginTop: 8 }}><Chip tone="blue">{pill}</Chip></div>}
            </Card>
        </Link>
    )
}
