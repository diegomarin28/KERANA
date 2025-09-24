import { useState } from "react";

// Componente de estrellas interactivo
const StarRating = ({ rating, onRatingChange }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleStarClick = (starValue) => {
        onRatingChange(starValue);
    };

    const handleStarHover = (starValue) => {
        setHoverRating(starValue);
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    const displayRating = hoverRating || rating;

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer"
        }}>
            <div
                style={{ display: "flex", gap: 4 }}
                onMouseLeave={handleMouseLeave}
            >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                    return (
                        <div
                            key={starIndex}
                            style={{
                                position: "relative",
                                fontSize: 28,
                                lineHeight: 1,
                                color: "#e5e7eb",
                                transition: "color 0.15s ease"
                            }}
                        >
                            {/* Estrella base (gris) */}
                            <span>★</span>

                            {/* Mitad izquierda clickeable */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "50%",
                                    height: "100%",
                                    zIndex: 2
                                }}
                                onMouseEnter={() => handleStarHover(starIndex - 0.5)}
                                onClick={() => handleStarClick(starIndex - 0.5)}
                            />

                            {/* Mitad derecha clickeable */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    right: 0,
                                    width: "50%",
                                    height: "100%",
                                    zIndex: 2
                                }}
                                onMouseEnter={() => handleStarHover(starIndex)}
                                onClick={() => handleStarClick(starIndex)}
                            />

                            {/* Overlay para media estrella */}
                            {displayRating >= starIndex - 0.5 && displayRating < starIndex && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        overflow: "hidden",
                                        width: "50%",
                                        color: "#f59e0b",
                                        transition: "color 0.15s ease",
                                        pointerEvents: "none"
                                    }}
                                >
                                    ★
                                </div>
                            )}

                            {/* Overlay para estrella completa */}
                            {displayRating >= starIndex && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        color: "#f59e0b",
                                        transition: "color 0.15s ease",
                                        pointerEvents: "none"
                                    }}
                                >
                                    ★
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                minWidth: 80,
                textAlign: "center"
            }}>
                <span style={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: 14
                }}>
                    {displayRating} de 5
                </span>
            </div>
        </div>
    );
};

