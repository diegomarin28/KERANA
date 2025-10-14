import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ratingsAPI } from '../api/Database';
import AuthModal_HacerResenia from '../components/AuthModal_HacerResenia';
import SubjectCarousel from '../components/SubjectCarousel';
import ReviewsSection from '../components/ReviewsSection';

// Este archivo va en: src/pages/ProfessorDetail.jsx
// SubjectCarousel.jsx va en: src/components/SubjectCarousel.jsx
// ReviewsSection.jsx va en: src/components/ReviewsSection.jsx

export default function ProfessorDetail() {
    const { id } = useParams();
    const [professor, setProfessor] = useState(null);
    const [materias, setMaterias] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [materiasByRating, setMateriasByRating] = useState({});
    const [selectedFilter, setSelectedFilter] = useState('todos');
    const [selectedMateria, setSelectedMateria] = useState(null);

    useEffect(() => {
        loadProfessorData();
    }, [id]);

    useEffect(() => {
        filterReviews();
    }, [reviews, selectedFilter, selectedMateria]);

    const loadProfessorData = async () => {
        try {
            setLoading(true);

            // Cargar datos del profesor
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

            // Cargar materias que dicta
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

                // Cargar promedios por materia
                await loadMateriaRatings(id, materiasList);
            }

            // Cargar reseñas
            const { data: reviewsData } = await ratingsAPI.listByProfesor(id);

            if (reviewsData) {
                setReviews(reviewsData);
                setTotalReviews(reviewsData.length);
            }

            // Cargar promedio global
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

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 40, textAlign: 'center' }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: '3px solid #f3f4f6',
                    borderTop: '3px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                }} />
                <p style={{ marginTop: 16, color: '#6b7280' }}>Cargando...</p>
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
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 40, textAlign: 'center' }}>
                <p style={{ color: '#ef4444', fontSize: 16 }}>{error}</p>
            </div>
        );
    }

    if (!professor) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 40, textAlign: 'center' }}>
                <p>Profesor no encontrado</p>
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
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            {/* Sección de información del profesor */}
            <div style={{
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
                marginBottom: 40,
                padding: 24,
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {/* Foto o iniciales */}
                <div style={{
                    minWidth: 120,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: professor.foto ? 'transparent' : '#dbeafe',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
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
                            fontWeight: 700,
                            color: '#1e40af'
                        }}>
                            {getInitials(professor.profesor_nombre)}
                        </div>
                    )}
                </div>

                {/* Información */}
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 32, marginBottom: 12 }}>
                        {professor.profesor_nombre}
                    </h1>

                    {/* Calificación global */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 20
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                display: 'flex',
                                gap: 2,
                                fontSize: 20
                            }}>
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} style={{
                                        color: i < Math.floor(averageRating) ? '#f59e0b' : i < averageRating ? '#f59e0b' : '#e5e7eb'
                                    }}>
                                        {i < Math.floor(averageRating) ? '★' : i < averageRating ? '⭐' : '☆'}
                                    </span>
                                ))}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>
                                {averageRating.toFixed(1)}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: 14 }}>
                                ({totalReviews} evaluaciones)
                            </span>
                        </div>
                    </div>

                    {materias.length > 0 && (
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, color: '#374151' }}>
                                Dicta {materias.length} materia{materias.length !== 1 ? 's' : ''}
                            </p>
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
                                            borderRadius: 20,
                                            fontSize: 13,
                                            fontWeight: 500
                                        }}
                                    >
                                        {materia.nombre}
                                    </span>
                                ))}
                                {materias.length > 5 && (
                                    <span style={{
                                        padding: '6px 12px',
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                        borderRadius: 20,
                                        fontSize: 13
                                    }}>
                                        +{materias.length - 5} más
                                    </span>
                                )}
                            </div>
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
            />

            {/* Modal de reseña con información preseleccionada */}
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
        </div>
    );
}