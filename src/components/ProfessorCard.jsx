import { Link } from "react-router-dom";
import StarDisplay from "./StarDisplay";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';

export default function ProfessorCard({ professor }) {
    const rating = professor.rating_promedio || 0;
    const totalResenas = professor.total_resenas || 0;
    const materias = professor.materias || [];

    return (
        <Link
            to={`/profesores/${professor.id_profesor}`}
            style={{ textDecoration: "none" }}
        >
            <div style={{
                background: "#fff",
                borderRadius: 14,
                padding: 14,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                cursor: "pointer",
                fontFamily: 'Inter, sans-serif',
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
                 onMouseEnter={(e) => {
                     e.currentTarget.style.transform = "translateY(-4px)";
                     e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                     e.currentTarget.style.borderColor = "#2563eb";
                 }}
                 onMouseLeave={(e) => {
                     e.currentTarget.style.transform = "translateY(0)";
                     e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                     e.currentTarget.style.borderColor = "#e5e7eb";
                 }}
            >
                {/* Header con avatar, info y badge */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    {/* Avatar */}
                    {professor.foto ? (
                        <img
                            src={professor.foto}
                            alt={professor.profesor_nombre}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: '1px solid #e5e7eb'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 40,
                            height: 40,
                            background: "#2563eb",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                            <FontAwesomeIcon
                                icon={faChalkboardTeacher}
                                style={{ fontSize: 17, color: '#fff' }}
                            />
                        </div>
                    )}

                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            margin: "0 0 3px 0",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#13346b",
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {professor.profesor_nombre}
                        </h3>

                        {/* Rating + Contador de reseñas */}
                        {rating > 0 ? (
                            <>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    marginBottom: 2
                                }}>
                                    <StarDisplay rating={rating} size={12} />
                                    <span style={{
                                        fontSize: 12,
                                        color: "#64748b",
                                        fontWeight: 600
                                    }}>
                                        {rating.toFixed(1)}
                                    </span>
                                </div>
                                {/* Contador de reseñas - SOLO si > 0 */}
                                {totalResenas > 0 && (
                                    <p style={{
                                        margin: 0,
                                        fontSize: 10,
                                        color: "#94a3b8",
                                        fontWeight: 500
                                    }}>
                                        {totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p style={{
                                margin: 0,
                                fontSize: 11,
                                color: "#94a3b8",
                                fontWeight: 500
                            }}>
                                Sin calificaciones
                            </p>
                        )}
                    </div>

                    {/* Badge "PROFESOR" */}
                    <div style={{
                        background: "#2563eb",
                        color: "#fff",
                        padding: "4px 9px",
                        borderRadius: 14,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        flexShrink: 0
                    }}>
                        Profesor
                    </div>
                </div>

                {/* Materias - siempre en la parte inferior */}
                {materias.length > 0 ? (
                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 5
                    }}>
                        {materias.slice(0, 3).map((materia, idx) => (
                            <span
                                key={idx}
                                style={{
                                    padding: "4px 9px",
                                    background: "#eff6ff",
                                    color: "#2563eb",
                                    border: '1px solid #dbeafe',
                                    borderRadius: 7,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    lineHeight: 1
                                }}
                            >
                                {materia}
                            </span>
                        ))}
                        {materias.length > 3 && (
                            <span style={{
                                padding: "4px 9px",
                                background: "#f8fafc",
                                color: "#64748b",
                                border: '1px solid #e5e7eb',
                                borderRadius: 7,
                                fontSize: 10,
                                fontWeight: 600,
                                lineHeight: 1
                            }}>
                                +{materias.length - 3}
                            </span>
                        )}
                    </div>
                ) : (
                    <p style={{
                        margin: 0,
                        fontSize: 11,
                        color: "#cbd5e1",
                        fontWeight: 500,
                        fontStyle: 'italic'
                    }}>
                        Sin materias asignadas
                    </p>
                )}
            </div>
        </Link>
    );
}