// src/pages/Notifications.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // Notificaciones hardcodeadas por ahora
            const mockNotifications = [
                {
                    id: 2,
                    type: 'system',
                    title: 'Bienvenido a KERANA',
                    message: 'Tu cuenta ha sido verificada correctamente',
                    date: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
                    read: true
                },
                {
                    id: 3,
                    type: 'update',
                    title: 'Nueva funcionalidad',
                    message: 'Ya podés subir apuntes en formato PDF',
                    date: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
                    read: true
                }
            ];

            setNotifications(mockNotifications);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p>Cargando notificaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Notificaciones</h1>
                    <p style={subtitleStyle}>Mantenete al tanto de tu actividad</p>

                    {notifications.some(n => !n.read) && (
                        <Button
                            onClick={markAllAsRead}
                            variant="outline"
                            size="small"
                        >
                            Marcar todas como leídas
                        </Button>
                    )}
                </div>

                <div style={notificationsListStyle}>
                    {notifications.length === 0 ? (
                        <Card style={emptyStateStyle}>
                            <div style={emptyStateContentStyle}>
                                <div style={emptyIconStyle}>🔔</div>
                                <h3>No tenés notificaciones</h3>
                                <p>Te avisaremos cuando tengas novedades</p>
                            </div>
                        </Card>
                    ) : (
                        notifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente individual de notificación
function NotificationCard({ notification, onMarkAsRead }) {
    const getIcon = (type) => {
        switch (type) {
            case 'sale': return '💰';
            case 'system': return '⚙️';
            case 'update': return '🆕';
            default: return '🔔';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;
        return date.toLocaleDateString();
    };

    return (
        <Card style={{
            ...notificationCardStyle,
            background: notification.read ? '#fff' : '#f0f9ff',
            borderLeft: notification.read ? '4px solid #fff' : '4px solid #2563eb'
        }}>
            <div style={notificationHeaderStyle}>
                <div style={notificationIconStyle}>
                    {getIcon(notification.type)}
                </div>
                <div style={notificationContentStyle}>
                    <h4 style={notificationTitleStyle}>{notification.title}</h4>
                    <p style={notificationMessageStyle}>{notification.message}</p>
                    <span style={notificationDateStyle}>
                        {formatDate(notification.date)}
                    </span>
                </div>
                {!notification.read && (
                    <Button
                        onClick={() => onMarkAsRead(notification.id)}
                        variant="outline"
                        size="small"
                    >
                        Marcar leída
                    </Button>
                )}
            </div>
        </Card>
    );
}

// Estilos (los mismos que EditProfile)
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 16px',
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    color: '#64748b'
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 16
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '32px',
};

const titleStyle = {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0b1e3a',
    margin: '0 0 8px 0',
};

const subtitleStyle = {
    fontSize: '16px',
    color: '#64748b',
    margin: '0 0 16px 0',
};

const notificationsListStyle = {
    display: 'grid',
    gap: '12px',
};

const notificationCardStyle = {
    padding: '16px',
    transition: 'all 0.2s ease',
};

const notificationHeaderStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
};

const notificationIconStyle = {
    fontSize: '20px',
    marginTop: '2px',
};

const notificationContentStyle = {
    flex: 1,
};

const notificationTitleStyle = {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#0b1e3a',
};

const notificationMessageStyle = {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.4',
};

const notificationDateStyle = {
    fontSize: '12px',
    color: '#94a3b8',
};

const emptyStateStyle = {
    padding: '48px 24px',
    textAlign: 'center',
};

const emptyStateContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
};

const emptyIconStyle = {
    fontSize: '48px',
    opacity: 0.5,
};