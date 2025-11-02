import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faUserCheck, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';
import StarDisplay from './StarDisplay';

const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: 'Muy claro' },
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
    const materiasDisplay = materias.slice(0, 2);
    const hayMasMaterias = materias.length > 2;

    return (
        <>
            <div
                onClick={irAlPerfil}
                style={{
                    width: 240,
                    height: 340,
                    padding: 12,
                    background: '#fff',
                    borderRadius: 12,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                {/* Avatar */}
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: mentor.foto ? 'transparent' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    margin: '0 auto 8px',
                    border: '2px solid #10B981'
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
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#fff'
                        }}>
                            {mentor.mentor_nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'M'}
                        </div>
                    )}
                </div>

                {/* Nombre */}
                <h3 style={{
                    margin: '0 0 3px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    textAlign: 'center',
                    color: '#13346b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {mentor.mentor_nombre}
                </h3>

                {/* Username */}
                <p style={{
                    margin: '0 0 6px 0',
                    fontSize: 11,
                    color: '#64748b',
                    textAlign: 'center',
                    fontWeight: 500,
                    height: 14
                }}>
                    {mentor.username ? `@${mentor.username}` : ''}
                </p>

                {/* Badge Mentor */}
                <div style={{
                    padding: '3px 8px',
                    background: '#d1fae5',
                    color: '#059669',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textAlign: 'center',
                    border: '1px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    marginBottom: 8
                }}>
                    <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: 10 }} />
                    <span>MENTOR</span>
                </div>

                {/* Materias - ALTURA FIJA */}
                <div style={{
                    height: 40,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8
                }}>
                    {materiasDisplay.length > 0 ? (
                        <>
                            {materiasDisplay.map((materia, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        padding: '2px 8px',
                                        borderRadius: 5,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%'
                                    }}
                                >
                                    {materia}
                                </span>
                            ))}
                            {hayMasMaterias && (
                                <span style={{
                                    fontSize: 9,
                                    color: '#64748b',
                                    fontWeight: 500
                                }}>
                                    +{materias.length - 2} más
                                </span>
                            )}
                        </>
                    ) : (
                        <span style={{ fontSize: 10, color: '#cbd5e1' }}>Sin materias</span>
                    )}
                </div>

                {/* Rating - ALTURA FIJA */}
                <div style={{
                    height: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderTop: '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9'
                }}>
                    <StarDisplay rating={estrellas} size={12} />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                    }}>
                        <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#13346b'
                        }}>
                            {estrellas > 0 ? estrellas.toFixed(1) : '—'}
                        </span>
                        {rating.cantidad > 0 && (
                            <span style={{
                                fontSize: 10,
                                color: '#64748b',
                                fontWeight: 500
                            }}>
                                ({rating.cantidad})
                            </span>
                        )}
                    </div>
                </div>

                {/* Tags - ALTURA FIJA 60px para 3 badges */}
                <div style={{
                    height: 60,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    paddingTop: 8,
                    justifyContent: 'center',
                    alignContent: 'flex-start'
                }}>
                    {rating.topTags.length > 0 ? (
                        rating.topTags.map((tagId) => {
                            const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                                <div
                                    key={tagId}
                                    style={{
                                        padding: '3px 8px',
                                        background: '#eff6ff',
                                        borderRadius: 5,
                                        fontSize: 9,
                                        color: '#1e40af',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 600,
                                        border: '1px solid #dbeafe'
                                    }}
                                >
                                    {tag.label}
                                </div>
                            );
                        })
                    ) : (
                        <span style={{ fontSize: 9, color: '#cbd5e1', marginTop: 8 }}>
                            Sin características
                        </span>
                    )}
                </div>

                {/* Botón Seguir - al final */}
                <button
                    onClick={manejarSeguir}
                    disabled={cargando}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: siguiendo ? '2px solid #10B981' : 'none',
                        background: siguiendo ? '#ffffff' : '#10B981',
                        color: siguiendo ? '#10B981' : '#ffffff',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        opacity: cargando ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                        if (!cargando) {
                            e.currentTarget.style.background = siguiendo ? '#f8fafc' : '#059669';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!cargando) {
                            e.currentTarget.style.background = siguiendo ? '#ffffff' : '#10B981';
                        }
                    }}
                >
                    <FontAwesomeIcon icon={siguiendo ? faUserCheck : faUserPlus} style={{ fontSize: 11 }} />
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
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setShowUnfollowModal(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: 16,
                            padding: '28px 24px 24px 24px',
                            maxWidth: 380,
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            textAlign: 'center',
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            width: 72,
                            height: 72,
                            margin: '0 auto 16px auto',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '3px solid #10B981'
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
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 28,
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {(mentor.mentor_nombre?.[0] || 'M').toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h3 style={{
                            margin: '0 0 20px 0',
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#13346b'
                        }}>
                            ¿Dejar de seguir a @{mentor.username}?
                        </h3>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10
                        }}>
                            <button
                                onClick={confirmarDejarDeSeguir}
                                disabled={cargando}
                                style={{
                                    padding: '12px 24px',
                                    background: '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: cargando ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!cargando) e.currentTarget.style.background = '#DC2626';
                                }}
                                onMouseLeave={(e) => {
                                    if (!cargando) e.currentTarget.style.background = '#EF4444';
                                }}
                            >
                                {cargando ? 'Procesando...' : 'Dejar de seguir'}
                            </button>
                            <button
                                onClick={() => setShowUnfollowModal(false)}
                                disabled={cargando}
                                style={{
                                    padding: '12px 24px',
                                    background: 'transparent',
                                    color: '#64748b',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: cargando ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease'
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