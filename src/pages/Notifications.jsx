// src/pages/Notifications.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { getNotificationRoute, isNotificationClickable, getNotificationIcon } from '../utils/notificationRouter';
import { groupNotifications } from '../utils/notificationGrouper';

export default function Notifications() {
    const navigate = useNavigate();
    const [showGrouped, setShowGrouped] = useState(true);
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

    useEffect(() => {
        cargarNotificaciones();
        // Marcar visita cuando se abre la página
        return () => {
            marcarVisita();
        };
    }, [cargarNotificaciones, marcarVisita]);

    // Agrupar notificaciones si está activado
    const displayNotifications = showGrouped
        ? groupNotifications(notificaciones)
        : notificaciones.map(n => ({ ...n, isGroup: false }));

    const handleNotificationClick = async (notif) => {
        // Solo marcar como leída, NO redireccionar
        if (!notif.leida) {
            await marcarComoLeida(notif.id);
        }
    };

    const handleDelete = async (e, notifId) => {
        e.stopPropagation();
        await eliminarNotificacion(notifId);
    };

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <button
                        onClick={() => navigate(-1)}
                        style={backButtonStyle}
                        onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                        ← Volver
                    </button>
                    <h1 style={titleStyle}>Notificaciones</h1>
                    {unreadCount > 0 && (
                        <p style={subtitleStyle}>
                            Tenés {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                        </p>
                    )}
                </div>

                {/* Acciones rápidas */}
                {notificaciones.length > 0 && (
                    <>
                        {/* Banner de nuevas notificaciones */}
                        {newSinceLastVisit > 0 && (
                            <div style={newNotifsBannerStyle}>
                                <span style={{ fontSize: 18 }}>✨</span>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>
                                    {newSinceLastVisitMessage}
                                </span>
                            </div>
                        )}

                        <div style={actionsStyle}>
                            <button
                                onClick={() => navigate('/settings')}
                                style={actionButtonStyle}
                                onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                                onMouseLeave={(e) => e.target.style.background = '#fff'}
                            >
                                ⚙️ Configurar
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={marcarTodasLeidas}
                                    style={{...actionButtonStyle, color: '#2563eb'}}
                                    onMouseEnter={(e) => e.target.style.background = '#eff6ff'}
                                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                                >
                                    ✓ Marcar todas como leídas
                                </button>
                            )}
                        </div>
                    </>
                )}

                {/* Lista de notificaciones */}
                <div style={listContainerStyle}>
                    {loading ? (
                        <div style={emptyStateStyle}>
                            <div style={spinnerStyle} />
                            <p>Cargando notificaciones...</p>
                        </div>
                    ) : notificaciones.length === 0 ? (
                        <div style={emptyStateStyle}>
                            <div style={{ fontSize: 60, marginBottom: 16 }}>🔔</div>
                            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                                No tenés notificaciones
                            </h3>
                            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748b' }}>
                                Cuando alguien interactúe contigo, te avisaremos aquí
                            </p>
                        </div>
                    ) : (
                        notificaciones.map((notif) => {
                            const isClickable = isNotificationClickable(notif);
                            const icon = getNotificationIcon(notif.tipo);

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        ...notificationCardStyle,
                                        background: notif.leida ? '#fff' : '#f0f9ff',
                                        borderColor: notif.leida ? '#e5e7eb' : '#bfdbfe',
                                        cursor: isClickable ? 'pointer' : 'default',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (isClickable) {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Avatar + Contenido */}
                                    <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                                        {/* Avatar del emisor */}
                                        {notif.emisor?.foto ? (
                                            <img
                                                src={notif.emisor.foto}
                                                alt={notif.emisor.nombre}
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid #e5e7eb',
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                                color: '#fff',
                                                display: 'grid',
                                                placeItems: 'center',
                                                fontSize: 18,
                                                fontWeight: 700,
                                                flexShrink: 0,
                                            }}>
                                                {icon}
                                            </div>
                                        )}

                                        {/* Contenido */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                margin: '0 0 6px 0',
                                                fontSize: 14,
                                                color: '#0f172a',
                                                lineHeight: 1.5,
                                                fontWeight: notif.leida ? 400 : 600,
                                            }}>
                                                <strong>{notif.emisor?.nombre || 'Alguien'}</strong>{' '}
                                                {notif.mensaje}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{
                                                    fontSize: 12,
                                                    color: '#94a3b8',
                                                }}>
                                                    {formatTimeAgo(notif.creado_en)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón eliminar */}
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
                                        ✕
                                    </button>

                                    {/* Indicador no leída */}
                                    {!notif.leida && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 16,
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: '#2563eb',
                                        }} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
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

// Estilos
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '30px 16px',
};

const containerStyle = {
    maxWidth: 800,
    margin: '0 auto',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: 24,
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
};

const titleStyle = {
    fontSize: 28,
    fontWeight: 800,
    color: '#0b1e3a',
    margin: '0 0 6px 0',
};

const subtitleStyle = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
};

const actionsStyle = {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
};

const actionButtonStyle = {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const listContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};

const notificationCardStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    background: '#fff',
    border: '1px solid',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
};

const deleteButtonStyle = {
    position: 'absolute',
    top: 12,
    right: 40,
    width: 28,
    height: 28,
    display: 'grid',
    placeItems: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    color: '#94a3b8',
    fontSize: 16,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    textAlign: 'center',
    color: '#64748b',
};

const newNotifsBannerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '12px 20px',
    marginBottom: 16,
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    border: '1px solid #93c5fd',
    borderRadius: 10,
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

// Agregar animación si no existe
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
  `;
    document.head.appendChild(style);
}