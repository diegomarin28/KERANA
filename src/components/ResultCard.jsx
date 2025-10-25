import { Link } from "react-router-dom"
import { Card } from "../components/UI/Card"
import { Chip } from "../components/UI/Chip"

export default function ResultCard({ title, subtitle, description, link, pill, rating }) {
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    {pill && <Chip tone="blue">{pill}</Chip>}
                    {rating > 0 && (
                        <div style={{ color: "#f8a415", fontSize: "0.9rem" }}>
                            {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))} {rating}
                        </div>
                    )}
                </div>
            </Card>
        </Link>
    )
}