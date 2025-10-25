import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ratingsAPI } from '../api/database';
import ProfessorCarousel from '../components/ProfessorCarousel';
import MentorCarousel from '../components/MentorCarousel';
import NotesModal from '../components/NotesModal';
import ApunteCard from '../components/ApunteCard';

export default function SubjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [materia, setMateria] = useState(null);
    const [profesores, setProfesores] = useState([]);
    const [mentores, setMentores] = useState([]);
    const [apuntes, setApuntes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [profesoresByRating, setProfesoresByRating] = useState({});
    const [mentoresByRating, setMentoresByRating] = useState({});

    useEffect(() => {
        loadMateriaData();
    }, [id]);

    const loadMateriaData = async () => {
        try {
            setLoading(true);

            // Cargar datos de la materia
            const { data: materiaData, error: materiaError } = await supabase
                .from('materia')
                .select('*')
                .eq('id_materia', id)
                .single();

            if (materiaError || !materiaData) {
                setError('Materia no encontrada');
                return;
            }

            setMateria(materiaData);

            // Cargar profesores que dictan esta materia
            const { data: imparteData, error: imparteError } = await supabase
                .from('imparte')
                .select(`
                    id_profesor,
                    profesor_curso!inner(
                        id_profesor,
                        profesor_nombre,
                        foto
                    )
                `)
                .eq('id_materia', id);

            if (!imparteError && imparteData) {
                const profesoresList = imparteData.map(i => i.profesor_curso);
                setProfesores(profesoresList);
                await loadProfesoresRatings(profesoresList);
            }

            // Cargar mentores de esta materia
            const { data: mentorMateriaData, error: mentorMateriaError } = await supabase
                .from('mentor_materia')
                .select('id_mentor, id_materia')
                .eq('id_materia', id);

            if (!mentorMateriaError && mentorMateriaData && mentorMateriaData.length > 0) {
                const mentorIds = mentorMateriaData.map(mm => mm.id_mentor);

                const { data: mentoresData, error: mentoresError } = await supabase
                    .from('mentor')
                    .select('id_mentor, id_usuario, estrellas_mentor, contacto')
                    .in('id_mentor', mentorIds);

                if (!mentoresError && mentoresData && mentoresData.length > 0) {
                    const usuarioIds = mentoresData.map(m => m.id_usuario);
                    const { data: usuariosData, error: usuariosError } = await supabase
                        .from('usuario')
                        .select('id_usuario, nombre, foto, username')
                        .in('id_usuario', usuarioIds);

                    if (!usuariosError && usuariosData) {
                        const mentoresList = mentoresData.map(mentor => {
                            const usuario = usuariosData.find(u => u.id_usuario === mentor.id_usuario);
                            return {
                                ...mentor,
                                nombre: usuario?.nombre || 'Mentor',
                                foto: usuario?.foto,
                                username: usuario?.username
                            };
                        });

                        setMentores(mentoresList);
                        await loadMentoresRatings(mentoresList);
                    }
                }
            }

            // Cargar apuntes de esta materia (solo los primeros 12 para preview)
            const { data: apuntesData, error: apuntesError } = await supabase
                .from('apunte')
                .select(`
                    id_apunte,
                    id_usuario,
                    titulo,
                    descripcion,
                    creditos,
                    estrellas,
                    file_path,
                    thumbnail_path,
                    created_at,
                    id_materia,
                    usuario:id_usuario(nombre),
                    materia:id_materia(nombre_materia)
                `)
                .eq('id_materia', id)
                .order('created_at', { ascending: false })
                .limit(12);

            if (!apuntesError && apuntesData) {
                // Obtener IDs de todos los apuntes para contar likes
                const apIds = apuntesData.map(a => a.id_apunte);
                let likesCountMap = {};

                if (apIds.length > 0) {
                    const { data: likesData, error: likesError } = await supabase
                        .from('likes')
                        .select('id_apunte')
                        .eq('tipo', 'like')
                        .in('id_apunte', apIds);

                    if (likesError) {
                        console.error('Error cargando likes:', likesError);
                    }

                    likesData?.forEach(like => {
                        likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
                    });
                }

                // Agregar likes_count a cada apunte
                const apuntesConData = apuntesData.map(apunte => ({
                    ...apunte,
                    likes_count: likesCountMap[apunte.id_apunte] || 0
                }));

                setApuntes(apuntesConData);
            }

        } catch (err) {
            console.error('Error cargando datos de la materia:', err);
            setError('Error al cargar la información');
        } finally {
            setLoading(false);
        }
    };

    const loadProfesoresRatings = async (profesoresList) => {
        const ratings = {};

        for (const profesor of profesoresList) {
            const { data: reviewsData } = await ratingsAPI.listByProfesor(profesor.id_profesor);

            if (reviewsData) {
                const materiaReviews = reviewsData.filter(r => r.materia_id === parseInt(id));
                const sum = materiaReviews.reduce((acc, r) => acc + (r.estrellas || 0), 0);
                const avg = materiaReviews.length ? +(sum / materiaReviews.length).toFixed(1) : 0;

                const tagCounts = {};
                materiaReviews.forEach(review => {
                    if (review.tags && Array.isArray(review.tags)) {
                        review.tags.forEach(tagId => {
                            tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
                        });
                    }
                });

                const topTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([tagId]) => tagId);

                ratings[profesor.id_profesor] = {
                    promedio: avg,
                    cantidad: materiaReviews.length,
                    topTags
                };
            }
        }

        setProfesoresByRating(ratings);
    };

    const loadMentoresRatings = async (mentoresList) => {
        const ratings = {};

        for (const mentor of mentoresList) {
            const { data: reviewsData } = await ratingsAPI.listByMentor(mentor.id_mentor);

            if (reviewsData) {
                const materiaReviews = reviewsData.filter(r => r.materia_id === parseInt(id));
                const sum = materiaReviews.reduce((acc, r) => acc + (r.estrellas || 0), 0);
                const avg = materiaReviews.length ? +(sum / materiaReviews.length).toFixed(1) : 0;

                const tagCounts = {};
                materiaReviews.forEach(review => {
                    if (review.tags && Array.isArray(review.tags)) {
                        review.tags.forEach(tagId => {
                            tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
                        });
                    }
                });

                const topTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([tagId]) => tagId);

                ratings[mentor.id_mentor] = {
                    promedio: avg,
                    cantidad: materiaReviews.length,
                    topTags
                };
            }
        }

        setMentoresByRating(ratings);
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

    if (!materia) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 40, textAlign: 'center' }}>
                <p>Materia no encontrada</p>
            </div>
        );
    }

    const showBlurEffect = apuntes.length > 8;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            {/* Botón de volver */}
            <div style={{ marginBottom: 20 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e5e7eb';
                        e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#374151"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Header de la materia */}
            <div style={{
                padding: 24,
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: 40
            }}>
                <h1 style={{ margin: 0, fontSize: 32, marginBottom: 8 }}>
                    {materia.nombre_materia}
                </h1>
                {materia.semestre && (
                    <p style={{ margin: 0, fontSize: 18, color: '#6b7280' }}>
                        Semestre {materia.semestre}
                    </p>
                )}
            </div>

            {/* Carrusel de profesores */}
            {profesores.length > 0 && (
                <ProfessorCarousel
                    profesores={profesores}
                    profesoresByRating={profesoresByRating}
                />
            )}

            {/* Sección de apuntes con efecto blur */}
            <div style={{ marginBottom: 40, position: 'relative' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                        Apuntes
                    </h2>
                </div>

                {apuntes.length === 0 ? (
                    <div style={{
                        padding: 40,
                        background: '#fff',
                        borderRadius: 12,
                        border: '1px solid #e5e7eb',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                        <p style={{ margin: 0, color: '#6b7280' }}>
                            Aún no hay apuntes para esta materia
                        </p>
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 16
                        }}>
                            {apuntes.slice(0, 12).map((apunte, index) => {
                                const isInBlurZone = showBlurEffect && index >= 8;

                                return (
                                    <div
                                        key={apunte.id_apunte}
                                        style={{
                                            filter: isInBlurZone ? 'blur(4px)' : 'none',
                                            opacity: isInBlurZone ? 0.6 : 1,
                                            pointerEvents: isInBlurZone ? 'none' : 'auto'
                                        }}
                                    >
                                        <ApunteCard note={apunte} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overlay "Ver más" - SIEMPRE VISIBLE */}
                        <div
                            onClick={() => setShowNotesModal(true)}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: showBlurEffect ? '40%' : '30%',
                                background: showBlurEffect
                                    ? 'linear-gradient(to bottom, rgba(249,250,251,0) 0%, rgba(249,250,251,0.95) 40%)'
                                    : 'linear-gradient(to bottom, rgba(249,250,251,0) 0%, rgba(249,250,251,0.85) 60%)',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: 40,
                                cursor: 'pointer',
                                pointerEvents: 'auto'
                            }}
                        >
                            <div style={{
                                padding: '16px 48px',
                                background: '#2563eb',
                                color: '#fff',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 18,
                                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                            }}
                                 onMouseEnter={(e) => {
                                     e.currentTarget.style.transform = 'scale(1.05)';
                                     e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.5)';
                                 }}
                                 onMouseLeave={(e) => {
                                     e.currentTarget.style.transform = 'scale(1)';
                                     e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.4)';
                                 }}
                            >
                                <span style={{ fontSize: 24 }}>+</span>
                                <span>Ver más</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Carrusel de mentores - AL FINAL */}
            {mentores.length > 0 && (
                <MentorCarousel
                    mentores={mentores}
                    mentoresByRating={mentoresByRating}
                />
            )}

            {/* Modal de apuntes */}
            {showNotesModal && (
                <NotesModal
                    materiaId={id}
                    materiaNombre={materia.nombre_materia}
                    onClose={() => setShowNotesModal(false)}
                />
            )}
        </div>
    );
}