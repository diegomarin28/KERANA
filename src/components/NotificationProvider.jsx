import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        console.warn('useNotifications usado fuera de NotificationProvider');
        return {
            notifications: [],
            addNotification: () => {},
            removeNotification: () => {},
            clearAll: () => {}
        };
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        try {
            const id = Date.now() + Math.random();
            const newNotification = {
                id,
                type: 'info',
                duration: 5000,
                ...notification,
            };

            setNotifications(prev => [...prev, newNotification]);

            if (newNotification.duration !== 0) {
                setTimeout(() => {
                    removeNotification(id);
                }, newNotification.duration);
            }

            return id;
        } catch (e) {
            console.error('Error adding notification:', e);
            return null;
        }
    }, []);

    const removeNotification = useCallback((id) => {
        try {
            setNotifications(prev => prev.filter(notification => notification.id !== id));
        } catch (e) {
            console.error('Error removing notification:', e);
        }
    }, []);

    const clearAll = useCallback(() => {
        try {
            setNotifications([]);
        } catch (e) {
            console.error('Error clearing notifications:', e);
        }
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};

const NotificationContainer = () => {
    const { notifications, removeNotification } = useNotifications();

    if (!notifications || notifications.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 80,
                right: 20,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxWidth: 400,
                pointerEvents: 'none'
            }}
        >
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationItem = ({ notification, onClose }) => {
    // 🔗 Función para navegar al perfil
    const handleClick = (e) => {
        console.log('🖱️ Click en notificación:', {
            username: notification.username,
            url: notification.url,
            notification
        });

        if (notification.username) {
            window.location.href = `/user/${notification.username}`;
        } else if (notification.url) {
            window.location.href = notification.url;
        } else {
            console.log('❌ No hay username ni url para navegar');
        }
    };

    const isClickable = !!(notification.username || notification.url);

    console.log('🔍 NotificationItem render:', {
        username: notification.username,
        url: notification.url,
        isClickable,
        title: notification.title
    });

    const getStyles = (type) => {
        const baseStyle = {
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
            pointerEvents: 'auto',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative',
            cursor: isClickable ? 'pointer' : 'default',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        };

        const typeStyles = {
            success: {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
                color: '#ffffff',
            },
            error: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
                color: '#ffffff',
            },
            warning: {
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
                color: '#ffffff',
            },
            info: {
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.95) 0%, rgba(29, 78, 216, 0.95) 100%)',
                color: '#ffffff',
            },
        };

        return { ...baseStyle, ...(typeStyles[type] || typeStyles.info) };
    };

    // 🎨 FUNCIÓN PARA FORMATEAR EL MENSAJE - OPCIÓN 1
    const renderMessage = () => {
        // Si viene username y nombre separados (desde NotificationsRealtimeSubscriber)
        if (notification.username && notification.title) {
            return (
                <>
                    <div style={{
                        fontWeight: '700',
                        fontSize: '15px',
                        marginBottom: '4px',
                    }}>
                        {notification.title}
                    </div>
                    <div style={{
                        fontSize: '13px',
                        opacity: 0.85,
                        marginBottom: '4px',
                    }}>
                        @{notification.username}
                    </div>
                    <div style={{
                        fontSize: '14px',
                        lineHeight: '1.5',
                        opacity: 0.95,
                    }}>
                        {notification.message}
                    </div>
                </>
            );
        }

        // Formato tradicional con title y message
        return (
            <>
                {notification.title && (
                    <div style={{
                        fontWeight: '700',
                        marginBottom: '6px',
                        fontSize: '15px',
                    }}>
                        {notification.title}
                    </div>
                )}
                <div style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    opacity: 0.95,
                }}>
                    {notification.message}
                </div>
            </>
        );
    };

    return (
        <div
            style={getStyles(notification.type)}
            onClick={isClickable ? handleClick : undefined}
            onMouseEnter={(e) => {
                if (isClickable) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (isClickable) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                }
            }}
        >
            {/* Botón X para cerrar */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // ✅ Evitar que abra el perfil al cerrar
                    onClose();
                }}
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Cerrar notificación"
            >
                ×
            </button>

            {/* Avatar (si existe) */}
            {notification.avatar && (
                <img
                    src={notification.avatar}
                    alt="Avatar"
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255,255,255,0.3)',
                        flexShrink: 0,
                    }}
                />
            )}

            <div style={{ flex: 1, paddingRight: 20 }}>
                {renderMessage()}

                {/* Botón de acción */}
                {notification.action && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            notification.action.onClick();
                            onClose();
                        }}
                        style={{
                            marginTop: '10px',
                            padding: '6px 14px',
                            background: 'rgba(255,255,255,0.3)',
                            border: '1px solid rgba(255,255,255,0.4)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255,255,255,0.3)';
                        }}
                    >
                        {notification.action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

// Agregar animación CSS si no existe
if (typeof document !== 'undefined' && !document.getElementById('notification-animation')) {
    const style = document.createElement('style');
    style.id = 'notification-animation';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(120%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}