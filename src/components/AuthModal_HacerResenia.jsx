import { useState, useEffect } from "react";
import { ratingsAPI } from "../api/Database";
import { supabase } from "../supabase";

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
                            <span>★</span>

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

// Componente Slider de Workload
const WorkloadSlider = ({ value, onChange }) => {
    const options = ["Baja", "Medio", "Alta"];
    const index = options.indexOf(value);

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <div style={{ position: "relative", padding: "20px 0" }}>
                {/* Línea del slider */}
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 4,
                    background: "#e5e7eb",
                    borderRadius: 4,
                    transform: "translateY(-50%)"
                }} />

                {/* Línea de progreso */}
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: `${(index / 2) * 100}%`,
                    height: 4,
                    background: "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)",
                    borderRadius: 4,
                    transform: "translateY(-50%)",
                    transition: "width 0.3s ease"
                }} />

                {/* Puntos del slider */}
                <div style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "space-between"
                }}>
                    {options.map((opt, idx) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onChange(opt)}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: index >= idx ? "3px solid #2563eb" : "3px solid #d1d5db",
                                background: index >= idx ? "#fff" : "#f3f4f6",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: index === idx ? "0 0 0 4px rgba(37, 99, 235, 0.2)" : "none",
                                zIndex: index === idx ? 2 : 1
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Labels */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#6b7280",
                fontWeight: 500
            }}>
                {options.map((opt, idx) => (
                    <span
                        key={opt}
                        style={{
                            color: index === idx ? "#2563eb" : "#6b7280",
                            fontWeight: index === idx ? 700 : 500,
                            transition: "all 0.2s ease"
                        }}
                    >
                        {opt}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default function AuthModal_HacerResenia({
                                                   open,
                                                   onClose,
                                                   onSave,
                                                   preSelectedEntity = null // {id, nombre, tipo}
                                               }) {
    const isPreSelected = !!preSelectedEntity;

    const [form, setForm] = useState({
        tipo: preSelectedEntity?.tipo || "profesor",
        selectedEntity: preSelectedEntity || null,
        selectedMateria: null,
        rating: 5,
        titulo: "",
        texto: "",
        workload: "Medio",
        metodologia: "Clases prácticas"
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para búsqueda (solo si NO está preseleccionado)
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Estados para materias
    const [materias, setMaterias] = useState([]);
    const [loadingMaterias, setLoadingMaterias] = useState(false);

    // Búsqueda de profesores/mentores (solo si no está preseleccionado)
    useEffect(() => {
        if (isPreSelected) return;
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const searchEntities = async () => {
            setSearchLoading(true);
            try {
                const term = searchTerm.trim();

                if (form.tipo === "profesor") {
                    const { data, error } = await supabase
                        .rpc('buscar_profesores_sin_tildes', { termino: term });

                    if (!error && data) {
                        setSearchResults(data.map(p => ({
                            id: p.id_profesor,
                            nombre: p.profesor_nombre
                        })));
                    }
                } else {
                    const { data, error } = await supabase
                        .rpc('buscar_mentores_sin_tildes', { termino: term });

                    if (!error && data) {
                        setSearchResults(data.map(m => ({
                            id: m.id_mentor,
                            nombre: m.nombre
                        })));
                    }
                }
            } catch (error) {
                console.error("Error buscando:", error);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            searchEntities();
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchTerm, form.tipo, isPreSelected]);

    // Cargar materias cuando se selecciona una entidad
    useEffect(() => {
        if (!form.selectedEntity) {
            setMaterias([]);
            return;
        }

        const loadMaterias = async () => {
            setLoadingMaterias(true);
            try {
                if (form.tipo === "profesor") {
                    const { data, error } = await supabase
                        .from('imparte')
                        .select('materia(id_materia, nombre_materia)')
                        .eq('id_profesor', form.selectedEntity.id);

                    if (!error && data) {
                        setMaterias(data.map(m => ({
                            id: m.materia.id_materia,
                            nombre: m.materia.nombre_materia
                        })));
                    }
                } else {
                    const { data, error } = await supabase
                        .from('mentor_materia')
                        .select('materia(id_materia, nombre_materia)')
                        .eq('id_mentor', form.selectedEntity.id);

                    if (!error && data) {
                        setMaterias(data.map(m => ({
                            id: m.materia.id_materia,
                            nombre: m.materia.nombre_materia
                        })));
                    }
                }
            } catch (error) {
                console.error("Error cargando materias:", error);
                setMaterias([]);
            } finally {
                setLoadingMaterias(false);
            }
        };

        loadMaterias();
    }, [form.selectedEntity, form.tipo]);

    if (!open) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!form.selectedEntity) newErrors.selectedEntity = "Debes seleccionar un " + form.tipo;
        if (!form.selectedMateria) newErrors.selectedMateria = "Debes seleccionar una materia";
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
            const { data, error } = await ratingsAPI.createRating(
                form.tipo,
                form.selectedEntity.id,
                form.rating,
                form.texto,
                {
                    titulo: form.titulo,
                    workload: form.workload,
                    metodologia: form.metodologia,
                    materia_id: form.selectedMateria.id
                }
            );

            if (error) {
                alert('Error al enviar reseña: ' + error.message);
            } else {
                alert('¡Reseña enviada correctamente!');

                if (onSave) {
                    onSave({
                        ...form,
                        id: data?.id,
                        fecha: new Date().toISOString()
                    });
                }

                // Limpiar formulario
                setForm({
                    tipo: isPreSelected ? preSelectedEntity.tipo : "profesor",
                    selectedEntity: isPreSelected ? preSelectedEntity : null,
                    selectedMateria: null,
                    rating: 5,
                    titulo: "",
                    texto: "",
                    workload: "Medio",
                    metodologia: "Clases prácticas"
                });
                setSearchTerm("");
                setErrors({});
                onClose();
            }

        } catch (error) {
            console.error("Error al enviar reseña:", error);
            alert('Error inesperado al enviar la reseña');
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
                    zIndex: 3010,
                    padding: "20px"
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
                        alignItems: "center",
                        paddingBottom: 12,
                        borderBottom: "1px solid #e5e7eb"
                    }}>
                        <h3 style={{ margin: 0 }}>
                            {isPreSelected
                                ? `Hacer reseña a ${form.selectedEntity.nombre}`
                                : "Hacer reseña"
                            }
                        </h3>
                        <button
                            onClick={onClose}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: 20,
                                cursor: "pointer",
                                color: "#6b7280",
                                transition: "color 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.target.style.color = "#ef4444"}
                            onMouseLeave={(e) => e.target.style.color = "#6b7280"}
                        >
                            ✖
                        </button>
                    </div>

                    {/* Selector de tipo (Profesor o Mentor) - Solo si NO está preseleccionado */}
                    {!isPreSelected && (
                        <label style={{ display: "grid", gap: 8 }}>
                            <span style={{ fontWeight: 600 }}>
                                Tipo de reseña <span style={{color: "#ef4444"}}>*</span>
                            </span>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({
                                            ...form,
                                            tipo: "profesor",
                                            selectedEntity: null,
                                            selectedMateria: null
                                        });
                                        setSearchTerm("");
                                        setErrors({});
                                    }}
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: 10,
                                        border: form.tipo === "profesor" ? "2px solid #2563eb" : "1px solid #d1d5db",
                                        background: form.tipo === "profesor" ? "#eff6ff" : "#fff",
                                        color: form.tipo === "profesor" ? "#2563eb" : "#6b7280",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <span style={{ fontSize: 20 }}>👨‍🏫</span>
                                    Profesor
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({
                                            ...form,
                                            tipo: "mentor",
                                            selectedEntity: null,
                                            selectedMateria: null
                                        });
                                        setSearchTerm("");
                                        setErrors({});
                                    }}
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: 10,
                                        border: form.tipo === "mentor" ? "2px solid #2563eb" : "1px solid #d1d5db",
                                        background: form.tipo === "mentor" ? "#eff6ff" : "#fff",
                                        color: form.tipo === "mentor" ? "#2563eb" : "#6b7280",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <span style={{ fontSize: 20 }}>🎓</span>
                                    Mentor
                                </button>
                            </div>
                        </label>
                    )}

                    {/* Buscador de profesor/mentor - Solo si NO está preseleccionado */}
                    {!isPreSelected && (
                        <label style={{ display: "grid", gap: 8, position: "relative" }}>
                            <span style={{ fontWeight: 600 }}>
                                Buscar {form.tipo} <span style={{color: "#ef4444"}}>*</span>
                            </span>

                            {!form.selectedEntity ? (
                                <>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowSuggestions(true);
                                            if (errors.selectedEntity) setErrors({...errors, selectedEntity: ""});
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        placeholder={`Escribí el nombre del ${form.tipo}...`}
                                        style={{
                                            height: 44,
                                            border: errors.selectedEntity ? "2px solid #ef4444" : "1px solid #d1d5db",
                                            borderRadius: 10,
                                            padding: "0 12px",
                                            outline: "none",
                                            transition: "border-color 0.2s ease"
                                        }}
                                    />

                                    {/* Sugerencias */}
                                    {showSuggestions && searchTerm.trim() && (
                                        <div style={{
                                            position: "absolute",
                                            top: "100%",
                                            left: 0,
                                            right: 0,
                                            marginTop: 4,
                                            background: "#fff",
                                            border: "1px solid #d1d5db",
                                            borderRadius: 10,
                                            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                                            maxHeight: 200,
                                            overflowY: "auto",
                                            zIndex: 10
                                        }}>
                                            {searchLoading ? (
                                                <div style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                                                    Buscando...
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                searchResults.map(result => (
                                                    <div
                                                        key={result.id}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setForm({...form, selectedEntity: result, selectedMateria: null});
                                                            setSearchTerm("");
                                                            setShowSuggestions(false);
                                                            if (errors.selectedEntity) setErrors({...errors, selectedEntity: ""});
                                                        }}
                                                        style={{
                                                            width: "100%",
                                                            padding: "12px 16px",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            transition: "background 0.2s ease",
                                                            borderBottom: "1px solid #f3f4f6"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        {result.nombre}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                                                    No se encontraron resultados
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 16px",
                                    background: "#f0f9ff",
                                    border: "2px solid #3b82f6",
                                    borderRadius: 10
                                }}>
                                    <span style={{ fontWeight: 600, color: "#1e40af" }}>
                                        {form.selectedEntity.nombre}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm({...form, selectedEntity: null, selectedMateria: null});
                                            setSearchTerm("");
                                        }}
                                        style={{
                                            border: "none",
                                            background: "#3b82f6",
                                            color: "#fff",
                                            borderRadius: 6,
                                            padding: "4px 12px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                            fontWeight: 600
                                        }}
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            )}

                            {errors.selectedEntity && (
                                <span style={{ color: "#ef4444", fontSize: 12 }}>
                                    {errors.selectedEntity}
                                </span>
                            )}
                        </label>
                    )}

                    {/* Selector de materia */}
                    {form.selectedEntity && (
                        <label style={{ display: "grid", gap: 8 }}>
                            <span style={{ fontWeight: 600 }}>
                                Materia <span style={{color: "#ef4444"}}>*</span>
                            </span>
                            <select
                                value={form.selectedMateria?.id || ""}
                                onChange={(e) => {
                                    const materia = materias.find(m => m.id === parseInt(e.target.value));
                                    setForm({...form, selectedMateria: materia || null});
                                    if (errors.selectedMateria) setErrors({...errors, selectedMateria: ""});
                                }}
                                disabled={loadingMaterias}
                                style={{
                                    height: 44,
                                    border: errors.selectedMateria ? "2px solid #ef4444" : "1px solid #d1d5db",
                                    borderRadius: 10,
                                    padding: "0 12px",
                                    outline: "none",
                                    cursor: loadingMaterias ? "not-allowed" : "pointer"
                                }}
                            >
                                <option value="">
                                    {loadingMaterias ? "Cargando materias..." : "Seleccioná una materia"}
                                </option>
                                {materias.map(materia => (
                                    <option key={materia.id} value={materia.id}>
                                        {materia.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.selectedMateria && (
                                <span style={{ color: "#ef4444", fontSize: 12 }}>
                                    {errors.selectedMateria}
                                </span>
                            )}
                        </label>
                    )}

                    {/* Calificación con estrellas */}
                    {form.selectedEntity && form.selectedMateria && (
                        <>
                            <label style={{ display: "grid", gap: 8, marginTop: 8 }}>
                                <span style={{ fontWeight: 600 }}>
                                    Calificación <span style={{color: "#ef4444"}}>*</span>
                                </span>
                                <StarRating
                                    rating={form.rating}
                                    onRatingChange={(newRating) => setForm({...form, rating: newRating})}
                                />
                            </label>

                            {/* Título */}
                            <label style={{ display: "grid", gap: 6 }}>
                                <span style={{ fontWeight: 600 }}>
                                    Título de tu reseña <span style={{color: "#ef4444"}}>*</span>
                                </span>
                                <input
                                    type="text"
                                    value={form.titulo}
                                    onChange={(e) => {
                                        setForm({...form, titulo: e.target.value});
                                        if (errors.titulo) setErrors({...errors, titulo: ""});
                                    }}
                                    placeholder="Ej: Excelente profesor, muy didáctico"
                                    maxLength={100}
                                    style={{
                                        height: 44,
                                        border: errors.titulo ? "2px solid #ef4444" : "1px solid #d1d5db",
                                        borderRadius: 10,
                                        padding: "0 12px",
                                        outline: "none",
                                        transition: "border-color 0.2s ease"
                                    }}
                                />
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
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
                                <span style={{ fontWeight: 600 }}>
                                    Comentario <span style={{color: "#ef4444"}}>*</span>
                                </span>
                                <textarea
                                    value={form.texto}
                                    onChange={(e) => {
                                        setForm({...form, texto: e.target.value});
                                        if (errors.texto) setErrors({...errors, texto: ""});
                                    }}
                                    placeholder="Contanos sobre la metodología, claridad, dificultad, si lo recomendas..."
                                    rows={5}
                                    maxLength={500}
                                    style={{
                                        border: errors.texto ? "2px solid #ef4444" : "1px solid #d1d5db",
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
                                    alignItems: "center"
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
                                {/* Workload con Slider */}
                                <label style={{ display: "grid", gap: 6 }}>
                                    <span style={{ fontWeight: 600 }}>Carga de trabajo</span>
                                    <WorkloadSlider
                                        value={form.workload}
                                        onChange={(value) => setForm({...form, workload: value})}
                                    />
                                </label>

                                {/* Metodología */}
                                <label style={{ display: "grid", gap: 6 }}>
                                    <span style={{ fontWeight: 600 }}>Metodología</span>
                                    <select
                                        value={form.metodologia}
                                        onChange={(e) => setForm({...form, metodologia: e.target.value})}
                                        style={{
                                            height: 44,
                                            border: "1px solid #d1d5db",
                                            borderRadius: 10,
                                            padding: "0 10px",
                                            outline: "none",
                                            cursor: "pointer"
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
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                    position: "relative",
                                    zIndex: 1
                                }}>
                                    <div style={{ fontSize: 20 }}>💡</div>
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
                                            <li>Sé específico sobre la metodología y claridad</li>
                                            <li>Menciona la dificultad y tiempo requerido</li>
                                            <li>Comenta si el material es útil y accesible</li>
                                            <li>Sé constructivo y honesto en tus comentarios</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Botones */}
                    <div style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 8,
                        paddingTop: 16,
                        borderTop: "1px solid #e5e7eb"
                    }}>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                height: 44,
                                padding: "0 20px",
                                borderRadius: 10,
                                border: "1px solid #d1d5db",
                                background: "#fff",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                opacity: isSubmitting ? 0.7 : 1,
                                transition: "all 0.2s ease",
                                color: "#374151"
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            disabled={isSubmitting || !form.selectedEntity || !form.selectedMateria}
                            style={{
                                height: 44,
                                padding: "0 24px",
                                borderRadius: 10,
                                background: (isSubmitting || !form.selectedEntity || !form.selectedMateria)
                                    ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                                    : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                color: "#fff",
                                border: "none",
                                cursor: (isSubmitting || !form.selectedEntity || !form.selectedMateria) ? "not-allowed" : "pointer",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                boxShadow: (isSubmitting || !form.selectedEntity || !form.selectedMateria)
                                    ? "none"
                                    : "0 4px 12px rgba(59, 130, 246, 0.4)",
                                transition: "all 0.2s ease"
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