export default function AuthModal_HacerReseA({ open, onClose, onSave }) {
    const [form, setForm] = useState({
        rating: 5,
        titulo: "",
        texto: "",
        workload: "Medio",
        metodologia: "Clases prácticas",
        profesor: "",
        materia: ""
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!open) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!form.profesor.trim()) newErrors.profesor = "El nombre del profesor es obligatorio";
        if (!form.materia.trim()) newErrors.materia = "El nombre de la materia es obligatorio";
        if (!form.titulo.trim()) newErrors.titulo = "El título es obligatorio";
        if (!form.texto.trim()) newErrors.texto = "El comentario es obligatorio";
        if (form.texto.trim().length < 20) newErrors.texto = "El comentario debe tener al menos 20 caracteres";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const save = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            onSave?.(form);

            setForm({
                rating: 5,
                titulo: "",
                texto: "",
                workload: "Medio",
                metodologia: "Clases prácticas",
                profesor: "",
                materia: ""
            });
            setErrors({});
            onClose();

            console.log("✅ Reseña enviada exitosamente!");

        } catch (error) {
            console.error("Error al enviar reseña:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,.35)",
                    zIndex: 3000
                }}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    zIndex: 3010
                }}
            >
                <div style={{
                    width: "min(720px, 92vw)",
                    background: "#fff",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    boxShadow: "0 24px 60px rgba(0,0,0,.25)",
                    padding: 18,
                    display: "grid",
                    gap: 12,
                    maxHeight: "90vh",
                    overflowY: "auto"
                }}>
                    {/* Header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <h3 style={{ margin: 0 }}>Hacer reseña de profesor</h3>
                        <button
                            onClick={onClose}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: 20,
                                cursor: "pointer"
                            }}
                        >
                            ✖
                        </button>
                    </div>

                    {/* Información del profesor y materia */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12
                    }}>
                        <label style={{ display: "grid", gap: 6 }}>
                            <span>
                                Profesor <span style={{color: "#ef4444"}}>*</span>
                            </span>
                            <input
                                type="text"
                                value={form.profesor}
                                onChange={(e) => {
                                    setForm({...form, profesor: e.target.value});
                                    if (errors.profesor) setErrors({...errors, profesor: ""});
                                }}
                                placeholder="Ej: Laura Pérez"
                                style={{
                                    height: 40,
                                    border: errors.profesor ? "2px solid #ef4444" : "1px solid var(--border)",
                                    borderRadius: 10,
                                    padding: "0 12px",
                                    outline: "none",
                                    transition: "border-color 0.2s ease"
                                }}
                            />
                            {errors.profesor && (
                                <span style={{ color: "#ef4444", fontSize: 12, marginTop: -2 }}>
                                    {errors.profesor}
                                </span>
                            )}
                        </label>

                        <label style={{ display: "grid", gap: 6 }}>
                            <span>
                                Materia <span style={{color: "#ef4444"}}>*</span>
                            </span>
                            <input
                                type="text"
                                value={form.materia}
                                onChange={(e) => {
                                    setForm({...form, materia: e.target.value});
                                    if (errors.materia) setErrors({...errors, materia: ""});
                                }}
                                placeholder="Ej: Base de Datos I"
                                style={{
                                    height: 40,
                                    border: errors.materia ? "2px solid #ef4444" : "1px solid var(--border)",
                                    borderRadius: 10,
                                    padding: "0 12px",
                                    outline: "none",
                                    transition: "border-color 0.2s ease"
                                }}
                            />
                            {errors.materia && (
                                <span style={{ color: "#ef4444", fontSize: 12, marginTop: -2 }}>
                                    {errors.materia}
                                </span>
                            )}
                        </label>
                    </div>

                    {/* Calificación con estrellas interactivas */}
                    <label style={{ display: "grid", gap: 8 }}>
                        <span>Calificación <span style={{color: "#ef4444"}}>*</span></span>
                        <StarRating
                            rating={form.rating}
                            onRatingChange={(newRating) => setForm({...form, rating: newRating})}
                        />
                    </label>

                    {/* Título */}
                    <label style={{ display: "grid", gap: 6 }}>
                        <span>Título de tu reseña <span style={{color: "#ef4444"}}>*</span></span>
                        <input
                            type="text"
                            value={form.titulo}
                            onChange={(e) => {
                                setForm({...form, titulo: e.target.value});
                                if (errors.titulo) setErrors({...errors, titulo: ""});
                            }}
                            placeholder="Ej: Clara y exigente"
                            maxLength={100}
                            style={{
                                height: 40,
                                border: errors.titulo ? "2px solid #ef4444" : "1px solid var(--border)",
                                borderRadius: 10,
                                padding: "0 12px",
                                outline: "none",
                                transition: "border-color 0.2s ease"
                            }}
                        />
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: -2
                        }}>
                            {errors.titulo && (
                                <span style={{ color: "#ef4444", fontSize: 12 }}>
                                    {errors.titulo}
                                </span>
                            )}
                            <span style={{
                                color: "#6b7280",
                                fontSize: 12,
                                marginLeft: "auto"
                            }}>
                                {form.titulo.length}/100
                            </span>
                        </div>
                    </label>

                    {/* Comentario */}
                    <label style={{ display: "grid", gap: 6 }}>
                        <span>Comentario <span style={{color: "#ef4444"}}>*</span></span>
                        <textarea
                            value={form.texto}
                            onChange={(e) => {
                                setForm({...form, texto: e.target.value});
                                if (errors.texto) setErrors({...errors, texto: ""});
                            }}
                            placeholder="Contanos sobre la metodología, parciales, si recomendas material, cómo fueron las clases..."
                            rows={5}
                            maxLength={500}
                            style={{
                                border: errors.texto ? "2px solid #ef4444" : "1px solid var(--border)",
                                borderRadius: 10,
                                padding: "12px",
                                resize: "vertical",
                                minHeight: "100px",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                                fontFamily: "inherit"
                            }}
                        />
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: -2
                        }}>
                            {errors.texto && (
                                <span style={{ color: "#ef4444", fontSize: 12 }}>
                                    {errors.texto}
                                </span>
                            )}
                            <span style={{
                                color: form.texto.length >= 500 ? "#ef4444" : "#6b7280",
                                fontSize: 12,
                                marginLeft: "auto"
                            }}>
                                {form.texto.length}/500
                            </span>
                        </div>
                    </label>

                    {/* Campos adicionales */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12
                    }}>
                        <label style={{ display: "grid", gap: 6 }}>
                            <span>Carga de trabajo</span>
                            <select
                                value={form.workload}
                                onChange={(e) => setForm({...form, workload: e.target.value})}
                                style={{
                                    height: 40,
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    padding: "0 10px"
                                }}
                            >
                                {["Baja", "Medio", "Alta"].map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </label>

                        <label style={{ display: "grid", gap: 6 }}>
                            <span>Metodología</span>
                            <select
                                value={form.metodologia}
                                onChange={(e) => setForm({...form, metodologia: e.target.value})}
                                style={{
                                    height: 40,
                                    border: "1px solid var(--border)",
                                    borderRadius: 10,
                                    padding: "0 10px"
                                }}
                            >
                                {["Clases teóricas", "Clases prácticas", "Proyectos", "Parciales frecuentes", "Talleres", "Seminarios"].map(v =>
                                    <option key={v} value={v}>{v}</option>
                                )}
                            </select>
                        </label>
                    </div>

                    {/* Información adicional */}
                    <div style={{
                        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid #bae6fd",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            width: 40,
                            height: 40,
                            background: "rgba(59, 130, 246, 0.1)",
                            borderRadius: "50%"
                        }} />
                        <div style={{
                            position: "absolute",
                            bottom: -5,
                            left: -5,
                            width: 30,
                            height: 30,
                            background: "rgba(16, 185, 129, 0.1)",
                            borderRadius: "50%"
                        }} />

                        <div style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            position: "relative",
                            zIndex: 1
                        }}>
                            <div style={{
                                fontSize: 20,
                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                            }}>
                                💡
                            </div>
                            <div>
                                <strong style={{
                                    color: "#0c4a6e",
                                    fontSize: 14,
                                    fontWeight: 700
                                }}>
                                    Consejos para una reseña útil:
                                </strong>
                                <ul style={{
                                    margin: "8px 0 0 0",
                                    paddingLeft: 16,
                                    fontSize: 13,
                                    color: "#0369a1",
                                    lineHeight: 1.5
                                }}>
                                    <li>Sé específico sobre la metodología y el estilo de enseñanza</li>
                                    <li>Menciona la dificultad de los parciales y trabajos</li>
                                    <li>Comenta si el material es útil y accesible</li>
                                    <li>Sé constructivo y honesto en tus comentarios</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 8
                    }}>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                height: 44,
                                padding: "0 20px",
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "#fff",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                opacity: isSubmitting ? 0.7 : 1,
                                transition: "all 0.2s ease"
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            disabled={isSubmitting}
                            style={{
                                height: 44,
                                padding: "0 24px",
                                borderRadius: 10,
                                background: isSubmitting
                                    ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                                    : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                color: "#fff",
                                border: "none",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                boxShadow: isSubmitting
                                    ? "none"
                                    : "0 4px 12px rgba(59, 130, 246, 0.4)",
                                transition: "all 0.2s ease",
                                position: "relative"
                            }}
                        >
                            {isSubmitting && (
                                <div style={{
                                    width: 16,
                                    height: 16,
                                    border: "2px solid transparent",
                                    borderTop: "2px solid #fff",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite"
                                }} />
                            )}
                            {isSubmitting ? "Enviando..." : "Publicar reseña"}
                        </button>
                    </div>

                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                    </style>
                </div>
            </div>
        </>
    );
}