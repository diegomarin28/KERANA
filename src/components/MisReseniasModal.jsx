import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ratingsAPI } from '../api/database';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faStar,
    faEdit,
    faTrash,
    faSpinner,
    faChalkboardTeacher,
    faGraduationCap,
    faFilter,
    faSortAmountDown,
    faCalendarAlt,
    faBook,
    faCheckCircle,
    faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: 'Muy claro', type: 'positive' },
    { id: 'querido', label: 'Querido', type: 'positive' },
    { id: 'apasionado', label: 'Apasionado', type: 'positive' },
    { id: 'disponible', label: 'Disponible', type: 'positive' },
    { id: 'ordenado', label: 'Ordenado', type: 'positive' },
    { id: 'dinamico', label: 'Dinámico', type: 'positive' },
    { id: 'cercano', label: 'Cercano', type: 'positive' },
    { id: 'califica-duro', label: 'Califica duro', type: 'negative' },
    { id: 'mucha-tarea', label: 'Mucha tarea', type: 'negative' },
    { id: 'participacion', label: 'Participación', type: 'negative' },
    { id: 'confuso', label: 'Confuso', type: 'negative' },
    { id: 'lejano', label: 'Lejano', type: 'negative' },
    { id: 'examenes-dificiles', label: 'Exámenes difíciles', type: 'negative' }
];

