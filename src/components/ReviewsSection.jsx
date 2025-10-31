import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ratingsAPI } from '../api/database';
import StarDisplay from './StarDisplay';

// Tags disponibles (mismo array que en AuthModal)
const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: '✨ Muy claro', type: 'positive' },
    { id: 'querido', label: '🎓 Querido por los estudiantes', type: 'positive' },
    { id: 'apasionado', label: '🔥 Apasionado', type: 'positive' },
    { id: 'disponible', label: '💬 Siempre disponible', type: 'positive' },
    { id: 'ordenado', label: '📋 Muy ordenado', type: 'positive' },
    { id: 'dinamico', label: '⚡ Clases dinámicas', type: 'positive' },
    { id: 'cercano', label: '🤝 Cercano a los alumnos', type: 'positive' },
    { id: 'califica-duro', label: '📊 Califica duro', type: 'negative' },
    { id: 'mucha-tarea', label: '📖 Mucha tarea', type: 'negative' },
    { id: 'participacion', label: '🎤 La participación importa', type: 'negative' },
    { id: 'confuso', label: '🤔 Confuso', type: 'negative' },
    { id: 'lejano', label: '🚪 Lejano a los alumnos', type: 'negative' },
    { id: 'examenes-dificiles', label: '📝 Exámenes difíciles', type: 'negative' }
];

