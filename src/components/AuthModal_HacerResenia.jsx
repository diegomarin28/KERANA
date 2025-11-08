import { useState, useEffect, useCallback } from "react";
import { ratingsAPI, creditsAPI } from "../api/database";
import { supabase } from "../supabase";
import { validarComentario } from "../utils/wordFilter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStar,
    faStarHalfAlt,
    faCheck,
    faTimes,
    faCheckCircle,
    faTimesCircle,
    faChalkboardTeacher,
    faGraduationCap,
    faSearch,
    faLightbulb,
    faExclamationTriangle,
    faSpinner,
    faLock,
    faHeart,
    faFire,
    faComments,
    faClipboardList,
    faBolt,
    faHandshake,
    faChartLine,
    faBook,
    faMicrophone,
    faQuestionCircle,
    faDoorOpen,
    faClipboard
} from '@fortawesome/free-solid-svg-icons';

// Tags disponibles con iconos Font Awesome (solo free-solid)
const AVAILABLE_TAGS = [
    // Positivos
    { id: 'muy-claro', label: 'Muy claro', type: 'positive', icon: faLightbulb },
    { id: 'querido', label: 'Querido', type: 'positive', icon: faHeart },
    { id: 'apasionado', label: 'Apasionado', type: 'positive', icon: faFire },
    { id: 'disponible', label: 'Disponible', type: 'positive', icon: faComments },
    { id: 'ordenado', label: 'Ordenado', type: 'positive', icon: faClipboardList },
    { id: 'dinamico', label: 'Dinámico', type: 'positive', icon: faBolt },
    { id: 'cercano', label: 'Cercano', type: 'positive', icon: faHandshake },
    // Negativos/Desafiantes
    { id: 'califica-duro', label: 'Califica duro', type: 'negative', icon: faChartLine },
    { id: 'mucha-tarea', label: 'Mucha tarea', type: 'negative', icon: faBook },
    { id: 'participacion', label: 'Participación', type: 'negative', icon: faMicrophone },
    { id: 'confuso', label: 'Confuso', type: 'negative', icon: faQuestionCircle },
    { id: 'lejano', label: 'Lejano', type: 'negative', icon: faDoorOpen },
    { id: 'examenes-dificiles', label: 'Exámenes difíciles', type: 'negative', icon: faClipboard }
];