export default function MisReseniasModal({ open, onClose, onEdit }) {
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredRatings, setFilteredRatings] = useState([]);
    const [filters, setFilters] = useState({
        tipo: 'todos',
        ordenar: 'fecha-desc',
        materia: 'todas'
    });
    const [materias, setMaterias] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState(null);

    useEffect(() => {
        if (open) {
            loadRatings();
        }
    }, [open]);

    useEffect(() => {
        applyFilters();
    }, [ratings, filters]);

    const loadRatings = async () => {
        setLoading(true);
        try {
            const { data, error } = await ratingsAPI.getMyRatings();

            if (error) {
                console.error('Error cargando reseñas:', error);
                setToast({ message: 'Error cargando reseñas', type: 'error' });
                return;
            }

            setRatings(data || []);

            const materiasUnicas = [...new Set(
                data
                    .filter(r => r.materia)
                    .map(r => JSON.stringify({ id: r.materia.id_materia, nombre: r.materia.nombre_materia }))
            )].map(m => JSON.parse(m));

            setMaterias(materiasUnicas);
        } catch (error) {
            console.error('Error:', error);
            setToast({ message: 'Error inesperado', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...ratings];

        if (filters.tipo !== 'todos') {
            filtered = filtered.filter(r => r.tipo === filters.tipo);
        }

        if (filters.materia !== 'todas') {
            filtered = filtered.filter(r => r.materia_id === parseInt(filters.materia));
        }

        switch (filters.ordenar) {
            case 'fecha-desc':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'fecha-asc':
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'nombre-asc':
                filtered.sort((a, b) => a.nombre_entidad.localeCompare(b.nombre_entidad));
                break;
            case 'calificacion-desc':
                filtered.sort((a, b) => b.estrellas - a.estrellas);
                break;
            default:
                break;
        }

        setFilteredRatings(filtered);
    };

    const handleDelete = async (ratingId) => {
        setReviewToDelete(ratingId);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!reviewToDelete) return;

        setDeletingId(reviewToDelete);
        try {
            const { error } = await ratingsAPI.deleteRating(reviewToDelete);

            if (error) {
                setToast({ message: error.message || 'Error al eliminar', type: 'error' });
                return;
            }

            setToast({ message: 'Reseña eliminada correctamente', type: 'success' });
            setDeleteModalOpen(false);
            setReviewToDelete(null);
            loadRatings();
        } catch (error) {
            setToast({ message: 'Error inesperado', type: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (rating) => {
        const ratingData = {
            ratingId: rating.id,
            tipo: rating.tipo,
            selectedEntity: {
                id: rating.ref_id,
                nombre: rating.nombre_entidad,
                tipo: rating.tipo
            },
            selectedMateria: rating.materia ? {
                id: rating.materia.id_materia,
                nombre: rating.materia.nombre_materia
            } : null,
            rating: rating.estrellas,
            selectedTags: rating.tags || [],
            texto: rating.comentario || '',
            workload: rating.workload || 'Medio'
        };

        if (onEdit) {
            onEdit(ratingData);
        }
    };

    const goToEntity = (rating) => {
        if (rating.tipo === 'profesor') {
            navigate(`/profesores/${rating.ref_id}`);
        } else if (rating.tipo === 'mentor') {
            navigate(`/mentores/${rating.ref_id}`);
        }
        onClose();
    };

    if (!open) return null;

    const Toast = ({ message, type, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }, [onClose]);

        return (
            <div style={{
                position: 'fixed',
                top: 24,
                right: 24,
                zIndex: 10000,
                background: type === 'success' ? '#d1fae5' : '#fee2e2',
                border: `2px solid ${type === 'success' ? '#10b981' : '#ef4444'}`,
                borderRadius: 12,
                padding: '16px 20px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 320,
                animation: 'slideInRight 0.3s ease',
                fontFamily: 'Inter, sans-serif'
            }}>
                <FontAwesomeIcon
                    icon={type === 'success' ? faCheckCircle : faExclamationCircle}
                    style={{
                        fontSize: 20,
                        color: type === 'success' ? '#065f46' : '#991b1b'
                    }}
                />
                <p style={{
                    margin: 0,
                    color: type === 'success' ? '#065f46' : '#991b1b',
                    fontSize: 14,
                    fontWeight: 600,
                    flex: 1
                }}>
                    {message}
                </p>
                <button onClick={onClose} style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: type === 'success' ? '#065f46' : '#991b1b'
                }}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
        );
    };

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div onClick={onClose} style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 2000
            }} />

            <div style={{
                position: 'fixed',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 2010,
                padding: 20,
                pointerEvents: 'none',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div onClick={(e) => e.stopPropagation()} style={{
                    width: 'min(900px, 95vw)',
                    background: '#fff',
                    borderRadius: 16,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'auto'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: 24,
                        borderBottom: '2px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#13346b',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Mis Reseñas ({ratings.length})
                        </h2>
                        <button onClick={onClose} style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: 20,
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: 8,
                            borderRadius: 8,
                            transition: 'all 0.2s'
                        }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#64748b';
                                }}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Filtros */}
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '2px solid #f1f5f9',
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <FontAwesomeIcon icon={faFilter} style={{ color: '#64748b', fontSize: 14 }} />

                        <select
                            value={filters.tipo}
                            onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <option value="todos">Todos</option>
                            <option value="profesor">Profesores</option>
                            <option value="mentor">Mentores</option>
                        </select>

                        <select
                            value={filters.ordenar}
                            onChange={(e) => setFilters({ ...filters, ordenar: e.target.value })}
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #e2e8f0',
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                color: '#0f172a',
                                outline: 'none'
                            }}
                        >
                            <option value="fecha-desc">Más recientes</option>
                            <option value="fecha-asc">Más antiguas</option>
                            <option value="nombre-asc">Orden alfabético</option>
                            <option value="calificacion-desc">Mayor calificación</option>
                        </select>

                        {materias.length > 0 && (
                            <select
                                value={filters.materia}
                                onChange={(e) => setFilters({ ...filters, materia: e.target.value })}
                                style={{
                                    padding: '8px 12px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    color: '#0f172a',
                                    outline: 'none'
                                }}
                            >
                                <option value="todas">Todas las materias</option>
                                {materias.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Lista de reseñas */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 24
                    }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, marginBottom: 16, color: '#2563eb' }} />
                                <p style={{ margin: 0, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Cargando reseñas...</p>
                            </div>
                        ) : filteredRatings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px'
                                }}>
                                    <FontAwesomeIcon icon={faStar} style={{ fontSize: 32, color: '#cbd5e1' }} />
                                </div>
                                <p style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    margin: 0,
                                    color: '#64748b',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    No tienes reseñas {filters.tipo !== 'todos' ? `de ${filters.tipo}es` : ''}
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {filteredRatings.map(rating => (
                                    <div
                                        key={rating.id}
                                        style={{
                                            background: '#fff',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: 12,
                                            padding: 16,
                                            display: 'flex',
                                            gap: 16,
                                            alignItems: 'flex-start',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#2563eb';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        onClick={() => goToEntity(rating)}
                                    >
                                        {/* Icono y info principal */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    background: rating.tipo === 'profesor' ? '#2563eb' : '#0d9488',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontSize: 18,
                                                    flexShrink: 0
                                                }}>
                                                    <FontAwesomeIcon
                                                        icon={rating.tipo === 'profesor' ? faChalkboardTeacher : faGraduationCap}
                                                    />
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{
                                                        margin: 0,
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: '#0f172a',
                                                        fontFamily: 'Inter, sans-serif'
                                                    }}>
                                                        {rating.nombre_entidad}
                                                    </h3>
                                                    {rating.materia && (
                                                        <p style={{
                                                            margin: '4px 0 0 0',
                                                            fontSize: 13,
                                                            color: '#64748b',
                                                            fontWeight: 500,
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}>
                                                            <FontAwesomeIcon icon={faBook} style={{ marginRight: 6 }} />
                                                            {rating.materia.nombre_materia}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Rating */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '6px 12px',
                                                    background: '#fef3c7',
                                                    borderRadius: 8
                                                }}>
                                                    <FontAwesomeIcon icon={faStar} style={{ color: '#f59e0b', fontSize: 14 }} />
                                                    <span style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>
                                                        {rating.estrellas.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Comentario */}
                                            {rating.comentario && (
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                    color: '#475569',
                                                    lineHeight: 1.6,
                                                    maxHeight: 60,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    fontFamily: 'Inter, sans-serif'
                                                }}>
                                                    {rating.comentario}
                                                </p>
                                            )}

                                            {/* Tags */}
                                            {rating.tags && rating.tags.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {rating.tags.map(tagId => {
                                                        const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                                                        if (!tag) return null;
                                                        return (
                                                            <span
                                                                key={tagId}
                                                                style={{
                                                                    padding: '4px 10px',
                                                                    borderRadius: 6,
                                                                    fontSize: 11,
                                                                    fontWeight: 600,
                                                                    background: tag.type === 'positive' ? '#d1fae5' : '#fee2e2',
                                                                    color: tag.type === 'positive' ? '#065f46' : '#991b1b',
                                                                    fontFamily: 'Inter, sans-serif'
                                                                }}
                                                            >
                                                                {tag.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Fecha y workload */}
                                            <div style={{
                                                display: 'flex',
                                                gap: 12,
                                                fontSize: 12,
                                                color: '#94a3b8',
                                                fontWeight: 500,
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                <span>
                                                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 4 }} />
                                                    {new Date(rating.created_at).toLocaleDateString('es-UY')}
                                                </span>
                                                {rating.workload && (
                                                    <span>Carga: {rating.workload}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botones de acción */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            flexShrink: 0
                                        }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(rating);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: '2px solid #2563eb',
                                                    background: '#fff',
                                                    borderRadius: 8,
                                                    color: '#2563eb',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    transition: 'all 0.2s',
                                                    fontFamily: 'Inter, sans-serif'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#2563eb';
                                                    e.currentTarget.style.color = '#fff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#fff';
                                                    e.currentTarget.style.color = '#2563eb';
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                                Editar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(rating.id);
                                                }}
                                                disabled={deletingId === rating.id}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: '2px solid #ef4444',
                                                    background: '#fff',
                                                    borderRadius: 8,
                                                    color: '#ef4444',
                                                    cursor: deletingId === rating.id ? 'not-allowed' : 'pointer',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    transition: 'all 0.2s',
                                                    opacity: deletingId === rating.id ? 0.5 : 1,
                                                    fontFamily: 'Inter, sans-serif'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (deletingId !== rating.id) {
                                                        e.currentTarget.style.background = '#ef4444';
                                                        e.currentTarget.style.color = '#fff';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (deletingId !== rating.id) {
                                                        e.currentTarget.style.background = '#fff';
                                                        e.currentTarget.style.color = '#ef4444';
                                                    }
                                                }}
                                            >
                                                {deletingId === rating.id ? (
                                                    <>
                                                        <FontAwesomeIcon icon={faSpinner} spin />
                                                        Borrando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FontAwesomeIcon icon={faTrash} />
                                                        Borrar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
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
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: 32,
                        maxWidth: 400,
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <FontAwesomeIcon
                                icon={faExclamationCircle}
                                style={{ fontSize: 32, color: '#fff' }}
                            />
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 20,
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#13346b'
                        }}>
                            ¿Borrar reseña?
                        </h3>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 14,
                            color: '#64748b',
                            textAlign: 'center',
                            lineHeight: 1.5,
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
                                disabled={deletingId !== null}
                                style={{
                                    padding: '10px 20px',
                                    background: '#fff',
                                    color: '#64748b',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    opacity: deletingId !== null ? 0.5 : 1,
                                    fontFamily: 'Inter, sans-serif',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (deletingId === null) {
                                        e.currentTarget.style.background = '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (deletingId === null) {
                                        e.currentTarget.style.background = '#fff';
                                    }}}
                                    >
                                    Cancelar
                                    </button>
                                    <button
                                    onClick={handleConfirmDelete}
                                disabled={deletingId !== null}
                                style={{
                                    padding: '10px 20px',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                                    fontSize: 14,
                                    opacity: deletingId !== null ? 0.5 : 1,
                                    fontFamily: 'Inter, sans-serif',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (deletingId === null) {
                                        e.currentTarget.style.background = '#dc2626';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (deletingId === null) {
                                        e.currentTarget.style.background = '#ef4444';
                                    }
                                }}
                            >
                                {deletingId !== null ? 'Borrando...' : 'Sí, borrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
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
            `}</style>
        </>
    );
}