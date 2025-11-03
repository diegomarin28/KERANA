import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ratingsAPI } from '../api/database';
import AuthModal_HacerResenia from '../components/AuthModal_HacerResenia';
import SubjectCarousel from '../components/SubjectCarousel';
import ReviewsSection from '../components/ReviewsSection';
import StarDisplay from '../components/StarDisplay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faChalkboardTeacher,
    faBookOpen,
    faStar,
    faLightbulb,
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

// Tags disponibles
const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: 'Muy claro', icon: faLightbulb },
    { id: 'querido', label: 'Querido', icon: faHeart },
    { id: 'apasionado', label: 'Apasionado', icon: faFire },
    { id: 'disponible', label: 'Siempre disponible', icon: faComments },
    { id: 'ordenado', label: 'Muy ordenado', icon: faClipboardList },
    { id: 'dinamico', label: 'Clases dinámicas', icon: faBolt },
    { id: 'cercano', label: 'Cercano a los alumnos', icon: faHandshake },
    { id: 'califica-duro', label: 'Califica duro', icon: faChartLine },
    { id: 'mucha-tarea', label: 'Mucha tarea', icon: faBook },
    { id: 'participacion', label: 'La participación importa', icon: faMicrophone },
    { id: 'confuso', label: 'Confuso', icon: faQuestionCircle },
    { id: 'lejano', label: 'Lejano a los alumnos', icon: faDoorOpen },
    { id: 'examenes-dificiles', label: 'Exámenes difíciles', icon: faClipboard }
];

