import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';
import StarDisplay from './StarDisplay';

// Tags disponibles para mentores (mismo que MentorCarousel)
const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: '✨ Muy claro' },
    { id: 'querido', label: '🎓 Querido por los estudiantes' },
    { id: 'apasionado', label: '🔥 Apasionado' },
    { id: 'disponible', label: '💬 Disponible' },
    { id: 'ordenado', label: '📋 Ordenado' },
    { id: 'dinamico', label: '⚡ Dinámico' },
    { id: 'cercano', label: '🤝 Cercano' },
    { id: 'paciente', label: '🧘 Paciente' },
    { id: 'buenas-explicaciones', label: '💡 Buenas explicaciones' },
    { id: 'ejemplos-claros', label: '📚 Buenos ejemplos' }
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

                // Contar tags
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

    // Mostrar máximo 2 materias
    const materiasDisplay = materias.slice(0, 2);
    const hayMasMaterias = materias.length > 2;

    return (
        <>
            <div
                onClick={irAlPerfil}
                style={{
                    minWidth: 260,
                    padding: 16,
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                {/* Foto/Iniciales */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: mentor.foto ? 'transparent' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    margin: '0 auto',
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
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#fff'
                        }}>
                            {mentor.mentor_nombre?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'M'}
                        </div>
                    )}
                </div>

                {/* Nombre */}
                <h3 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    textAlign: 'center',
                    color: '#1f2937'
                }}>
                    {mentor.mentor_nombre}
                </h3>

                {/* Username */}
                {mentor.username && (
                    <p style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#6b7280',
                        textAlign: 'center'
                    }}>
                        @{mentor.username}
                    </p>
                )}

                {/* Badge de mentor con ícono */}
                <div style={{
                    padding: '4px 12px',
                    background: '#f0fdf4',
                    color: '#15803d',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    border: '1px solid #bbf7d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4
                }}>
                    <span>🎓</span>
                    <span>Mentor</span>
                </div>

                {/* Materias (máximo 2) */}
                {materiasDisplay.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        alignItems: 'center'
                    }}>
                        {materiasDisplay.map((materia, idx) => (
                            <span
                                key={idx}
                                style={{
                                    background: '#EFF6FF',
                                    color: '#1E40AF',
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textAlign: 'center'
                                }}
                            >
                                {materia}
                            </span>
                        ))}
                        {hayMasMaterias && (
                            <span style={{
                                fontSize: 11,
                                color: '#6b7280',
                                fontWeight: 500
                            }}>
                                +{materias.length - 2} más
                            </span>
                        )}
                    </div>
                )}

                {/* Rating con estrellas proporcionales */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    paddingTop: 8,
                    borderTop: '1px solid #f3f4f6'
                }}>
                    {/* Estrellas con relleno parcial usando StarDisplay */}
                    <StarDisplay rating={estrellas} size={18} />

                    {/* Número y cantidad */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                    <span style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1f2937'
                    }}>
                        {estrellas > 0 ? estrellas.toFixed(1) : '—'}
                    </span>
                        {rating.cantidad > 0 && (
                            <span style={{
                                fontSize: 12,
                                color: '#6b7280'
                            }}>
                        ({rating.cantidad})
                      </span>
                        )}
                    </div>
                </div>



                {/* Top 3 Características */}
                {rating.topTags.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        paddingTop: 8,
                        borderTop: '1px solid #f3f4f6',
                        justifyContent: 'center'
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
                                        borderRadius: 8,
                                        fontSize: 11,
                                        color: '#1e40af',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 500,
                                        flexShrink: 0
                                    }}
                                >
                                    {tag.label}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Botón de seguir */}
                <button
                    onClick={manejarSeguir}
                    disabled={cargando}
                    style={{
                        width: '100%',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: siguiendo ? '2px solid #10B981' : '2px solid #10B981',
                        background: siguiendo ? 'white' : '#10B981',
                        color: siguiendo ? '#10B981' : 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        opacity: cargando ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        marginTop: 8
                    }}
                    onMouseEnter={(e) => {
                        if (!cargando) {
                            if (siguiendo) {
                                e.currentTarget.style.background = '#f3f4f6';
                            } else {
                                e.currentTarget.style.background = '#059669';
                            }
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!cargando) {
                            e.currentTarget.style.background = siguiendo ? 'white' : '#10B981';
                        }
                    }}
                >
                    {cargando ? 'Procesando...' : siguiendo ? '✓ Siguiendo' : 'Seguir'}
                </button>
            </div>

            {/* Modal de dejar de seguir */}
            {showUnfollowModal && (
                <div style={modalOverlayStyle} onClick={() => setShowUnfollowModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={modalAvatarContainerStyle}>
                            {mentor.foto ? (
                                <img src={mentor.foto} alt={mentor.mentor_nombre} style={modalAvatarStyle} />
                            ) : (
                                <div style={modalAvatarPlaceholderStyle}>
                                    {(mentor.mentor_nombre?.[0] || 'M').toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h3 style={modalTitleStyle}>
                            ¿Dejar de seguir a @{mentor.username}?
                        </h3>

                        <div style={modalButtonsStyle}>
                            <button onClick={confirmarDejarDeSeguir} disabled={cargando} style={modalConfirmButtonStyle}>
                                {cargando ? 'Procesando...' : 'Dejar de seguir'}
                            </button>
                            <button onClick={() => setShowUnfollowModal(false)} disabled={cargando} style={modalCancelButtonStyle}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' };
const modalContentStyle = { background: 'white', borderRadius: 16, padding: '32px 24px 24px 24px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' };
const modalAvatarContainerStyle = { width: 80, height: 80, margin: '0 auto 16px auto', borderRadius: '50%', overflow: 'hidden', border: '3px solid #10B981' };
const modalAvatarStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const modalAvatarPlaceholderStyle = { width: '100%', height: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: 'white' };
const modalTitleStyle = { margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: '#111827' };
const modalButtonsStyle = { display: 'flex', flexDirection: 'column', gap: 10 };
const modalConfirmButtonStyle = { padding: '12px 24px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' };
const modalCancelButtonStyle = { padding: '12px 24px', background: 'transparent', color: '#6B7280', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' };