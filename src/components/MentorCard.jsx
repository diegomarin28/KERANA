import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faUserCheck, faUserPlus, faStar } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';
import StarDisplay from './StarDisplay';

const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: 'Muy claro' },
    { id: 'participacion', label: 'Participación' },
    { id: 'califica-duro', label: 'Califica duro' },
    { id: 'lejano', label: 'Lejano' },
    { id: 'confuso', label: 'Confuso' },
    { id: 'mucha-tarea', label: 'Mucha tarea' },
    { id: 'querido', label: 'Querido' },
    { id: 'apasionado', label: 'Apasionado' },
    { id: 'disponible', label: 'Disponible' },
    { id: 'ordenado', label: 'Ordenado' },
    { id: 'dinamico', label: 'Dinámico' },
    { id: 'cercano', label: 'Cercano' },
    { id: 'paciente', label: 'Paciente' },
    { id: 'buenas-explicaciones', label: 'Buenas explicaciones' },
    { id: 'ejemplos-claros', label: 'Buenos ejemplos' }
];

export function MentorCard({ mentor }) {
    const [siguiendo, setSiguiendo] = useState(mentor.siguiendo || false);
    const [cargando, setCargando] = useState(false);
    const [materias, setMaterias] = useState(mentor.materias || []);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const [rating, setRating] = useState({ promedio: 0, cantidad: 0, topTags: [] });
    const navigate = useNavigate();
    const { toggleSeguir } = useSeguidores();

    useEffect(() => {
        if (!mentor.materias || mentor.materias.length === 0) {
            cargarMaterias();
        }
        cargarRating();
    }, [mentor.id_mentor]);

    const cargarMaterias = async () => {
        try {
            const { data } = await supabase
                .from('mentor_materia')
                .select('materia(nombre_materia)')
                .eq('id_mentor', mentor.id_mentor);

            if (data) {
                setMaterias(data.map(m => m.materia.nombre_materia));
            }
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    };

    const cargarRating = async () => {
        try {
            const { data: reviewsData } = await supabase
                .from('rating')
                .select('estrellas, tags')
                .eq('tipo', 'mentor')
                .eq('ref_id', mentor.id_mentor);

            if (reviewsData && reviewsData.length > 0) {
                const sum = reviewsData.reduce((acc, r) => acc + (r.estrellas || 0), 0);
                const avg = +(sum / reviewsData.length).toFixed(1);

                const tagCounts = {};
                reviewsData.forEach(review => {
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

                setRating({
                    promedio: avg,
                    cantidad: reviewsData.length,
                    topTags
                });
            }
        } catch (error) {
            console.error('Error cargando rating:', error);
        }
    };

    const manejarSeguir = async (e) => {
        e.stopPropagation();

        if (siguiendo) {
            setShowUnfollowModal(true);
            return;
        }

        try {
            setCargando(true);
            const resultado = await toggleSeguir(mentor.id_usuario, siguiendo);
            if (resultado.success) {
                setSiguiendo(!siguiendo);
            }
        } catch (error) {
            console.error('Error al seguir:', error);
        } finally {
            setCargando(false);
        }
    };

    const confirmarDejarDeSeguir = async () => {
        try {
            setCargando(true);
            const resultado = await toggleSeguir(mentor.id_usuario, siguiendo);
            if (resultado.success) {
                setSiguiendo(!siguiendo);
            }
        } catch (error) {
            console.error('Error al dejar de seguir:', error);
        } finally {
            setCargando(false);
            setShowUnfollowModal(false);
        }
    };

    const irAlPerfil = () => {
        navigate(`/mentor/${mentor.username || mentor.id_mentor}`);
    };

    const estrellas = mentor.estrellas_mentor || mentor.rating_promedio || rating.promedio || 0;
    const materiasDisplay = materias.slice(0, 3);
    const hayMasMaterias = materias.length > 3;

    return (
        <>
            <div
                onClick={irAlPerfil}
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    height: '100%'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(13, 148, 136, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#0d9488';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#f1f5f9';
                }}
            >
                {/* Avatar centrado arriba */}
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: mentor.foto ? 'transparent' : '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    margin: '0 auto 14px',
                    border: '3px solid #0d9488',
                    flexShrink: 0
                }}>
                    {mentor.foto ? (
                        <img
                            src={mentor.foto}
                            alt={mentor.mentor_nombre}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#fff'
                        }}>
                            {mentor.mentor_nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'M'}
                        </div>
                    )}
                </div>

                {/* Nombre centrado */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {mentor.mentor_nombre}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#64748b',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        @{mentor.username}
                    </div>
                </div>

                {/* Rating centrado - SIEMPRE mostrar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginBottom: '14px'
                }}>
                    <FontAwesomeIcon
                        icon={faStar}
                        style={{
                            color: estrellas > 0 ? '#f59e0b' : '#e5e7eb',
                            fontSize: '14px'
                        }}
                    />
                    <span style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: estrellas > 0 ? '#0f172a' : '#94a3b8'
                    }}>
                        {estrellas.toFixed(1)}
                    </span>
                    {rating.cantidad > 0 && (
                        <span style={{
                            fontSize: '12px',
                            color: '#64748b',
                            fontWeight: 500
                        }}>
                            ({rating.cantidad})
                        </span>
                    )}
                </div>

                {/* Materias */}
                {materiasDisplay.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        justifyContent: 'center',
                        marginBottom: '12px'
                    }}>
                        {materiasDisplay.map((materia, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '6px 12px',
                                    background: '#ccfbf1',
                                    color: '#0d9488',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    border: '1px solid #99f6e4'
                                }}
                            >
                                {materia}
                            </div>
                        ))}
                        {hayMasMaterias && (
                            <div
                                style={{
                                    padding: '6px 12px',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}
                            >
                                +{materias.length - 3}
                            </div>
                        )}
                    </div>
                )}

                {/* Tags (características) */}
                {rating.topTags && rating.topTags.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        justifyContent: 'center',
                        marginBottom: '0px'
                    }}>
                        {rating.topTags.map((tagId) => {
                            const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                                <div
                                    key={tagId}
                                    style={{
                                        padding: '4px 10px',
                                        background: '#eff6ff',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        color: '#1e40af',
                                        fontWeight: 600,
                                        border: '1px solid #dbeafe'
                                    }}
                                >
                                    {tag.label}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Botón Seguir */}
                <button
                    onClick={manejarSeguir}
                    disabled={cargando}
                    style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        border: siguiendo ? '2px solid #0d9488' : 'none',
                        background: siguiendo ? '#ffffff' : '#0d9488',
                        color: siguiendo ? '#0d9488' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        opacity: cargando ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                        if (!cargando) {
                            e.currentTarget.style.background = siguiendo ? '#f8fafc' : '#14b8a6';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!cargando) {
                            e.currentTarget.style.background = siguiendo ? '#ffffff' : '#0d9488';
                        }
                    }}
                >
                    <FontAwesomeIcon icon={siguiendo ? faUserCheck : faUserPlus} style={{ fontSize: '14px' }} />
                    {cargando ? 'Procesando...' : siguiendo ? 'Siguiendo' : 'Seguir'}
                </button>
            </div>

            {/* Modal dejar de seguir */}
            {showUnfollowModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setShowUnfollowModal(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '32px 28px',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 20px auto',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid #0d9488'
                        }}>
                            {mentor.foto ? (
                                <img
                                    src={mentor.foto}
                                    alt={mentor.mentor_nombre}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: '#0d9488',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {(mentor.mentor_nombre?.[0] || 'M').toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h3 style={{
                            margin: '0 0 24px 0',
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#0f172a'
                        }}>
                            ¿Dejar de seguir a @{mentor.username}?
                        </h3>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <button
                                onClick={confirmarDejarDeSeguir}
                                disabled={cargando}
                                style={{
                                    padding: '14px 24px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: cargando ? 0.6 : 1,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    if (!cargando) e.currentTarget.style.background = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                    if (!cargando) e.currentTarget.style.background = '#ef4444';
                                }}
                            >
                                {cargando ? 'Procesando...' : 'Dejar de seguir'}
                            </button>
                            <button
                                onClick={() => setShowUnfollowModal(false)}
                                disabled={cargando}
                                style={{
                                    padding: '14px 24px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '15px',
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    if (!cargando) e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    if (!cargando) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}