export default function ProfessorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [professor, setProfessor] = useState(null);
    const [materias, setMaterias] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [topTags, setTopTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [materiasByRating, setMateriasByRating] = useState({});
    const [selectedFilter, setSelectedFilter] = useState('todos');
    const [selectedMateria, setSelectedMateria] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [materiasNames, setMateriasNames] = useState({});

    useEffect(() => {
        loadProfessorData();
    }, [id]);

    useEffect(() => {
        filterReviews();
    }, [reviews, selectedFilter, selectedMateria]);

    const loadProfessorData = async () => {
        try {
            setLoading(true);

            const { data: profData, error: profError } = await supabase
                .from('profesor_curso')
                .select('*')
                .eq('id_profesor', id)
                .single();

            if (profError || !profData) {
                setError('Profesor no encontrado');
                return;
            }

            setProfessor(profData);

            const { data: materiasData, error: materiasError } = await supabase
                .from('imparte')
                .select('materia(id_materia, nombre_materia)')
                .eq('id_profesor', id);

            if (!materiasError && materiasData) {
                const materiasList = materiasData.map(m => ({
                    id: m.materia.id_materia,
                    nombre: m.materia.nombre_materia
                }));
                setMaterias(materiasList);
                await loadMateriaRatings(id, materiasList);
            }

            const { data: reviewsData } = await ratingsAPI.listByProfesor(id);

            if (reviewsData) {
                setReviews(reviewsData);
                setTotalReviews(reviewsData.length);
                calculateTopTags(reviewsData);
            }

            const { data: avgData } = await ratingsAPI.getAverageForProfesor(id);

            if (avgData) {
                setAverageRating(avgData.avg);
            }
        } catch (err) {
            console.error('Error cargando datos del profesor:', err);
            setError('Error al cargar la información');
        } finally {
            setLoading(false);
        }
    };

    const calculateTopTags = (reviewsData) => {
        const tagCounts = {};

        reviewsData.forEach(review => {
            if (review.tags && Array.isArray(review.tags)) {
                review.tags.forEach(tagId => {
                    tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
                });
            }
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tagId, count]) => {
                const tagData = AVAILABLE_TAGS.find(t => t.id === tagId);
                return {
                    id: tagId,
                    label: tagData?.label || tagId,
                    icon: tagData?.icon || faLightbulb,
                    count
                };
            });

        setTopTags(sortedTags);
    };

    const loadMateriaRatings = async (profesorId, materiasList) => {
        const ratings = {};

        const { data: reviewsData } = await ratingsAPI.listByProfesor(profesorId);

        if (reviewsData) {
            for (const materia of materiasList) {
                const materiasReviews = reviewsData.filter(r => r.materia_id === materia.id);
                const sum = materiasReviews.reduce((acc, r) => acc + (r.estrellas || 0), 0);
                const avg = materiasReviews.length ? +(sum / materiasReviews.length).toFixed(1) : 0;

                ratings[materia.id] = {
                    promedio: avg,
                    cantidad: materiasReviews.length
                };
            }
        }

        setMateriasByRating(ratings);
    };

    const filterReviews = () => {
        let filtered = [...reviews];

        if (selectedMateria) {
            filtered = filtered.filter(r => r.materia_id === selectedMateria);
        }

        if (selectedFilter === 'positivas') {
            filtered = filtered.filter(r => r.estrellas >= 3);
        } else if (selectedFilter === 'negativas') {
            filtered = filtered.filter(r => r.estrellas < 3);
        }

        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setFilteredReviews(filtered);
    };

    const handleReviewAdded = (newReview) => {
        setReviews([newReview, ...reviews]);
        setShowReviewModal(false);
        loadProfessorData();
    };

    const handleReviewDeleted = () => {
        loadProfessorData();
    };

    const handleEditReview = (review) => {
        if (!materiasNames[review.materia_id]) {
            loadMateriaName(review.materia_id);
        }

        const ratingData = {
            ratingId: review.id,
            tipo: 'profesor',
            selectedEntity: {
                id: professor.id_profesor,
                nombre: professor.profesor_nombre,
                tipo: 'profesor'
            },
            selectedMateria: review.materia_id ? {
                id: review.materia_id,
                nombre: materiasNames[review.materia_id] || ''
            } : null,
            rating: review.estrellas,
            selectedTags: review.tags || [],
            texto: review.comentario || '',
            workload: review.workload || 'Medio'
        };

        setEditingReview(ratingData);
        setShowEditModal(true);
    };

    const loadMateriaName = async (materiaId) => {
        const { data } = await supabase
            .from('materia')
            .select('nombre_materia')
            .eq('id_materia', materiaId)
            .single();

        if (data) {
            setMateriasNames(prev => ({ ...prev, [materiaId]: data.nombre_materia }));
        }
    };

    const handleSaveEdit = async (updatedData) => {
        try {
            const { error } = await ratingsAPI.updateRating(
                editingReview.ratingId,
                updatedData.rating,
                updatedData.texto,
                {
                    workload: updatedData.workload,
                    tags: updatedData.selectedTags,
                    materia_id: updatedData.selectedMateria?.id
                }
            );

            if (error) {
                console.error('Error actualizando reseña:', error);
                return;
            }

            setShowEditModal(false);
            setEditingReview(null);
            loadProfessorData();
        } catch (error) {
            console.error('Error inesperado:', error);
        }
    };

    if (loading) {
        return (
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: 40,
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    border: '4px solid #f3f4f6',
                    borderTop: '4px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                }} />
                <p style={{
                    marginTop: 20,
                    color: '#64748b',
                    fontSize: 15,
                    fontWeight: 500
                }}>
                    Cargando información del profesor...
                </p>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: 40,
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 20px',
                    background: '#fee2e2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FontAwesomeIcon
                        icon={faChalkboardTeacher}
                        style={{ fontSize: 32, color: '#dc2626' }}
                    />
                </div>
                <p style={{
                    color: '#dc2626',
                    fontSize: 18,
                    fontWeight: 600,
                    margin: 0
                }}>
                    {error}
                </p>
            </div>
        );
    }

    if (!professor) {
        return (
            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: 40,
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif'
            }}>
                <p style={{ fontSize: 16, fontWeight: 500, color: '#64748b' }}>
                    Profesor no encontrado
                </p>
            </div>
        );
    }

    const getInitials = (nombre) => {
        const parts = nombre.split(' ').filter(p => p.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return nombre.slice(0, 2).toUpperCase();
    };

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '20px',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Botón de volver */}
            <div style={{ marginBottom: 20 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#fff',
                        border: '2px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateX(-4px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                >
                    <FontAwesomeIcon
                        icon={faArrowLeft}
                        style={{ fontSize: 16, color: '#64748b' }}
                    />
                </button>
            </div>

            {/* Sección de información del profesor */}
            <div style={{
                display: 'flex',
                gap: 28,
                alignItems: 'flex-start',
                marginBottom: 40,
                padding: 28,
                background: '#fff',
                borderRadius: 16,
                border: '2px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                {/* Foto o iniciales */}
                <div style={{
                    minWidth: 120,
                    width: 120,
                    height: 120,
                    borderRadius: 16,
                    background: professor.foto ? 'transparent' : '#2563eb',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: professor.foto ? '2px solid #e5e7eb' : 'none'
                }}>
                    {professor.foto ? (
                        <img
                            src={professor.foto}
                            alt={professor.profesor_nombre}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{
                            fontSize: 48,
                            fontWeight: 800,
                            color: '#fff'
                        }}>
                            {getInitials(professor.profesor_nombre)}
                        </div>
                    )}
                </div>

                {/* Información */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12
                    }}>
                        <FontAwesomeIcon
                            icon={faChalkboardTeacher}
                            style={{ fontSize: 24, color: '#2563eb' }}
                        />
                        <h1 style={{
                            margin: 0,
                            fontSize: 32,
                            fontWeight: 800,
                            color: '#13346b'
                        }}>
                            {professor.profesor_nombre}
                        </h1>
                    </div>

                    {/* Calificación global y Top Tags */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 20,
                        marginBottom: 20,
                        flexWrap: 'wrap'
                    }}>
                        {/* Calificación */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 14px',
                            background: '#f8fafc',
                            borderRadius: 12,
                            border: '2px solid #e5e7eb'
                        }}>
                            <FontAwesomeIcon
                                icon={faStar}
                                style={{ fontSize: 18, color: '#f59e0b' }}
                            />
                            <StarDisplay rating={averageRating} size={20} />
                            <span style={{
                                fontWeight: 700,
                                fontSize: 18,
                                color: '#0f172a'
                            }}>
                                {averageRating.toFixed(1)}
                            </span>
                            <span style={{
                                color: '#64748b',
                                fontSize: 14,
                                fontWeight: 500
                            }}>
                                ({totalReviews} {totalReviews === 1 ? 'evaluación' : 'evaluaciones'})
                            </span>
                        </div>

                        {/* Top 3 Tags */}
                        {topTags.length > 0 && topTags.map((tag) => (
                            <div
                                key={tag.id}
                                style={{
                                    padding: '8px 14px',
                                    background: '#eff6ff',
                                    color: '#1e40af',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    border: '2px solid #bfdbfe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <FontAwesomeIcon icon={tag.icon} style={{ fontSize: 14 }} />
                                <span>{tag.label}</span>
                                <span style={{
                                    color: '#60a5fa',
                                    fontSize: 13,
                                    fontWeight: 500
                                }}>
                                    ({tag.count})
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Materias */}
                    {materias.length > 0 ? (
                        <div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 10
                            }}>
                                <FontAwesomeIcon
                                    icon={faBookOpen}
                                    style={{ fontSize: 16, color: '#64748b' }}
                                />
                                <p style={{
                                    fontWeight: 600,
                                    margin: 0,
                                    fontSize: 15,
                                    color: '#64748b'
                                }}>
                                    Dicta {materias.length} {materias.length === 1 ? 'materia' : 'materias'}
                                </p>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8
                            }}>
                                {materias.slice(0, 5).map(materia => (
                                    <span
                                        key={materia.id}
                                        style={{
                                            padding: '6px 12px',
                                            background: '#dbeafe',
                                            color: '#1e40af',
                                            borderRadius: 10,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            border: '1px solid #bfdbfe'
                                        }}
                                    >
                                        {materia.nombre}
                                    </span>
                                ))}
                                {materias.length > 5 && (
                                    <span style={{
                                        padding: '6px 12px',
                                        background: '#f8fafc',
                                        color: '#64748b',
                                        borderRadius: 10,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        +{materias.length - 5} más
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '16px 20px',
                            background: '#f8fafc',
                            border: '2px dashed #cbd5e1',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <FontAwesomeIcon
                                icon={faBookOpen}
                                style={{ fontSize: 20, color: '#94a3b8' }}
                            />
                            <p style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#64748b'
                            }}>
                                Este profesor aún no tiene materias asignadas
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Carrusel de materias */}
            {materias.length > 0 && (
                <SubjectCarousel
                    materias={materias}
                    materiasByRating={materiasByRating}
                />
            )}

            {/* Sección de reseñas */}
            <ReviewsSection
                reviews={filteredReviews}
                materias={materias}
                selectedFilter={selectedFilter}
                selectedMateria={selectedMateria}
                onFilterChange={setSelectedFilter}
                onMateriaChange={setSelectedMateria}
                onAddReview={() => setShowReviewModal(true)}
                onReviewDeleted={handleReviewDeleted}
                onEditReview={handleEditReview}
            />

            {/* Modal de reseña */}
            {showReviewModal && (
                <AuthModal_HacerResenia
                    open={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSave={handleReviewAdded}
                    preSelectedEntity={{
                        id: professor.id_profesor,
                        nombre: professor.profesor_nombre,
                        tipo: 'profesor'
                    }}
                />
            )}

            {/* Modal de edición */}
            {showEditModal && editingReview && (
                <AuthModal_HacerResenia
                    open={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingReview(null);
                    }}
                    onSave={handleSaveEdit}
                    preSelectedEntity={editingReview.selectedEntity}
                    initialData={editingReview}
                    isEditing={true}
                />
            )}
        </div>
    );
}