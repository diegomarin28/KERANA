import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ratingsAPI } from '../api/database';
import StarDisplay from './StarDisplay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHeart,
    faBook,
    faLightbulb,
    faComments,
    faFire,
    faClipboardList,
    faBolt,
    faHandshake,
    faChartLine,
    faMicrophone,
    faQuestionCircle,
    faDoorOpen,
    faClipboard,
    faPenToSquare,
    faTrash,
    faPlus,
    faFilter,
    faSmile,
    faFrown,
    faExclamationTriangle,
    faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';

// Tags disponibles
const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: 'Muy claro', type: 'positive', icon: faLightbulb },
    { id: 'querido', label: 'Querido', type: 'positive', icon: faHeart },
    { id: 'apasionado', label: 'Apasionado', type: 'positive', icon: faFire },
    { id: 'disponible', label: 'Disponible', type: 'positive', icon: faComments },
    { id: 'ordenado', label: 'Ordenado', type: 'positive', icon: faClipboardList },
    { id: 'dinamico', label: 'Dinámico', type: 'positive', icon: faBolt },
    { id: 'cercano', label: 'Cercano', type: 'positive', icon: faHandshake },
    { id: 'califica-duro', label: 'Califica duro', type: 'negative', icon: faChartLine },
    { id: 'mucha-tarea', label: 'Mucha tarea', type: 'negative', icon: faBook },
    { id: 'participacion', label: 'Participación', type: 'negative', icon: faMicrophone },
    { id: 'confuso', label: 'Confuso', type: 'negative', icon: faQuestionCircle },
    { id: 'lejano', label: 'Lejano', type: 'negative', icon: faDoorOpen },
    { id: 'examenes-dificiles', label: 'Exámenes difíciles', type: 'negative', icon: faClipboard }
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
            setDeleteModalOpen(false);
            setReviewToDelete(null);

            if (onReviewDeleted) {
                onReviewDeleted();
            }
        }
        setDeleting(false);
    };

    const getTagData = (tagId) => {
        return AVAILABLE_TAGS.find(t => t.id === tagId);
    };

    const getReviewBorderColor = (rating) => {
        return rating >= 3 ? '#10b981' : '#ef4444';
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
        <div style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header con título y botón */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16
            }}>
                <h2 style={{
                    fontSize: 24,
                    fontWeight: 800,
                    margin: 0,
                    color: '#13346b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <FontAwesomeIcon icon={faClipboardCheck} style={{ fontSize: 22 }} />
                    Reseñas ({reviews.length})
                </h2>
                <button
                    onClick={onAddReview}
                    style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 15,
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#1e40af';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#2563eb';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} />
                    Dejá tu reseña
                </button>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: 12,
                marginBottom: 24,
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {/* Filtro de tipo */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {[
                        { key: 'todos', label: 'Todas', icon: faClipboardCheck },
                        { key: 'positivas', label: 'Positivas', icon: faSmile },
                        { key: 'negativas', label: 'Negativas', icon: faFrown }
                    ].map(filter => (
                        <button
                            key={filter.key}
                            onClick={() => onFilterChange(filter.key)}
                            style={{
                                padding: '10px 18px',
                                background: selectedFilter === filter.key ? '#2563eb' : '#fff',
                                color: selectedFilter === filter.key ? '#fff' : '#64748b',
                                border: `2px solid ${selectedFilter === filter.key ? '#2563eb' : '#e5e7eb'}`,
                                borderRadius: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: 14,
                                fontFamily: 'Inter, sans-serif',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                            onMouseEnter={(e) => {
                                if (selectedFilter !== filter.key) {
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.borderColor = '#cbd5e1';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedFilter !== filter.key) {
                                    e.target.style.background = '#fff';
                                    e.target.style.borderColor = '#e5e7eb';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={filter.icon} style={{ fontSize: 14 }} />
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Filtro por materia */}
                {materias.length > 0 && (
                    <select
                        value={selectedMateria || ''}
                        onChange={(e) => onMateriaChange(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                            padding: '10px 14px',
                            background: '#fff',
                            border: '2px solid #e5e7eb',
                            borderRadius: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontFamily: 'Inter, sans-serif',
                            color: '#64748b',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#2563eb';
                            e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.boxShadow = 'none';
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
                        padding: 60,
                        textAlign: 'center',
                        background: '#fff',
                        borderRadius: 16,
                        border: '2px dashed #cbd5e1'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            margin: '0 auto 20px',
                            background: '#f1f5f9',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FontAwesomeIcon
                                icon={faClipboardCheck}
                                style={{ fontSize: 32, color: '#94a3b8' }}
                            />
                        </div>
                        <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#0f172a'
                        }}>
                            No hay reseñas todavía
                        </h3>
                        <p style={{
                            color: '#64748b',
                            margin: '0 0 24px 0',
                            fontSize: 15,
                            fontWeight: 500
                        }}>
                            ¡Sé el primero en dejar una reseña!
                        </p>
                        <button
                            onClick={onAddReview}
                            style={{
                                padding: '12px 24px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: 15,
                                fontFamily: 'Inter, sans-serif',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#1e40af';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#2563eb';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Escribir primera reseña
                        </button>
                    </div>
                ) : (
                    reviews.map(review => (
                        <div
                            key={review.id}
                            style={{
                                padding: 24,
                                background: getReviewBackgroundColor(review.estrellas),
                                border: `2px solid ${getReviewBorderColor(review.estrellas)}`,
                                borderRadius: 16,
                                transition: 'all 0.2s ease',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Botones de acción */}
                            {(canEditReview(review) || canDeleteReview(review)) && (
                                <div style={{
                                    position: 'absolute',
                                    top: 16,
                                    right: 16,
                                    display: 'flex',
                                    gap: 8
                                }}>
                                    {canEditReview(review) && (
                                        <button
                                            onClick={() => handleEditClick(review)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                background: '#eff6ff',
                                                border: '2px solid #bfdbfe',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                color: '#2563eb',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#2563eb';
                                                e.target.style.color = '#fff';
                                                e.target.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#eff6ff';
                                                e.target.style.color = '#2563eb';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                            title="Editar reseña"
                                        >
                                            <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: 14 }} />
                                        </button>
                                    )}

                                    {canDeleteReview(review) && (
                                        <button
                                            onClick={() => handleDeleteClick(review)}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                background: '#fee2e2',
                                                border: '2px solid #fecaca',
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                color: '#dc2626',
                                                transition: 'all 0.2s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#dc2626';
                                                e.target.style.color = '#fff';
                                                e.target.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#fee2e2';
                                                e.target.style.color = '#dc2626';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                            title="Borrar reseña"
                                        >
                                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 14 }} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Materia */}
                            {review.materia_id && (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    marginBottom: 14,
                                    border: '1px solid #bfdbfe'
                                }}>
                                    <FontAwesomeIcon icon={faBook} style={{ fontSize: 12 }} />
                                    {materiasNames[review.materia_id] || 'Materia'}
                                </div>
                            )}

                            {/* Header con estrellas y fecha */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 14
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <StarDisplay rating={review.estrellas} size={24} />
                                    <span style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: '#0f172a'
                                    }}>
                                        {review.estrellas.toFixed(1)}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: 13,
                                    color: '#64748b',
                                    fontWeight: 600
                                }}>
                                    {formatDate(review.created_at)}
                                </div>
                            </div>

                            {/* Tags */}
                            {review.tags && review.tags.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                    marginBottom: 14
                                }}>
                                    {review.tags.map((tagId, idx) => {
                                        const tagData = getTagData(tagId);
                                        return (
                                            <span
                                                key={idx}
                                                style={{
                                                    padding: '6px 12px',
                                                    background: '#fff',
                                                    color: '#374151',
                                                    borderRadius: 10,
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    border: '2px solid #e5e7eb',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}
                                            >
                                                {tagData && (
                                                    <FontAwesomeIcon
                                                        icon={tagData.icon}
                                                        style={{ fontSize: 12, color: '#64748b' }}
                                                    />
                                                )}
                                                {tagData?.label || tagId}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Comentario */}
                            {review.comentario && (
                                <p style={{
                                    margin: '0 0 14px 0',
                                    fontSize: 15,
                                    lineHeight: 1.6,
                                    color: '#374151',
                                    fontWeight: 500
                                }}>
                                    "{review.comentario}"
                                </p>
                            )}

                            {/* Workload - Solo mostrar para profesores */}
                            {review.workload && review.tipo === 'profesor' && (
                                <div style={{
                                    fontSize: 14,
                                    color: '#64748b',
                                    borderTop: '2px solid rgba(0,0,0,0.06)',
                                    paddingTop: 14,
                                    marginTop: 14,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}>
                                    <FontAwesomeIcon
                                        icon={faClipboardList}
                                        style={{ fontSize: 14, color: '#94a3b8' }}
                                    />
                                    <span style={{ color: '#94a3b8' }}>Carga de trabajo:</span>
                                    <span style={{ color: '#0f172a' }}>{review.workload}</span>
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
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 28,
                        maxWidth: 440,
                        width: '90%',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                        border: '2px solid #e5e7eb'
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            margin: '0 auto 20px',
                            background: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FontAwesomeIcon
                                icon={faExclamationTriangle}
                                style={{ fontSize: 28, color: '#dc2626' }}
                            />
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 22,
                            fontWeight: 800,
                            textAlign: 'center',
                            color: '#0f172a'
                        }}>
                            ¿Borrar reseña?
                        </h3>
                        <p style={{
                            margin: '0 0 28px 0',
                            fontSize: 15,
                            color: '#64748b',
                            textAlign: 'center',
                            lineHeight: 1.6,
                            fontWeight: 500
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
                                    padding: '12px 24px',
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: 12,
                                    fontWeight: 700,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    fontSize: 15,
                                    fontFamily: 'Inter, sans-serif',
                                    opacity: deleting ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!deleting) {
                                        e.target.style.background = '#e5e7eb';
                                        e.target.style.color = '#0f172a';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!deleting) {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.color = '#64748b';
                                    }
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                style={{
                                    padding: '12px 24px',
                                    background: '#dc2626',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontWeight: 700,
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    fontSize: 15,
                                    fontFamily: 'Inter, sans-serif',
                                    opacity: deleting ? 0.5 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!deleting) {
                                        e.target.style.background = '#b91c1c';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!deleting) {
                                        e.target.style.background = '#dc2626';
                                    }
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