import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { ratingsAPI } from '../api/Database';
import ProfessorCarousel from '../components/ProfessorCarousel';
import MentorCarousel from '../components/MentorCarousel';
import NotesModal from '../components/NotesModal';

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
                .select(`
                    id_mentor,
                    mentor!inner(
                        id_mentor,
                        id_usuario,
                        estrellas_mentor,
                        contacto,
                        usuario!inner(
                            nombre,
                            foto,
                            username
                        )
                    )
                `)
                .eq('id_materia', id);

            if (!mentorMateriaError && mentorMateriaData) {
                const mentoresList = mentorMateriaData.map(m => ({
                    ...m.mentor,
                    nombre: m.mentor.usuario?.nombre || 'Mentor',
                    foto: m.mentor.usuario?.foto,
                    username: m.mentor.usuario?.username
                }));
                setMentores(mentoresList);
                await loadMentoresRatings(mentoresList);
            }

            // Cargar apuntes de esta materia (solo los primeros para preview)
            const { data: apuntesData, error: apuntesError } = await supabase
                .from('apunte')
                .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    file_path,
                    created_at,
                    id_usuario,
                    usuario:id_usuario(nombre)
                `)
                .eq('id_materia', id)
                .order('created_at', { ascending: false })
                .limit(8);

            if (!apuntesError && apuntesData) {
                // Generar signed URLs para thumbnails
                const apuntesConUrls = await Promise.all(
                    apuntesData.map(async (apunte) => {
                        let signedUrl = null;
                        if (apunte.file_path) {
                            const { data: signedData, error: signedError } = await supabase.storage
                                .from('apuntes')
                                .createSignedUrl(apunte.file_path, 3600);
                            if (!signedError && signedData) {
                                signedUrl = signedData.signedUrl;
                            }
                        }
                        return { ...apunte, signedUrl };
                    })
                );
                setApuntes(apuntesConUrls);
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
                // Filtrar solo reviews de esta materia
                const materiaReviews = reviewsData.filter(r => r.materia_id === parseInt(id));
                const sum = materiaReviews.reduce((acc, r) => acc + (r.estrellas || 0), 0);
                const avg = materiaReviews.length ? +(sum / materiaReviews.length).toFixed(1) : 0;

                // Calcular top 3 tags
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

            {/* Carrusel de mentores */}
            {mentores.length > 0 && (
                <MentorCarousel
                    mentores={mentores}
                    mentoresByRating={mentoresByRating}
                />
            )}

            {/* Sección de apuntes */}
            <div style={{ marginBottom: 40 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                        Apuntes
                    </h2>
                    <button
                        onClick={() => setShowNotesModal(true)}
                        style={{
                            padding: '10px 20px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 14,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1e40af';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                        }}
                    >
                        Ver todos los apuntes
                    </button>
                </div>

                {/* Grid de apuntes (preview) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 16
                }}>
                    {apuntes.slice(0, 8).map((apunte) => (
                        <div
                            key={apunte.id_apunte}
                            onClick={() => navigate(`/apuntes/${apunte.id_apunte}`)}
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                padding: 12,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: '100%',
                                aspectRatio: '3/4',
                                background: '#f3f4f6',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 32
                            }}>
                                📄
                            </div>
                            <h4 style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {apunte.titulo}
                            </h4>
                            <div style={{
                                fontSize: 12,
                                color: '#6b7280'
                            }}>
                                Por {apunte.usuario?.nombre || 'Anónimo'}
                            </div>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#2563eb'
                            }}>
                                {apunte.creditos} 💰
                            </div>
                        </div>
                    ))}
                </div>

                {apuntes.length === 0 && (
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
                )}
            </div>

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