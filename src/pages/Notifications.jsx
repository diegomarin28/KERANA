import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faArrowLeft,
    faCog,
    faCheck,
    faTrash,
    faTimes,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { getNotificationIcon } from '../utils/notificationRouter';
import { useSeguidores } from '../hooks/useSeguidores';

export default function Notifications() {
    const navigate = useNavigate();
    const [followingStates, setFollowingStates] = useState({});
    const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(null);

    const {
        notificaciones,
        unreadCount,
        newSinceLastVisit,
        newSinceLastVisitMessage,
        loading,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
        cargarNotificaciones,
        marcarVisita,
    } = useNotificationsContext();

    const { seguirUsuario, dejarDeSeguir, verificarSiSigue } = useSeguidores();

    useEffect(() => {
        cargarNotificaciones();
        return () => {
            marcarVisita();
        };
    }, [cargarNotificaciones, marcarVisita]);

    useEffect(() => {
        // Usar los estados ya cargados desde el contexto
        const states = {};
        notificaciones.forEach(notif => {
            if (notif.emisor_id && notif.ya_lo_sigo !== undefined) {
                states[notif.emisor_id] = notif.ya_lo_sigo;
            }
        });
        setFollowingStates(states);
    }, [notificaciones]);

    const handleNotificationClick = async (notif) => {
        // Si NO está leída: solo marcar como leída (primer click)
        if (!notif.leida) {
            await marcarComoLeida(notif.id);
            return; // ← DETENER AQUÍ
        }

        // 🆕 Si es notificación de clase agendada → ir a página mentor
        if (notif.tipo === 'nueva_clase_agendada') {
            navigate('/mentor/courses');
            return;
        }

        // Si YA está leída: ir al perfil (segundo click)
        if (notif.emisor?.username) {
            navigate(`/user/${notif.emisor.username}`);
        }

        if (notif.tipo === 'mentor_nuevas_horas') {
            if (notif.emisor?.username) {
                navigate(`/user/${notif.emisor.username}`);
            }
            return;
        }
    };

    const handleFollowClick = async (e, notif) => {
        e.stopPropagation();

        if (!notif.emisor_id) return;

        const result = await seguirUsuario(notif.emisor_id);
        if (result.success) {
            setFollowingStates(prev => ({
                ...prev,
                [notif.emisor_id]: true
            }));
        }
    };

    const handleShowUnfollowModal = (e, notif) => {
        e.stopPropagation();
        setShowUnfollowConfirm(notif);
    };

    const handleConfirmUnfollow = async () => {
        if (!showUnfollowConfirm) return;

        const result = await dejarDeSeguir(showUnfollowConfirm.emisor_id);
        if (result.success) {
            setFollowingStates(prev => ({
                ...prev,
                [showUnfollowConfirm.emisor_id]: false
            }));
        }
        setShowUnfollowConfirm(null);
    };

    const handleDelete = async (e, notifId) => {
        e.stopPropagation();
        await eliminarNotificacion(notifId);
    };

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header */}
                <header style={headerWrapperStyle}>
                    <div style={headerStyle}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 6
                        }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FontAwesomeIcon
                                    icon={faBell}
                                    style={{ fontSize: 18, color: '#fff' }}
                                />
                            </div>
                            <h1 style={titleStyle}>Notificaciones</h1>
                        </div>
                        {unreadCount > 0 && (
                            <p style={subtitleStyle}>
                                Tenés {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                            </p>
                        )}
                    </div>
                </header>

                {/* Acciones rápidas */}
                {notificaciones.length > 0 && (
                    <>
                        {/* Banner de nuevas notificaciones */}
                        {newSinceLastVisit > 0 && (
                            <div style={newNotifsBannerStyle}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FontAwesomeIcon
                                        icon={faBell}
                                        style={{ fontSize: 14, color: '#fff' }}
                                    />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                                    {newSinceLastVisitMessage}
                                </span>
                            </div>
                        )}

                        <div style={actionsStyle}>
                            <button
                                onClick={() => navigate('/settings')}
                                style={actionButtonStyle}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.borderColor = '#2563eb';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#fff';
                                    e.target.style.borderColor = '#e5e7eb';
                                }}
                            >
                                <FontAwesomeIcon icon={faCog} style={{ fontSize: 13 }} />
                                Configurar
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={marcarTodasLeidas}
                                    style={{...actionButtonStyle, color: '#2563eb'}}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#eff6ff';
                                        e.target.style.borderColor = '#2563eb';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#fff';
                                        e.target.style.borderColor = '#e5e7eb';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: 13 }} />
                                    Marcar todas como leídas
                                </button>
                            )}
                            {notificaciones.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (confirm('¿Eliminar todas las notificaciones? Esta acción no se puede deshacer.')) {
                                            // Eliminar todas en paralelo
                                            await Promise.all(
                                                notificaciones.map(notif => eliminarNotificacion(notif.id))
                                            );
                                        }
                                    }}
                                    style={{...actionButtonStyle, color: '#ef4444'}}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#fef2f2';
                                        e.target.style.borderColor = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#fff';
                                        e.target.style.borderColor = '#e5e7eb';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 13 }} />
                                    Eliminar todas
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* Lista de notificaciones */}
                <div style={listContainerStyle}>
                    {loading ? (
                        <div style={emptyStateStyle}>
                            <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                style={{ fontSize: 40, color: '#2563eb', marginBottom: 16 }}
                            />
                            <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 500, color: '#64748b' }}>
                                Cargando notificaciones...
                            </p>
                        </div>
                    ) : notificaciones.length === 0 ? (
                        <div style={emptyStateStyle}>
                            <div style={{
                                width: 100,
                                height: 100,
                                borderRadius: '24px',
                                background: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <FontAwesomeIcon
                                    icon={faBell}
                                    style={{ fontSize: 48, color: '#fff' }}
                                />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: 28, color: '#13346b', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                                No tenés notificaciones
                            </h3>
                            <p style={{ margin: 0, fontSize: 16, color: '#64748b', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                                Cuando alguien interactúe contigo, te avisaremos aquí
                            </p>
                        </div>
                    ) : (
                        notificaciones.map((notif) => {
                            const icon = getNotificationIcon(notif.tipo);
                            const isFollowing = followingStates[notif.emisor_id];
                            const hasEmisor = !!notif.emisor_id;

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        ...notificationCardStyle,
                                        background: notif.leida ? '#fff' : '#f0f9ff',
                                        borderColor: notif.leida ? '#e5e7eb' : '#bfdbfe',
                                        cursor: notif.emisor?.username ? 'pointer' : 'default',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (notif.emisor?.username) {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 14, flex: 1, alignItems: 'center', paddingRight: 60 }}>
                                        {/* Avatar */}
                                        {notif.emisor?.foto ? (
                                            <img
                                                src={notif.emisor.foto}
                                                alt={notif.emisor.nombre}
                                                style={avatarStyle}
                                            />
                                        ) : (
                                            <div style={avatarPlaceholderStyle}>
                                                {icon}
                                            </div>
                                        )}

                                        {/* Contenido: Una línea con nombre + mensaje + tiempo */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: 14,
                                                color: '#0f172a',
                                                lineHeight: 1.5,
                                                fontWeight: notif.leida ? 500 : 600,
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                <strong>{notif.emisor?.nombre || 'Alguien'}</strong>{' '}
                                                {notif.tipo === 'nuevo_seguidor' ? 'comenzó a seguirte' : notif.mensaje}.{' '}
                                                <span style={{
                                                    fontSize: 12,
                                                    color: '#94a3b8',
                                                    fontWeight: 400,
                                                }}>
                                                    {formatTimeAgo(notif.creado_en)}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Botón Seguir/Siguiendo - Solo si tiene emisor */}
                                        {hasEmisor && !isFollowing && (
                                            <button
                                                onClick={(e) => handleFollowClick(e, notif)}
                                                style={buttonSeguirStyle}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#1877f2';
                                                    e.target.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = '#0095f6';
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                                onMouseDown={(e) => {
                                                    e.target.style.transform = 'scale(0.98)';
                                                }}
                                                onMouseUp={(e) => {
                                                    e.target.style.transform = 'scale(1.02)';
                                                }}
                                            >
                                                Seguir
                                            </button>
                                        )}
                                        {hasEmisor && isFollowing && (
                                            <button
                                                onClick={(e) => handleShowUnfollowModal(e, notif)}
                                                style={buttonSiguiendoStyle}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#dbdbdb';
                                                    e.target.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = '#efefef';
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                                onMouseDown={(e) => {
                                                    e.target.style.transform = 'scale(0.98)';
                                                }}
                                                onMouseUp={(e) => {
                                                    e.target.style.transform = 'scale(1.02)';
                                                }}
                                            >
                                                Siguiendo
                                            </button>
                                        )}
                                    </div>

                                    {/* Botón eliminar - centrado verticalmente */}
                                    <button
                                        onClick={(e) => handleDelete(e, notif.id)}
                                        style={deleteButtonStyle}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#fef2f2';
                                            e.currentTarget.style.color = '#dc2626';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#94a3b8';
                                        }}
                                        aria-label="Eliminar notificación"
                                    >
                                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 18 }} />
                                    </button>

                                    {/* Puntito azul (no leída) - al lado de la cruz */}
                                    {!notif.leida && (
                                        <div style={unreadDotStyle} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal de confirmación para dejar de seguir */}
            {showUnfollowConfirm && (
                <div
                    onClick={() => setShowUnfollowConfirm(null)}
                    style={modalOverlayStyle}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={modalContentStyle}
                    >
                        <h3 style={modalTitleStyle}>
                            ¿Dejar de seguir a {showUnfollowConfirm.emisor?.nombre}?
                        </h3>
                        <p style={modalMessageStyle}>
                            Dejarás de ver sus publicaciones en tu feed.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowUnfollowConfirm(null)}
                                style={modalButtonCancelStyle}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#dbdbdb';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#efefef';
                                }}
                                onMouseDown={(e) => {
                                    e.target.style.transform = 'scale(0.98)';
                                }}
                                onMouseUp={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmUnfollow}
                                style={modalButtonConfirmStyle}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#c92a37';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#ed4956';
                                }}
                                onMouseDown={(e) => {
                                    e.target.style.transform = 'scale(0.98)';
                                }}
                                onMouseUp={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                }}
                            >
                                Dejar de seguir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper para formatear tiempo
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
}