export default function ReviewsSection({
                                           reviews,
                                           materias,
                                           selectedFilter,
                                           selectedMateria,
                                           onFilterChange,
                                           onMateriaChange,
                                           onAddReview,
                                           onReviewDeleted,
                                           onEditReview
                                       }) {
    const [materiasNames, setMateriasNames] = useState({});
    const [currentUserId, setCurrentUserId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadMateriasNames();
        loadCurrentUser();
    }, [reviews]);

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (usuarioData) {
                setCurrentUserId(usuarioData.id_usuario);
            }
        }
    };

    const loadMateriasNames = async () => {
        if (reviews.length === 0) return;

        const materiaIds = [...new Set(reviews.map(r => r.materia_id).filter(Boolean))];
        const names = {};

        for (const id of materiaIds) {
            const { data } = await supabase
                .from('materia')
                .select('nombre_materia')
                .eq('id_materia', id)
                .single();

            if (data) names[id] = data.nombre_materia;
        }

        setMateriasNames(names);
    };

    const canDeleteReview = (review) => {
        return currentUserId && review.user_id === currentUserId;
    };

    const canEditReview = (review) => {
        return currentUserId && review.user_id === currentUserId;
    };

    const handleEditClick = (review) => {
        if (onEditReview) {
            onEditReview(review);
        }
    };

    const handleDeleteClick = (review) => {
        setReviewToDelete(review);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;

        setDeleting(true);
        const { data, error } = await ratingsAPI.deleteRating(reviewToDelete.id);

        if (error) {
            alert('Error al borrar la reseña: ' + error.message);
        } else {
            // Cerrar modal
            setDeleteModalOpen(false);
            setReviewToDelete(null);

            // Notificar al componente padre para que recargue los datos
            if (onReviewDeleted) {
                onReviewDeleted();
            }
        }
        setDeleting(false);
    };

    const getTagLabel = (tagId) => {
        const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
        return tag ? tag.label : tagId;
    };

    const getReviewBorderColor = (rating) => {
        return rating >= 3 ? '#86efac' : '#fca5a5';
    };

    const getReviewBackgroundColor = (rating) => {
        return rating >= 3 ? '#f0fdf4' : '#fef2f2';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    return (
        <div>
            {/* Header con título y botón */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 12
            }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                    Reseñas ({reviews.length})
                </h2>
                <button
                    onClick={onAddReview}
                    style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }}
                >
                    + ¡Dejá tu reseña!
                </button>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 24,
                flexWrap: 'wrap'
            }}>
                {/* Filtro de tipo */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {['todos', 'positivas', 'negativas'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => onFilterChange(filter)}
                            style={{
                                padding: '8px 16px',
                                background: selectedFilter === filter ? '#2563eb' : '#f3f4f6',
                                color: selectedFilter === filter ? '#fff' : '#6b7280',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontSize: 13,
                                transition: 'all 0.2s ease',
                                textTransform: 'capitalize'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedFilter !== filter) {
                                    e.target.style.background = '#e5e7eb';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedFilter !== filter) {
                                    e.target.style.background = '#f3f4f6';
                                }
                            }}
                        >
                            {filter === 'todos' ? 'Todas' : filter === 'positivas' ? '😊 Positivas' : '😞 Negativas'}
                        </button>
                    ))}
                </div>

                {/* Filtro por materia */}
                {materias.length > 0 && (
                    <select
                        value={selectedMateria || ''}
                        onChange={(e) => onMateriaChange(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                            padding: '8px 12px',
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontSize: 13
                        }}
                    >
                        <option value="">Todas las materias</option>
                        {materias.map(materia => (
                            <option key={materia.id} value={materia.id}>
                                {materia.nombre}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Lista de reseñas */}
            <div style={{ display: 'grid', gap: 16 }}>
                {reviews.length === 0 ? (
                    <div style={{
                        padding: 40,
                        textAlign: 'center',
                        background: '#f9fafb',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                        <p style={{ color: '#6b7280', margin: 0 }}>
                            No hay reseñas todavía. ¡Sé el primero en dejar una!
                        </p>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div
                            key={review.id}
                            style={{
                                padding: 20,
                                background: getReviewBackgroundColor(review.estrellas),
                                border: `2px solid ${getReviewBorderColor(review.estrellas)}`,
                                borderRadius: 12,
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Botones de acción (editar y borrar) */}
                            {(canEditReview(review) || canDeleteReview(review)) && (
                                <div style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    display: 'flex',
                                    gap: 8
                                }}>
                                    {/* Botón de editar */}
                                    {canEditReview(review) && (
                                        <button
                                            onClick={() => handleEditClick(review)}
                                            style={{
                                                background: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: 6,
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                fontSize: 18,
                                                color: '#2563eb',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#2563eb';
                                                e.target.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#eff6ff';
                                                e.target.style.color = '#2563eb';
                                            }}
                                            title="Editar reseña"
                                        >
                                            ✏️
                                        </button>
                                    )}

                                    {/* Botón de borrar */}
                                    {canDeleteReview(review) && (
                                        <button
                                            onClick={() => handleDeleteClick(review)}
                                            style={{
                                                background: '#fee',
                                                border: '1px solid #fcc',
                                                borderRadius: 6,
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                fontSize: 18,
                                                color: '#dc2626',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#dc2626';
                                                e.target.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#fee';
                                                e.target.style.color = '#dc2626';
                                            }}
                                            title="Borrar reseña"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Materia (primero) */}
                            {review.materia_id && (
                                <div style={{
                                    display: 'inline-block',
                                    padding: '6px 12px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    marginBottom: 12
                                }}>
                                    {materiasNames[review.materia_id] || 'Materia'}
                                </div>
                            )}

                            {/* Header de la reseña con estrellas */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 12
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <StarDisplay rating={review.estrellas} size={26} />
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#6b7280'
                                }}>
                                    {formatDate(review.created_at)}
                                </div>
                            </div>

                            {/* Tags (debajo de las estrellas) */}
                            {review.tags && review.tags.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                    marginBottom: 12
                                }}>
                                    {review.tags.map((tagId, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                padding: '4px 10px',
                                                background: '#f3f4f6',
                                                color: '#374151',
                                                borderRadius: 16,
                                                fontSize: 12,
                                                fontWeight: 500,
                                                border: '1px solid #e5e7eb'
                                            }}
                                        >
                                            {getTagLabel(tagId)}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Comentario */}
                            {review.comentario && (
                                <p style={{
                                    margin: '0 0 12px 0',
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    color: '#374151'
                                }}>
                                    {review.comentario}
                                </p>
                            )}

                            {/* Información adicional - SOLO WORKLOAD */}
                            {review.workload && (
                                <div style={{
                                    fontSize: 12,
                                    color: '#6b7280',
                                    borderTop: '1px solid rgba(0,0,0,0.05)',
                                    paddingTop: 12,
                                    marginTop: 12
                                }}>
                                    <strong>Carga:</strong> {review.workload}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal de confirmación para borrar */}
            {deleteModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 24,
                        maxWidth: 400,
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{
                            fontSize: 48,
                            textAlign: 'center',
                            marginBottom: 16
                        }}>
                            ⚠️
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 20,
                            fontWeight: 700,
                            textAlign: 'center'
                        }}>
                            ¿Borrar reseña?
                        </h3>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 14,
                            color: '#6b7280',
                            textAlign: 'center',
                            lineHeight: 1.5
                        }}>
                            Esta acción no se puede deshacer. La reseña será eliminada permanentemente.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: 12,
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setReviewToDelete(null);
                                }}
                                disabled={deleting}
                                style={{
                                    padding: '10px 20px',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    opacity: deleting ? 0.5 : 1
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                style={{
                                    padding: '10px 20px',
                                    background: '#dc2626',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    opacity: deleting ? 0.5 : 1
                                }}
                            >
                                {deleting ? 'Borrando...' : 'Sí, borrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}