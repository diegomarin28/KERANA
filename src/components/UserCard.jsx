import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';


export const UserCard = ({ usuario }) => {
    const [siguiendo, setSiguiendo] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const navigate = useNavigate();
    const { seguirUsuario, dejarDeSeguir, obtenerMiUsuarioId } = useSeguidores();

    useEffect(() => {
        verificarSiSigo();
    }, [usuario.id_usuario]);

    const verificarSiSigo = async () => {
        try {
            const miId = await obtenerMiUsuarioId();
            if (!miId) return;

            const { data } = await supabase
                .from('seguidores')
                .select('id')
                .eq('seguidor_id', miId)
                .eq('seguido_id', usuario.id_usuario)
                .eq('estado', 'activo')
                .maybeSingle();

            setSiguiendo(!!data);
        } catch (error) {
            console.error('Error verificando seguimiento:', error);
        }
    };

    const manejarSeguir = async (e) => {
        e.stopPropagation();

        // Si ya está siguiendo, mostrar modal
        if (siguiendo) {
            setShowUnfollowModal(true);
            return;
        }

        // Si no está siguiendo, seguir directamente
        try {
            setCargando(true);
            const resultado = await seguirUsuario(usuario.id_usuario);
            if (resultado.success) {
                setSiguiendo(true);
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
            const resultado = await dejarDeSeguir(usuario.id_usuario);
            if (resultado.success) {
                setSiguiendo(false);
            }
        } catch (error) {
            console.error('Error al dejar de seguir:', error);
        } finally {
            setCargando(false);
            setShowUnfollowModal(false);
        }
    };

    const irAlPerfil = () => {
        navigate(`/user/${usuario.username || usuario.id_usuario}`);
    };

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
                    {usuario.foto ? (
                        <img
                            src={usuario.foto}
                            alt={usuario.nombre}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #E5E7EB'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 24,
                            fontWeight: 700,
                            border: '2px solid #E5E7EB'
                        }}>
                            {(usuario.nombre?.[0] || 'U').toUpperCase()}
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            margin: "0 0 4px 0",
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#111827"
                        }}>
                            {usuario.nombre}
                        </h3>
                        <p style={{
                            margin: "0 0 8px 0",
                            color: "#6B7280",
                            fontSize: 14
                        }}>
                            @{usuario.username}
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{
                                fontSize: 12,
                                color: "#6B7280"
                            }}>
                                {usuario.seguidores_count || 0} seguidores
                            </span>
                            {usuario.es_mentor && (
                                <span style={{
                                    background: "#10B981",
                                    color: "white",
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 600
                                }}>
                                    Mentor
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={manejarSeguir}
                    disabled={cargando}
                    style={{
                        width: '100%',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #2563EB',
                        background: siguiendo ? 'white' : '#2563EB',
                        color: siguiendo ? '#2563EB' : 'white',
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

            {/* Modal de confirmación */}
            {showUnfollowModal && (
                <div
                    style={modalOverlayStyle}
                    onClick={() => setShowUnfollowModal(false)}
                >
                    <div
                        style={modalContentStyle}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={modalAvatarContainerStyle}>
                            {usuario.foto ? (
                                <img
                                    src={usuario.foto}
                                    alt={usuario.nombre}
                                    style={modalAvatarStyle}
                                />
                            ) : (
                                <div style={modalAvatarPlaceholderStyle}>
                                    {(usuario.nombre?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h3 style={modalTitleStyle}>
                            ¿Dejar de seguir a @{usuario.username}?
                        </h3>

                        <div style={modalButtonsStyle}>
                            <button
                                onClick={confirmarDejarDeSeguir}
                                disabled={cargando}
                                style={modalConfirmButtonStyle}
                            >
                                {cargando ? 'Procesando...' : 'Dejar de seguir'}
                            </button>
                            <button
                                onClick={() => setShowUnfollowModal(false)}
                                disabled={cargando}
                                style={modalCancelButtonStyle}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Estilos del modal
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
    background: 'white',
    borderRadius: 16,
    padding: '32px 24px 24px 24px',
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
};

const modalAvatarContainerStyle = {
    width: 80,
    height: 80,
    margin: '0 auto 16px auto',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #E5E7EB',
};

const modalAvatarStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const modalAvatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
};

const modalTitleStyle = {
    margin: '0 0 24px 0',
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
};

const modalButtonsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};

const modalConfirmButtonStyle = {
    padding: '12px 24px',
    background: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const modalCancelButtonStyle = {
    padding: '12px 24px',
    background: 'transparent',
    color: '#6B7280',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};