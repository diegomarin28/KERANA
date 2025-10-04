import { Link } from "react-router-dom";

export default function NoteCard({ note }) {
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
                to={`/apuntes/${note.id_apunte}`}
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
                        📄
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            margin: "0 0 8px 0",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#111827",
                            lineHeight: 1.3
                        }}>
                            {note.titulo}
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {note.materia_nombre && (
                                <p style={{
                                    margin: 0,
                                    fontSize: 14,
                                    color: "#6B7280"
                                }}>
                                    {note.materia_nombre}
                                </p>
                            )}

                            {note.autor_nombre && (
                                <p style={{
                                    margin: 0,
                                    fontSize: 14,
                                    color: "#6B7280"
                                }}>
                                    Por {note.autor_nombre}
                                </p>
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
                        PDF
                    </div>
                </div>
            </Link>
        </div>
    );
}