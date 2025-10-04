import { Link } from "react-router-dom";

export default function SubjectCard({ subject }) {
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
                to={`/materias/${subject.id_materia}`}
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
                        📖
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            margin: "0 0 8px 0",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#111827"
                        }}>
                            {subject.nombre_materia}
                        </h3>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: 14,
                                color: "#6B7280",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                            }}>
                                Semestre {subject.semestre || "-"}
                            </span>

                            {subject.total_apuntes > 0 && (
                                <span style={{
                                    fontSize: 14,
                                    color: "#2563EB",
                                    fontWeight: 500
                                }}>
                                    {subject.total_apuntes} apuntes
                                </span>
                            )}
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
                        Materia
                    </div>
                </div>
            </Link>
        </div>
    );
}