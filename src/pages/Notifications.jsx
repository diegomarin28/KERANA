import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useSeguidores } from '../hooks/useSeguidores';

export default function Notifications() {
    const {
        notificaciones,
        loading,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
    } = useNotificationsContext();

    const { seguirUsuario } = useSeguidores();

    const handleFollowBack = async (emisorId, notifId) => {
        try {
            await seguirUsuario(emisorId);
            await marcarComoLeida(notifId);
        } catch (error) {
            console.error('Error haciendo follow back:', error);
        }
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

                    {notificaciones.some(n => !n.leida) && (
                        <Button
                            onClick={marcarTodasLeidas}
                            variant="outline"
                            size="small"
                        >
                            Marcar todas como leídas
                        </Button>
                    )}
                </div>

                <div style={notificationsListStyle}>
                    {notificaciones.length === 0 ? (
                        <Card style={emptyStateStyle}>
                            <div style={emptyStateContentStyle}>
                                <div style={emptyIconStyle}>🔔</div>
                                <h3>No tenés notificaciones</h3>
                                <p>Te avisaremos cuando tengas novedades</p>
                            </div>
                        </Card>
                    ) : (
                        notificaciones.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={marcarComoLeida}
                                onDelete={eliminarNotificacion}
                                onFollowBack={handleFollowBack}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente individual de notificación
function NotificationCard({ notification, onMarkAsRead, onDelete, onFollowBack }) {
    const getIcon = (type) => {
        switch (type) {
            case 'nuevo_seguidor': return '👤';
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

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;
        return date.toLocaleDateString();
    };

    const isFollowNotif = notification.tipo === 'nuevo_seguidor';

    return (
        <Card style={{
            ...notificationCardStyle,
            background: notification.leida ? '#fff' : '#f0f9ff',
            borderLeft: notification.leida ? '4px solid #e5e7eb' : '4px solid #2563eb'
        }}>
            <div style={notificationHeaderStyle}>
                {/* Avatar */}
                {notification.emisor?.foto ? (
                    <img
                        src={notification.emisor.foto}
                        alt={notification.emisor.nombre}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #e5e7eb',
                        }}
                    />
                ) : (
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 20,
                        fontWeight: 700,
                    }}>
                        {getIcon(notification.tipo)}
                    </div>
                )}

                {/* Contenido */}
                <div style={notificationContentStyle}>
                    <h4 style={notificationTitleStyle}>
                        {notification.emisor?.nombre || 'Notificación'}
                    </h4>
                    <p style={notificationMessageStyle}>{notification.mensaje}</p>
                    <span style={notificationDateStyle}>
            {formatDate(notification.creado_en)}
          </span>

                    {/* Acciones especiales según tipo */}
                    {isFollowNotif && !notification.leida && (
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <Button
                                onClick={() => onFollowBack(notification.emisor_id, notification.id)}
                                size="small"
                                style={{ fontSize: 13 }}
                            >
                                Seguir también
                            </Button>
                        </div>
                    )}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!notification.leida && (
                        <Button
                            onClick={() => onMarkAsRead(notification.id)}
                            variant="outline"
                            size="small"
                        >
                            Marcar leída
                        </Button>
                    )}
                    <button
                        onClick={() => onDelete(notification.id)}
                        style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            color: '#ef4444',
                            background: 'none',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            cursor: 'pointer',
                        }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </Card>
    );
}

// Estilos
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