const StarRating = ({ rating, onRatingChange }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const displayRating = hoverRating || rating;

    const handleStarClick = (starIndex, event) => {
        // Detectar si hicieron click en la mitad izquierda o derecha
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const starWidth = rect.width;

        // Si hicieron click en la mitad izquierda, dar media estrella
        if (clickX < starWidth / 2) {
            onRatingChange(starIndex - 0.5);
        } else {
            onRatingChange(starIndex);
        }
    };

    const handleStarHover = (starIndex, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const hoverX = event.clientX - rect.left;
        const starWidth = rect.width;

        if (hoverX < starWidth / 2) {
            setHoverRating(starIndex - 0.5);
        } else {
            setHoverRating(starIndex);
        }
    };

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "'Inter', sans-serif"
        }}>
            <div
                style={{ display: "flex", gap: 4 }}
                onMouseLeave={() => setHoverRating(0)}
            >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isHalf = displayRating >= starIndex - 0.5 && displayRating < starIndex;
                    const isFull = displayRating >= starIndex;

                    return (
                        <div
                            key={starIndex}
                            style={{
                                position: "relative",
                                fontSize: 32,
                                cursor: "pointer",
                                color: isFull || isHalf ? "#f59e0b" : "#e5e7eb",
                                transition: "all 0.15s ease"
                            }}
                            onClick={(e) => handleStarClick(starIndex, e)}
                            onMouseMove={(e) => handleStarHover(starIndex, e)}
                        >
                            <FontAwesomeIcon
                                icon={isHalf ? faStarHalfAlt : faStar}
                            />
                        </div>
                    );
                })}
            </div>

            <div style={{
                padding: "10px 16px",
                background: "#f8fafc",
                borderRadius: 10,
                border: "2px solid #e2e8f0",
                minWidth: 90
            }}>
                <span style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: 15,
                    fontFamily: "'Inter', sans-serif"
                }}>
                    {displayRating.toFixed(1)} / 5
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
        <div style={{ display: "grid", gap: 12, fontFamily: "'Inter', sans-serif" }}>
            <div style={{ position: "relative", padding: "20px 0" }}>
                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 6,
                    background: "#e2e8f0",
                    borderRadius: 6,
                    transform: "translateY(-50%)"
                }} />

                <div style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: `${(index / 2) * 100}%`,
                    height: 6,
                    background: "linear-gradient(90deg, #2563eb 0%, #1e40af 100%)",
                    borderRadius: 6,
                    transform: "translateY(-50%)",
                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }} />

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
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                border: index >= idx ? "3px solid #2563eb" : "3px solid #cbd5e1",
                                background: index >= idx ? "#fff" : "#f1f5f9",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: index === idx ? "0 0 0 6px rgba(37, 99, 235, 0.15)" : "none",
                                zIndex: index === idx ? 2 : 1
                            }}
                        />
                    ))}
                </div>
            </div>

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                fontWeight: 500
            }}>
                {options.map((opt, idx) => (
                    <span
                        key={opt}
                        style={{
                            color: index === idx ? "#2563eb" : "#64748b",
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

// Componente Toast fuera del componente principal para evitar re-renders
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, []); // ⭐ Solo ejecutar UNA VEZ al montar

    const isSuccess = type === 'success';

    return (
        <div style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            background: isSuccess
                ? "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)"
                : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
            border: `2px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
            borderRadius: 12,
            padding: "16px 20px",
            minWidth: 320,
            maxWidth: 480,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                fontSize: 20,
                color: isSuccess ? '#10b981' : '#ef4444'
            }}>
                <FontAwesomeIcon icon={isSuccess ? faCheckCircle : faTimesCircle} />
            </div>
            <p style={{
                margin: 0,
                color: isSuccess ? '#065f46' : '#991b1b',
                fontSize: 14,
                fontWeight: 600,
                flex: 1,
                lineHeight: 1.4
            }}>
                {message}
            </p>
            <button
                onClick={onClose}
                style={{
                    border: "none",
                    background: "transparent",
                    color: isSuccess ? '#065f46' : '#991b1b',
                    cursor: "pointer",
                    fontSize: 16,
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.7,
                    transition: "opacity 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
            >
                <FontAwesomeIcon icon={faTimes} />
            </button>

            <style>
                {`
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}
            </style>
        </div>
    );
};

export default function AuthModal_HacerResenia({
                                                   open,
                                                   onClose,
                                                   onSave,
                                                   preSelectedEntity = null,
                                                   initialData = null,
                                                   isEditing = false
                                               }) {
    const isPreSelected = !!preSelectedEntity;

    const [form, setForm] = useState({
        tipo: initialData?.tipo || preSelectedEntity?.tipo || "profesor",
        selectedEntity: initialData?.selectedEntity || preSelectedEntity || null,
        selectedMateria: initialData?.selectedMateria || null,
        rating: initialData?.rating || 5,
        selectedTags: initialData?.selectedTags || [],
        texto: initialData?.texto || "",
        workload: initialData?.workload || "Medio"
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [wordFilterError, setWordFilterError] = useState(null);
    const handleCloseToast = useCallback(() => {
        setToast(null);
    }, []);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [materias, setMaterias] = useState([]);
    const [loadingMaterias, setLoadingMaterias] = useState(false);

    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserMentorIds, setCurrentUserMentorIds] = useState([]);


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
                    const { data: mentorData, error: mentorError } = await supabase
                        .from('mentor')
                        .select('id_mentor, id_usuario');

                    if (mentorError) {
                        console.error('Error cargando mentores:', mentorError);
                        setSearchResults([]);
                        return;
                    }

                    if (mentorData && mentorData.length > 0) {
                        const userIds = [...new Set(mentorData.map(m => m.id_usuario))];

                        const { data: usuariosData, error: usuariosError } = await supabase
                            .from('usuario')
                            .select('id_usuario, nombre')
                            .in('id_usuario', userIds);

                        if (usuariosError) {
                            console.error('Error cargando usuarios:', usuariosError);
                            setSearchResults([]);
                            return;
                        }

                        const normalizeText = (text) =>
                            text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                        const termNormalized = normalizeText(term);
                        const mentoresMap = new Map();

                        mentorData.forEach(m => {
                            const usuario = usuariosData.find(u => u.id_usuario === m.id_usuario);

                            if (usuario) {
                                const nombreCompleto = usuario.nombre;
                                const nombreNormalized = normalizeText(nombreCompleto);

                                if (nombreNormalized.includes(termNormalized)) {
                                    // Filtrar al usuario actual si es mentor
                                    if (currentUserMentorIds.includes(m.id_mentor)) {
                                        return; // No agregar el mentor actual a los resultados
                                    }

                                    const usuarioKey = `${m.id_usuario}`;
                                    const existing = mentoresMap.get(usuarioKey);
                                    if (!existing || m.id_mentor > existing.id) {
                                        mentoresMap.set(usuarioKey, {
                                            id: m.id_mentor,
                                            nombre: nombreCompleto
                                        });
                                    }
                                }
                            }
                        });

                        setSearchResults(Array.from(mentoresMap.values()));
                    } else {
                        setSearchResults([]);
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
    }, [searchTerm, form.tipo, isPreSelected, currentUserMentorIds]);

    // Obtener el usuario actual y sus ids de mentor si es mentor
    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error('Error obteniendo usuario:', authError);
                    return;
                }

                // Obtener id_usuario desde la tabla usuario usando auth_id
                const { data: usuarioData, error: usuarioError } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .single();

                if (usuarioError || !usuarioData) {
                    console.error('Error obteniendo id_usuario:', usuarioError);
                    return;
                }

                setCurrentUserId(usuarioData.id_usuario);

                // Si estamos en modo mentor, obtener todos los id_mentor del usuario
                if (form.tipo === 'mentor') {
                    const { data: mentorData, error: mentorError } = await supabase
                        .from('mentor')
                        .select('id_mentor')
                        .eq('id_usuario', usuarioData.id_usuario);

                    if (!mentorError && mentorData) {
                        setCurrentUserMentorIds(mentorData.map(m => m.id_mentor));
                    }
                }
            } catch (error) {
                console.error('Error en getCurrentUser:', error);
            }
        };

        getCurrentUser();
    }, [form.tipo]);


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
                    const { data: mentorData, error: mentorError } = await supabase
                        .from('mentor')
                        .select('id_usuario')
                        .eq('id_mentor', form.selectedEntity.id)
                        .single();

                    if (mentorError || !mentorData) {
                        console.error('Error obteniendo mentor:', mentorError);
                        setMaterias([]);
                        setLoadingMaterias(false);
                        return;
                    }

                    const { data: todosMentores, error: todosMentoresError } = await supabase
                        .from('mentor')
                        .select('id_mentor')
                        .eq('id_usuario', mentorData.id_usuario);

                    if (todosMentoresError || !todosMentores) {
                        console.error('Error obteniendo todos los mentores:', todosMentoresError);
                        setMaterias([]);
                        setLoadingMaterias(false);
                        return;
                    }

                    const mentorIds = todosMentores.map(m => m.id_mentor);

                    const { data, error } = await supabase
                        .from('mentor_materia')
                        .select('materia(id_materia, nombre_materia)')
                        .in('id_mentor', mentorIds);

                    if (!error && data) {
                        const materiasUnicas = data.reduce((acc, m) => {
                            if (!acc.find(mat => mat.id === m.materia.id_materia)) {
                                acc.push({
                                    id: m.materia.id_materia,
                                    nombre: m.materia.nombre_materia
                                });
                            }
                            return acc;
                        }, []);

                        setMaterias(materiasUnicas);
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

    useEffect(() => {
        if (!open) {
            setToast(null);
        }
    }, [open]);

    if (!open) return null;

    const toggleTag = (tagId) => {
        setForm(prev => {
            const isSelected = prev.selectedTags.includes(tagId);
            let newTags;

            if (isSelected) {
                newTags = prev.selectedTags.filter(t => t !== tagId);
            } else {
                if (prev.selectedTags.length >= 3) {
                    return prev;
                }
                newTags = [...prev.selectedTags, tagId];
            }

            return { ...prev, selectedTags: newTags };
        });

        if (errors.selectedTags) {
            setErrors({ ...errors, selectedTags: "" });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.selectedEntity) newErrors.selectedEntity = "Debes seleccionar un " + form.tipo;
        if (!form.selectedMateria) newErrors.selectedMateria = "Debes seleccionar una materia";
        if (form.selectedTags.length === 0) newErrors.selectedTags = "Debes seleccionar al menos un tag";
        if (!form.texto.trim()) newErrors.texto = "El comentario es obligatorio";
        if (form.texto.trim().length < 20) newErrors.texto = "El comentario debe tener al menos 20 caracteres";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const save = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            if (isEditing && initialData?.ratingId) {
                // Modo edición (sin cambios, mantener como está)
                if (onSave) {
                    await onSave({
                        rating: form.rating,
                        texto: form.texto,
                        workload: form.tipo === 'profesor' ? form.workload : null, // ✅ Solo para profesores
                        selectedTags: form.selectedTags,
                        selectedMateria: form.selectedMateria
                    });
                }

                setTimeout(() => {
                    setForm({
                        tipo: isPreSelected ? preSelectedEntity.tipo : "profesor",
                        selectedEntity: isPreSelected ? preSelectedEntity : null,
                        selectedMateria: null,
                        rating: 5,
                        selectedTags: [],
                        texto: "",
                        workload: "Medio"
                    });
                    setSearchTerm("");
                    setErrors({});
                    setWordFilterError(null);
                    onClose();
                }, 1500);
            } else {
                // ✅ NUEVO: Modo creación - Verificar duplicados
                const { data: existeReseña, error: checkError } = await ratingsAPI.checkExistingRating(
                    form.tipo,
                    form.selectedEntity.id,
                    form.selectedMateria.id
                );

                if (checkError) {
                    setToast({
                        message: 'Error al verificar reseñas existentes',
                        type: 'error'
                    });
                    setIsSubmitting(false);
                    return;
                }

                if (existeReseña) {
                    setToast({
                        message: `Ya dejaste una reseña para este ${form.tipo} en esta materia`,
                        type: 'error'
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Continuar con la creación normal
                const { data, error } = await ratingsAPI.createRating(
                    form.tipo,
                    form.selectedEntity.id,
                    form.rating,
                    form.texto,
                    {
                        workload: form.tipo === 'profesor' ? form.workload : null, // ✅ Solo para profesores
                        materia_id: form.selectedMateria.id,
                        tags: form.selectedTags
                    }
                );

                if (error) {
                    setToast({ message: 'Error al enviar reseña: ' + error.message, type: 'error' });
                } else {
                    // 💰 Otorgar 10 créditos por reseña
                    if (data?.id) {
                        const { data: creditosResult, error: creditosError } = await creditsAPI.grantReviewCredits(data.id);
                        if (!creditosError && creditosResult) {
                            console.log(`💰 Créditos otorgados por reseña: ${creditosResult.creditosOtorgados}`);
                            setToast({ message: `¡Reseña enviada! +${creditosResult.creditosOtorgados} créditos`, type: 'success' });

                            // 🔄 Disparar evento para actualizar créditos en tiempo real
                            window.dispatchEvent(new CustomEvent('creditsUpdated', {
                                detail: { amount: creditosResult.creditosOtorgados }
                            }));
                        } else {
                            setToast({ message: '¡Reseña enviada correctamente!', type: 'success' });
                        }
                    } else {
                        setToast({ message: '¡Reseña enviada correctamente!', type: 'success' });
                    }

                    if (onSave) {
                        onSave({
                            ...form,
                            id: data?.id,
                            fecha: new Date().toISOString()
                        });
                    }

                    setTimeout(() => {
                        setForm({
                            tipo: isPreSelected ? preSelectedEntity.tipo : "profesor",
                            selectedEntity: isPreSelected ? preSelectedEntity : null,
                            selectedMateria: null,
                            rating: 5,
                            selectedTags: [],
                            texto: "",
                            workload: "Medio"
                        });
                        setSearchTerm("");
                        setErrors({});
                        setWordFilterError(null);
                        onClose();
                    }, 1500);
                }
            }
        } catch (error) {
            console.error("Error al procesar reseña:", error);
            setToast({ message: 'Error inesperado al procesar la reseña', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={handleCloseToast}
                />
            )}

            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(4px)",
                    zIndex: 3000,
                    cursor: "pointer"
                }}
            />

            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: "fixed",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    zIndex: 3010,
                    padding: "20px",
                    pointerEvents: "none",
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "min(720px, 92vw)",
                        maxWidth: "100%",
                        background: "#fff",
                        borderRadius: 16,
                        border: "2px solid #e2e8f0",
                        boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
                        padding: 24,
                        display: "grid",
                        gap: 20,
                        maxHeight: "90vh",
                        overflowY: "auto",
                        overflowX: "hidden",
                        pointerEvents: "auto",
                        boxSizing: "border-box"
                    }}>

                    {/* Header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: 16,
                        borderBottom: "2px solid #f1f5f9"
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#0f172a"
                        }}>
                            {isEditing
                                ? `Editar reseña de ${form.selectedEntity.nombre}`
                                : (isPreSelected
                                        ? `Reseñar a ${form.selectedEntity.nombre}`
                                        : "Crear reseña"
                                )
                            }
                        </h3>
                        <button
                            onClick={onClose}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: 20,
                                cursor: "pointer",
                                color: "#64748b",
                                transition: "color 0.2s ease",
                                padding: 8,
                                borderRadius: 8
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.color = "#ef4444";
                                e.target.style.background = "#fee2e2";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = "#64748b";
                                e.target.style.background = "transparent";
                            }}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Banner de anonimato */}
                    <div style={{
                        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                        padding: 14,
                        borderRadius: 12,
                        border: "2px solid #fcd34d",
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                    }}>
                        <FontAwesomeIcon
                            icon={faLock}
                            style={{
                                fontSize: 20,
                                color: "#d97706",
                                flexShrink: 0
                            }}
                        />
                        <p style={{
                            margin: 0,
                            fontSize: 14,
                            color: "#78350f",
                            fontWeight: 600,
                            lineHeight: 1.5
                        }}>
                            Tu reseña es completamente anónima. Nadie sabrá quién la escribió.
                        </p>
                    </div>

                    {/* Selector de tipo */}
                    {!isPreSelected && (
                        <label style={{ display: "grid", gap: 10 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
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
                                        height: 52,
                                        borderRadius: 10,
                                        border: form.tipo === "profesor" ? "2px solid #2563eb" : "2px solid #e2e8f0",
                                        background: form.tipo === "profesor" ? "#eff6ff" : "#fff",
                                        color: form.tipo === "profesor" ? "#2563eb" : "#64748b",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <FontAwesomeIcon icon={faChalkboardTeacher} style={{ fontSize: 18 }} />
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
                                        height: 52,
                                        borderRadius: 10,
                                        border: form.tipo === "mentor" ? "2px solid #2563eb" : "2px solid #e2e8f0",
                                        background: form.tipo === "mentor" ? "#eff6ff" : "#fff",
                                        color: form.tipo === "mentor" ? "#2563eb" : "#64748b",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 10,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: 18 }} />
                                    Mentor
                                </button>
                            </div>
                        </label>
                    )}

                    {/* Buscador */}
                    {!isPreSelected && !isEditing && (
                        <label style={{ display: "grid", gap: 10, position: "relative" }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                                Buscar {form.tipo} <span style={{color: "#ef4444"}}>*</span>
                            </span>

                            {!form.selectedEntity ? (
                                <>
                                    <div style={{ position: "relative", width: "100%", maxWidth: "100%" }}>
                                        <FontAwesomeIcon
                                            icon={faSearch}
                                            style={{
                                                position: "absolute",
                                                left: 14,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "#94a3b8",
                                                fontSize: 16,
                                                pointerEvents: "none"
                                            }}
                                        />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setShowSuggestions(true);
                                                if (errors.selectedEntity) setErrors({...errors, selectedEntity: ""});
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            placeholder={`Escribí el nombre...`}
                                            style={{
                                                width: "100%",
                                                height: 48,
                                                border: errors.selectedEntity ? "2px solid #ef4444" : "2px solid #e2e8f0",
                                                borderRadius: 10,
                                                padding: "0 14px 0 44px",
                                                outline: "none",
                                                transition: "border-color 0.2s ease",
                                                fontSize: 14,
                                                fontWeight: 500,
                                                fontFamily: "'Inter', sans-serif",
                                                color: "#0f172a",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    </div>

                                    {/* Sugerencias */}
                                    {showSuggestions && searchTerm.trim() && (
                                        <div style={{
                                            position: "absolute",
                                            top: "calc(100% + 4px)",
                                            left: 0,
                                            right: 0,
                                            background: "#fff",
                                            border: "2px solid #e2e8f0",
                                            borderRadius: 10,
                                            boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
                                            maxHeight: 240,
                                            overflowY: "auto",
                                            zIndex: 10
                                        }}>
                                            {searchLoading ? (
                                                <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                                                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 8 }} />
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
                                                            padding: "14px 16px",
                                                            textAlign: "left",
                                                            cursor: "pointer",
                                                            transition: "background 0.2s ease",
                                                            borderBottom: "1px solid #f1f5f9",
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: "#0f172a"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        {result.nombre}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 14 }}>
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
                                    padding: "14px 16px",
                                    background: "#eff6ff",
                                    border: "2px solid #2563eb",
                                    borderRadius: 10
                                }}>
                                    <span style={{ fontWeight: 600, color: "#1e40af", fontSize: 14 }}>
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
                                            background: "#2563eb",
                                            color: "#fff",
                                            borderRadius: 8,
                                            padding: "6px 14px",
                                            cursor: "pointer",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            transition: "all 0.2s ease"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#1e40af"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "#2563eb"}
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            )}

                            {errors.selectedEntity && (
                                <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>
                                    {errors.selectedEntity}
                                </span>
                            )}
                        </label>
                    )}

                    {/* Selector de materia */}
                    {form.selectedEntity &&(
                        <label style={{ display: "grid", gap: 10 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
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
                                    height: 48,
                                    border: errors.selectedMateria ? "2px solid #ef4444" : "2px solid #e2e8f0",
                                    borderRadius: 10,
                                    padding: "0 14px",
                                    outline: "none",
                                    cursor: loadingMaterias ? "not-allowed" : "pointer",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    fontFamily: "'Inter', sans-serif",
                                    color: "#0f172a",
                                    background: "#fff"
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
                                <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>
                                    {errors.selectedMateria}
                                </span>
                            )}
                        </label>
                    )}


                    {/* Calificación y Tags */}
                    {form.selectedEntity && form.selectedMateria && (
                        <>
                            <label style={{ display: "grid", gap: 10 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                                    Calificación <span style={{color: "#ef4444"}}>*</span>
                                </span>
                                <StarRating
                                    rating={form.rating}
                                    onRatingChange={(newRating) => setForm({...form, rating: newRating})}
                                />
                            </label>

                            {/* Selector de Tags */}
                            <label style={{ display: "grid", gap: 10 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                                    Características (elegí entre 1 y 3) <span style={{color: "#ef4444"}}>*</span>
                                </span>
                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 10
                                }}>
                                    {AVAILABLE_TAGS.map(tag => {
                                        const isSelected = form.selectedTags.includes(tag.id);
                                        const isPositive = tag.type === 'positive';

                                        return (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTag(tag.id)}
                                                style={{
                                                    padding: "10px 16px",
                                                    borderRadius: 10,
                                                    border: isSelected
                                                        ? `2px solid ${isPositive ? '#10b981' : '#f59e0b'}`
                                                        : "2px solid #e2e8f0",
                                                    background: isSelected
                                                        ? isPositive ? '#d1fae5' : '#fef3c7'
                                                        : "#fff",
                                                    color: isSelected
                                                        ? isPositive ? '#065f46' : '#78350f'
                                                        : "#64748b",
                                                    cursor: "pointer",
                                                    fontWeight: isSelected ? 600 : 500,
                                                    fontSize: 13,
                                                    transition: "all 0.2s ease",
                                                    opacity: form.selectedTags.length >= 3 && !isSelected ? 0.5 : 1,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8
                                                }}
                                                disabled={form.selectedTags.length >= 3 && !isSelected}
                                            >
                                                <FontAwesomeIcon
                                                    icon={tag.icon}
                                                    style={{ fontSize: 14 }}
                                                />
                                                {tag.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{
                                    fontSize: 13,
                                    color: "#64748b",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontWeight: 500
                                }}>
                                    {errors.selectedTags && (
                                        <span style={{ color: "#ef4444", fontWeight: 600 }}>
                                            {errors.selectedTags}
                                        </span>
                                    )}
                                    <span style={{ marginLeft: "auto" }}>
                                        {form.selectedTags.length}/3 seleccionados
                                    </span>
                                </div>
                            </label>

                            {/* Comentario */}
                            <label style={{ display: "grid", gap: 10 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                                    Comentario <span style={{color: "#ef4444"}}>*</span>
                                </span>
                                <textarea
                                    value={form.texto}
                                    onChange={(e) => {
                                        const nuevoTexto = e.target.value;
                                        setForm({...form, texto: nuevoTexto});

                                        const validacion = validarComentario(nuevoTexto);
                                        if (!validacion.valido) {
                                            setWordFilterError(validacion.error);
                                        } else {
                                            setWordFilterError(null);
                                        }

                                        if (errors.texto) setErrors({...errors, texto: ""});
                                    }}
                                    placeholder="Contanos sobre la metodología, claridad, dificultad, si lo recomendás..."
                                    rows={5}
                                    maxLength={500}
                                    style={{
                                        border: (errors.texto || wordFilterError) ? "2px solid #ef4444" : "2px solid #e2e8f0",
                                        borderRadius: 10,
                                        padding: "14px",
                                        resize: "vertical",
                                        minHeight: "120px",
                                        outline: "none",
                                        transition: "border-color 0.2s ease",
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: "#0f172a",
                                        lineHeight: 1.6
                                    }}
                                />

                                {/* Error de palabras prohibidas */}
                                {wordFilterError && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                        border: '2px solid #ef4444',
                                        borderRadius: 10,
                                        padding: '14px 16px',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 12,
                                        animation: 'shake 0.4s ease'
                                    }}>
                                        <FontAwesomeIcon
                                            icon={faExclamationTriangle}
                                            style={{
                                                fontSize: 18,
                                                color: '#dc2626',
                                                flexShrink: 0,
                                                marginTop: 2
                                            }}
                                        />
                                        <p style={{
                                            margin: 0,
                                            color: '#991b1b',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            lineHeight: 1.5
                                        }}>
                                            {wordFilterError}
                                        </p>
                                    </div>
                                )}

                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    {errors.texto && !wordFilterError && (
                                        <span style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>
                                            {errors.texto}
                                        </span>
                                    )}
                                    <span style={{
                                        color: form.texto.length >= 500 ? "#ef4444" : "#64748b",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginLeft: "auto"
                                    }}>
                                        {form.texto.length}/500
                                    </span>
                                </div>
                            </label>

                            {/* Carga de trabajo - Solo para profesores */}
                            {form.tipo === 'profesor' && (
                                <label style={{ display: "grid", gap: 10 }}>
                                    <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                                        Carga de trabajo
                                    </span>
                                    <WorkloadSlider
                                        value={form.workload}
                                        onChange={(value) => setForm({...form, workload: value})}
                                    />
                                </label>
                            )}

                            {/* Tips */}
                            <div style={{
                                background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                                padding: 16,
                                borderRadius: 12,
                                border: "2px solid #bae6fd"
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12
                                }}>
                                    <FontAwesomeIcon
                                        icon={faLightbulb}
                                        style={{
                                            fontSize: 20,
                                            color: "#0284c7",
                                            flexShrink: 0,
                                            marginTop: 2
                                        }}
                                    />
                                    <div>
                                        <strong style={{
                                            color: "#0c4a6e",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            display: "block",
                                            marginBottom: 8
                                        }}>
                                            Consejos para una reseña útil:
                                        </strong>
                                        <ul style={{
                                            margin: 0,
                                            paddingLeft: 18,
                                            fontSize: 13,
                                            color: "#0369a1",
                                            lineHeight: 1.6,
                                            fontWeight: 500
                                        }}>
                                            <li>Sé específico sobre la metodología y claridad</li>
                                            <li>Mencioná la dificultad y tiempo requerido</li>
                                            <li>Comentá si el material es útil y accesible</li>
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
                        gap: 12,
                        justifyContent: "flex-end",
                        paddingTop: 20,
                        borderTop: "2px solid #f1f5f9"
                    }}>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{
                                height: 48,
                                padding: "0 24px",
                                borderRadius: 10,
                                border: "2px solid #e2e8f0",
                                background: "#fff",
                                cursor: isSubmitting ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                fontSize: 14,
                                opacity: isSubmitting ? 0.5 : 1,
                                transition: "all 0.2s ease",
                                color: "#64748b",
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = "#fff")}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={save}
                            disabled={isSubmitting || !form.selectedEntity || !form.selectedMateria || wordFilterError}
                            style={{
                                height: 48,
                                padding: "0 28px",
                                borderRadius: 10,
                                background: (isSubmitting || !form.selectedEntity || !form.selectedMateria || wordFilterError)
                                    ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
                                    : "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                                color: "#fff",
                                border: "none",
                                cursor: (isSubmitting || !form.selectedEntity || !form.selectedMateria || wordFilterError) ? "not-allowed" : "pointer",
                                fontWeight: 700,
                                fontSize: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                boxShadow: (isSubmitting || !form.selectedEntity || !form.selectedMateria || wordFilterError)
                                    ? "none"
                                    : "0 4px 16px rgba(37, 99, 235, 0.4)",
                                transition: "all 0.2s ease",
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting && form.selectedEntity && form.selectedMateria && !wordFilterError) {
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.5)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSubmitting && form.selectedEntity && form.selectedMateria && !wordFilterError) {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 99, 235, 0.4)";
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCheck} />
                                    Publicar reseña
                                </>
                            )}
                        </button>
                    </div>

                    <style>
                        {`
                            @keyframes shake {
                                0%, 100% { transform: translateX(0); }
                                25% { transform: translateX(-8px); }
                                75% { transform: translateX(8px); }
                            }
                        `}
                    </style>
                </div>
            </div>
        </>
    );
}