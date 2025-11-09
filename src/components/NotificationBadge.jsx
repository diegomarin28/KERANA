import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useTabBadge } from '../hooks/useTabBadge';
import { useSeguidores } from '../hooks/useSeguidores';

export default function NotificationBadge({ inHero = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(null);
    const dropdownRef = useRef(null);
    const [followingStates, setFollowingStates] = useState({});
    const navigate = useNavigate();
    const prevUnreadCount = useRef(0);
    const autoMarkTimerRef = useRef(null);

    const {
        notificaciones,
        unreadCount,
        loading,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
    } = useNotificationsContext();

    const { seguirUsuario, dejarDeSeguir } = useSeguidores();

    useTabBadge(unreadCount);

    // 🔍 DEBUG temporal
    useEffect(() => {
        console.log('📊 NotificationBadge Debug:', {
            unreadCount,
            notificaciones: notificaciones?.length,
            loading,
            inHero
        });
    }, [unreadCount, notificaciones, loading, inHero]);

    useEffect(() => {
        if (unreadCount > prevUnreadCount.current && prevUnreadCount.current !== 0) {
            setShouldAnimate(true);
            setTimeout(() => setShouldAnimate(false), 600);
        }
        prevUnreadCount.current = unreadCount;
    }, [unreadCount]);

    useEffect(() => {
        if (isOpen && notificaciones.length === 0) {
            setIsOpen(false);
        }
    }, [notificaciones.length, isOpen]);

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            autoMarkTimerRef.current = setTimeout(() => {
                console.log('⏰ 15s transcurridos, marcando todas como leídas');
                marcarTodasLeidas();
            }, 15000);
        } else {
            if (autoMarkTimerRef.current) {
                clearTimeout(autoMarkTimerRef.current);
                autoMarkTimerRef.current = null;
            }
        }

        return () => {
            if (autoMarkTimerRef.current) {
                clearTimeout(autoMarkTimerRef.current);
            }
        };
    }, [isOpen, unreadCount, marcarTodasLeidas]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    useEffect(() => {
        const states = {};
        notificaciones.forEach(notif => {
            if (notif.tipo === 'nuevo_seguidor' && notif.emisor_id) {
                states[notif.emisor_id] = notif.ya_lo_sigo ?? false;
            }
        });
        setFollowingStates(states);
    }, [notificaciones]);

    const handleFollowBack = async (e, notif) => {
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

    const handleNotificationClick = async (e, notif) => {
        e.stopPropagation();

        if (!notif.leida) {
            await marcarComoLeida(notif.id);
            return;
        }

        // 🆕 Si es notificación de clase agendada → ir a página mentor
        if (notif.tipo === 'nueva_clase_agendada') {
            setIsOpen(false);
            navigate('/mentor/courses');
            return;
        }

        if (notif.emisor?.username) {
            setIsOpen(false);
            navigate(`/user/${notif.emisor.username}`);
        }
        if (notif.tipo === 'mentor_nuevas_horas') {
            if (notif.emisor?.username) {
                navigate(`/user/${notif.emisor.username}`);
            }
            return;
        }
    };

    const handleShowUnfollowModal = (e, notif) => {
        e.stopPropagation();
        setShowUnfollowConfirm(notif);
    };

    const handleCancelUnfollow = () => {
        setShowUnfollowConfirm(null);
    };

    const handleDelete = async (e, notifId) => {
        e.stopPropagation();
        await eliminarNotificacion(notifId);
    };

    const handleVerTodas = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarcarTodas = async () => {
        await marcarTodasLeidas();
    };

    const handleSettings = () => {
        setIsOpen(false);
        navigate('/settings');
    };

    const recentNotifications = notificaciones.slice(0, 5);

    // 🎨 ESTILOS ADAPTATIVOS
    const buttonStyle = inHero
        ? {
            // EN HERO (azul oscuro)
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
        }
        : {
            // AL SCROLLEAR (hielo)
            background: '#ffffff',
            border: '2px solid #13346b',
            color: '#13346b',
        };

    const badgeStyle = inHero
        ? {
            // EN HERO
            border: '2px solid #13346b',
        }
        : {
            // AL SCROLLEAR
            border: '2px solid #ffffff',
        };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Botón Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={shouldAnimate ? 'badge-bounce' : ''}
                style={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    ...buttonStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    if (inHero) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    } else {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#2563eb';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = buttonStyle.background;
                    e.currentTarget.style.borderColor = inHero ? 'rgba(255,255,255,0.2)' : '#13346b';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <path
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 20,
                        height: 20,
                        padding: '0 6px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                        zIndex: 2,
                        ...badgeStyle,
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Modal */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 50,
                    right: 0,
                    width: 420,
                    maxHeight: 500,
                    background: '#ffffff',
                    borderRadius: 12,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    zIndex: 9999,
                    animation: 'slideDown 0.2s ease-out',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f9fafb',
                    }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0f172a',
                        }}>
                            Notificaciones
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarcarTodas}
                                style={{
                                    padding: '4px 12px',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#2563eb',
                                    background: 'none',
                                    border: '1px solid #2563eb',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#eff6ff';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                }}
                            >
                                Marcar todas
                            </button>
                        )}
                    </div>

                    {/* Lista de notificaciones */}
                    <div style={{
                        maxHeight: 380,
                        overflowY: 'auto',
                    }}>
                        {loading ? (
                            <div style={{
                                padding: 40,
                                textAlign: 'center',
                                color: '#64748b',
                            }}>
                                <div style={{
                                    width: 30,
                                    height: 30,
                                    border: '3px solid #f3f4f6',
                                    borderTop: '3px solid #2563eb',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                    margin: '0 auto 12px',
                                }} />
                                Cargando...
                            </div>
                        ) : recentNotifications.length === 0 ? (
                            <div style={{
                                padding: 40,
                                textAlign: 'center',
                                color: '#64748b',
                            }}>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
                                <p style={{ margin: 0, fontSize: 14 }}>
                                    No tenés notificaciones
                                </p>
                            </div>
                        ) : (
                            recentNotifications.map((notif) => {
                                const isFollowerNotif = notif.tipo === 'nuevo_seguidor';
                                const isFollowing = followingStates[notif.emisor_id];

                                return (
                                    <div
                                        key={notif.id}
                                        onClick={(e) => handleNotificationClick(e, notif)}
                                        style={{
                                            position: 'relative',
                                            padding: '12px 20px',
                                            borderBottom: '1px solid #f3f4f6',
                                            background: notif.leida ? '#fff' : '#f0f9ff',
                                            cursor: isFollowerNotif ? 'pointer' : 'default',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isFollowerNotif) {
                                                e.currentTarget.style.background = notif.leida ? '#f8fafc' : '#e0f2fe';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = notif.leida ? '#fff' : '#f0f9ff';
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingRight: 30 }}>
                                            {/* Avatar */}
                                            {notif.emisor?.foto ? (
                                                <img
                                                    src={notif.emisor.foto}
                                                    alt={notif.emisor.nombre}
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '2px solid #e5e7eb',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                                    color: '#fff',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}>
                                                    {notif.emisor?.nombre?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}

                                            {/* Contenido */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: 13,
                                                    color: '#0f172a',
                                                    lineHeight: 1.4,
                                                    fontWeight: notif.leida ? 400 : 600,
                                                }}>
                                                    <strong>{notif.emisor?.nombre || 'Alguien'}</strong>{' '}
                                                    {notif.tipo === 'nuevo_seguidor' && 'comenzó a seguirte'}
                                                    {notif.tipo === 'nuevo_apunte_seguido' && (() => {
                                                        const match = notif.mensaje.match(/subió "(.+)"/);
                                                        const titulo = match ? match[1] : 'un apunte';
                                                        return `subió "${titulo}"`;
                                                    })()}
                                                    {notif.tipo === 'compra_apunte' && (() => {
                                                        const match = notif.mensaje.match(/compró "(.+)"/);
                                                        const titulo = match ? match[1] : 'tu apunte';
                                                        return `compró "${titulo}"`;
                                                    })()}
                                                    {notif.tipo === 'nueva_resena' && (() => {
                                                        const match = notif.mensaje.match(/calificó "(.+)" con (\d+)/);
                                                        if (match) {
                                                            return `calificó "${match[1]}" con ${match[2]} ⭐`;
                                                        }
                                                        return 'dejó una reseña';
                                                    })()}
                                                    {!['nuevo_seguidor', 'nuevo_apunte_seguido', 'compra_apunte', 'nueva_resena'].includes(notif.tipo) && notif.mensaje}
                                                    .{' '}
                                                    <span style={{
                                                        fontSize: 11,
                                                        color: '#94a3b8',
                                                        fontWeight: 400,
                                                    }}>
                                                        {formatTimeAgo(notif.creado_en)}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Botón Seguir */}
                                            {isFollowerNotif && !isFollowing && (
                                                <button
                                                    onClick={(e) => handleFollowBack(e, notif)}
                                                    style={{
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
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#1877f2';
                                                        e.target.style.transform = 'scale(1.02)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#0095f6';
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    Seguir
                                                </button>
                                            )}
                                            {/* Botón Siguiendo */}
                                            {isFollowerNotif && isFollowing && (
                                                <button
                                                    onClick={(e) => handleShowUnfollowModal(e, notif)}
                                                    style={{
                                                        padding: '7px 18px',
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#000',
                                                        background: '#efefef',
                                                        border: 'none',
                                                        borderRadius: 8,
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        minWidth: '105px',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#dbdbdb';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#efefef';
                                                    }}
                                                >
                                                    Siguiendo
                                                </button>
                                            )}
                                        </div>

                                        {/* Botón eliminar */}
                                        <button
                                            onClick={(e) => handleDelete(e, notif.id)}
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                right: 8,
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#94a3b8',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 16,
                                                fontWeight: 700,
                                                transition: 'all 0.2s ease',
                                            }}
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
                                            ×
                                        </button>

                                        {/* Indicador no leída */}
                                        {!notif.leida && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                right: 34,
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: '#0095f6',
                                            }} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                        <div style={{
                            padding: '12px 20px',
                            borderTop: '1px solid #e5e7eb',
                            background: '#f9fafb',
                        }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={handleVerTodas}
                                    style={{
                                        flex: 1,
                                        padding: '8px 16px',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#2563eb',
                                        background: 'none',
                                        border: 'none',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#eff6ff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'none';
                                    }}
                                >
                                    Ver todas →
                                </button>
                                <button
                                    onClick={handleSettings}
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#64748b',
                                        background: 'none',
                                        border: 'none',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#f1f5f9';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'none';
                                    }}
                                >
                                    ⚙️
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de confirmación unfollow */}
            {showUnfollowConfirm && (
                <div
                    onClick={handleCancelUnfollow}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        animation: 'fadeIn 0.2s ease',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 380,
                            width: '90%',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                            animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#0f172a',
                        }}>
                            ¿Dejar de seguir a {showUnfollowConfirm.emisor?.nombre}?
                        </h3>
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: '#64748b',
                        }}>
                            Dejarás de ver sus publicaciones en tu feed.
                        </p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCancelUnfollow}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#efefef',
                                    color: '#000',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#dbdbdb'}
                                onMouseLeave={(e) => e.target.style.background = '#efefef'}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmUnfollow}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#ed4956',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#c92a37'}
                                onMouseLeave={(e) => e.target.style.background = '#ed4956'}
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

// Helper
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
    return date.toLocaleDateString();
}

// Animaciones
if (typeof document !== 'undefined' && !document.getElementById('notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
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
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes badge-bounce {
      0%, 100% { transform: scale(1); }
      25% { transform: scale(1.15) rotate(-5deg); }
      75% { transform: scale(1.05) rotate(5deg); }
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
    .badge-bounce {
      animation: badge-bounce 0.6s ease-out;
    }
  `;
    document.head.appendChild(style);
}