import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function ReviewsSection({
                                           reviews,
                                           materias,
                                           selectedFilter,
                                           selectedMateria,
                                           onFilterChange,
                                           onMateriaChange,
                                           onAddReview
                                       }) {
    const [materiasNames, setMateriasNames] = useState({});

    useEffect(() => {
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

        loadMateriasNames();
    }, [reviews]);

    const renderStars = (rating) => {
        return (
            <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                    <span key={i} style={{
                        fontSize: 16,
                        color: i < Math.floor(rating) ? '#f59e0b' : i < rating ? '#f59e0b' : '#e5e7eb'
                    }}>
                        {i < Math.floor(rating) ? '★' : i < rating ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
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
                                transition: 'all 0.2s ease'
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
                            {/* Header de la reseña */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 12
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {renderStars(review.estrellas)}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#6b7280'
                                }}>
                                    {formatDate(review.created_at)}
                                </div>
                            </div>

                            {/* Materia */}
                            {review.materia_id && (
                                <div style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    marginBottom: 12
                                }}>
                                    {materiasNames[review.materia_id] || 'Materia'}
                                </div>
                            )}

                            {/* Título */}
                            {review.titulo && (
                                <h4 style={{
                                    margin: '12px 0 8px 0',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#1f2937'
                                }}>
                                    {review.titulo}
                                </h4>
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

                            {/* Información adicional */}
                            <div style={{
                                display: 'flex',
                                gap: 16,
                                flexWrap: 'wrap',
                                fontSize: 12,
                                color: '#6b7280',
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                paddingTop: 12,
                                marginTop: 12
                            }}>
                                {review.workload && (
                                    <div>
                                        <strong>Carga:</strong> {review.workload}
                                    </div>
                                )}
                                {review.metodologia && (
                                    <div>
                                        <strong>Metodología:</strong> {review.metodologia}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}