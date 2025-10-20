import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';

export function MentorCard({ mentor }) {
    // ✅ Inicializar con el estado que viene de la búsqueda
    const [siguiendo, setSiguiendo] = useState(mentor.siguiendo || false);
    const [cargando, setCargando] = useState(false);
    const [materias, setMaterias] = useState(mentor.materias || []);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const navigate = useNavigate();
    const { seguirUsuario, dejarDeSeguir } = useSeguidores();
    const { toggleSeguir } = useSeguidores();

    // ✅ Solo cargar materias si no vienen en mentor
    useEffect(() => {
        if (!mentor.materias || mentor.materias.length === 0) {
            cargarMaterias();
        }
    }, [mentor.id_mentor]);

    const cargarMaterias = async () => {
        try {
            const { data } = await supabase
                .from('mentor_materia')
                .select('materia(nombre_materia)')
                .eq('id_mentor', mentor.id_mentor)
                .limit(3);

            if (data) {
                setMaterias(data.map(m => m.materia.nombre_materia));
            }
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    };

// Y en manejarSeguir:
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

    const estrellas = mentor.estrellas_mentor || mentor.rating_promedio || 0;

    return (
        <>
            <div
                onClick={irAlPerfil}
                style={{
                    background: "white",
                    borderRadius: 12,
                    padding: 20,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    e.currentTarget.style.transform = "translateY(0)";
                }}
            >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                    {mentor.foto ? (
                        <img
                            src={mentor.foto}
                            alt={mentor.mentor_nombre}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid #10B981'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 24,
                            fontWeight: 700,
                            border: '3px solid #D1FAE5'
                        }}>
                            {(mentor.mentor_nombre?.[0] || 'M').toUpperCase()}
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#111827"
                            }}>
                                {mentor.mentor_nombre}
                            </h3>
                            <span style={{
                                background: "#10B981",
                                color: "white",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600
                            }}>
                                🎓 MENTOR
                            </span>
                        </div>
                        {mentor.username && (
                            <p style={{
                                margin: "0 0 8px 0",
                                color: "#6B7280",
                                fontSize: 14
                            }}>
                                @{mentor.username}
                            </p>
                        )}

                        {estrellas > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <span style={{ color: '#F59E0B', fontSize: 16 }}>⭐</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                    {estrellas.toFixed(1)}
                                </span>
                                <span style={{ fontSize: 12, color: '#6B7280' }}>
                                    calificación
                                </span>
                            </div>
                        )}

                        {materias.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {materias.map((materia, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            background: '#EFF6FF',
                                            color: '#1E40AF',
                                            padding: '3px 8px',
                                            borderRadius: 6,
                                            fontSize: 11,
                                            fontWeight: 600
                                        }}
                                    >
                                        {materia}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={manejarSeguir}
                    disabled={cargando}
                    style={{
                        width: '100%',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #10B981',
                        background: siguiendo ? 'white' : '#10B981',
                        color: siguiendo ? '#10B981' : 'white',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        opacity: cargando ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                    }}
                >
                    {cargando ? 'Procesando...' : siguiendo ? 'Siguiendo' : 'Seguir'}
                </button>
            </div>

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