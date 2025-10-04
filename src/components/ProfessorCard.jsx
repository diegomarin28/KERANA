import { Link } from "react-router-dom";

export default function ProfessorCard({ professor }) {
    const rating = professor.rating_promedio || professor.estrellas || 0;

    return (
        <div style={{
            background: "white",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.3s ease",
            cursor: "pointer"
        }}
             onMouseEnter={(e) => {
                 e.currentTarget.style.transform = "translateY(-2px)";
                 e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
                 e.currentTarget.style.borderColor = "#2563EB";
             }}
             onMouseLeave={(e) => {
                 e.currentTarget.style.transform = "translateY(0)";
                 e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                 e.currentTarget.style.borderColor = "#E5E7EB";
             }}
        >
            <Link
                to={`/profesores/${professor.id_profesor}`}
                style={{ textDecoration: "none", color: "inherit" }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: "#2563EB",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        color: "white",
                        flexShrink: 0
                    }}>
                        👨‍🏫
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            margin: "0 0 4px 0",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#111827"
                        }}>
                            {professor.profesor_nombre}
                        </h3>

                        <p style={{
                            margin: "0 0 8px 0",
                            fontSize: 14,
                            color: "#6B7280"
                        }}>
                            {professor.materia_nombre || "Profesor universitario"}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ display: "flex", gap: 2 }}>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <span key={i} style={{
                                        color: i < Math.floor(rating) ? "#F59E0B" : "#E5E7EB",
                                        fontSize: 14
                                    }}>
                                        ★
                                    </span>
                                ))}
                            </div>
                            <span style={{
                                fontSize: 14,
                                color: "#6B7280",
                                fontWeight: 500
                            }}>
                                {rating.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    <div style={{
                        background: "#2563EB",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600
                    }}>
                        Profesor
                    </div>
                </div>
            </Link>
        </div>
    );
}