// ========== ESTILOS ==========

const pageStyle = {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '30px 16px',
    fontFamily: 'Inter, sans-serif'
};

const containerStyle = {
    maxWidth: 800,
    margin: '0 auto',
};

const headerWrapperStyle = {
    marginBottom: 24,
    background: '#ffffff',
    padding: '20px',
    borderRadius: 16,
    border: '2px solid #f1f5f9',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
};

const headerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',  // Centrar todo
};

const backButtonStyle = {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 12,
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 6
};

const titleStyle = {
    fontSize: 26,
    fontWeight: 700,
    color: '#13346b',
    margin: 0,
    fontFamily: 'Inter, sans-serif'
};

const subtitleStyle = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    paddingLeft: 0,  // Cambio: quitar el padding left
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center'  // Añadido
};

const actionsStyle = {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
};

const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const listContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};

const notificationCardStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#fff',
    border: '2px solid',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const avatarStyle = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e5e7eb',
    flexShrink: 0,
};

const avatarPlaceholderStyle = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#2563eb',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
};

// Botones estilo Instagram
const buttonSeguirStyle = {
    padding: '7px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#0095f6',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: '105px',
    fontFamily: 'Inter, sans-serif'
};

const buttonSiguiendoStyle = {
    padding: '7px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#000',
    background: '#efefef',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: '105px',
    fontFamily: 'Inter, sans-serif'
};

const deleteButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: 12,
    width: 28,
    height: 28,
    display: 'flex',          // Cambio de 'grid' a 'flex'
    alignItems: 'center',     // Añadido
    justifyContent: 'center', // Añadido
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    color: '#94a3b8',
    fontSize: 18,             // Reducido de 20 a 18
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,               // Añadido para asegurar centrado
};

const unreadDotStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: 46,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#0095f6',
};

const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    textAlign: 'center',
    color: '#64748b',
    background: '#fff',
    borderRadius: 16,
    border: '2px solid #f1f5f9'
};

const newNotifsBannerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '14px 20px',
    marginBottom: 16,
    background: '#eff6ff',
    border: '2px solid #bfdbfe',
    borderRadius: 12,
    color: '#1e40af',
    animation: 'slideDown 0.3s ease-out',
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 16,
};

// Modal styles
const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'fadeIn 0.2s ease',
};

const modalContentStyle = {
    background: '#ffffff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 380,
    width: '90%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: 'Inter, sans-serif'
};

const modalTitleStyle = {
    margin: '0 0 12px 0',
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif'
};

const modalMessageStyle = {
    margin: '0 0 20px 0',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#64748b',
    fontFamily: 'Inter, sans-serif'
};

const modalButtonCancelStyle = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#efefef',
    color: '#000',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'Inter, sans-serif'
};

const modalButtonConfirmStyle = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#ed4956',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'Inter, sans-serif'
};

// Animaciones
if (typeof document !== 'undefined' && !document.getElementById('notifications-page-animations')) {
    const style = document.createElement('style');
    style.id = 'notifications-page-animations';
    style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
    document.head.appendChild(style);
}