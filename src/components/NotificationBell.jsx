import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
        setupRealtimeSubscription();
    }, []);

    const loadNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (!usuarioData) return;
            setUserId(usuarioData.id_usuario);

            // Obtener últimas 10 notificaciones
            const { data: notifs, error } = await supabase
                .from('notificaciones')
                .select(`
                    *,
                    emisor:usuario!notificaciones_emisor_id_fkey(nombre, foto)
                `)
                .eq('usuario_id', usuarioData.id_usuario)
                .order('creado_en', { ascending: false })
                .limit(10);

            if (error) throw error;

            setNotifications(notifs || []);
            setUnreadCount(notifs?.filter(n => !n.leida).length || 0);
        } catch (err) {
            console.error('Error cargando notificaciones:', err);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usuarioData } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!usuarioData) return;

        // Suscribirse a nuevas notificaciones
        const channel = supabase
            .channel('notificaciones-' + usuarioData.id_usuario)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `usuario_id=eq.${usuarioData.id_usuario}`
                },
                () => loadNotifications()
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `usuario_id=eq.${usuarioData.id_usuario}`
                },
                () => loadNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Marcar como leída
            if (!notification.leida) {
                await supabase
                    .from('notificaciones')
                    .update({ leida: true })
                    .eq('id', notification.id);
            }

            setShowDropdown(false);

            // Navegar a la URL
            if (notification.url) {
                navigate(notification.url);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('usuario_id', userId)
                .eq('leida', false);

            loadNotifications();
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const getNotificationIcon = (tipo) => {
        switch (tipo) {
            case 'compra_apunte': return '🎉';
            case 'nuevo_apunte_seguido': return '📚';
            case 'nuevo_seguidor': return '👥';
            case 'nueva_resena': return '⭐';
            case 'anuncio': return '📢';
            default: return '🔔';
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);

        if (seconds < 60) return 'Hace un momento';
        if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
        if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
        if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Botón de campana */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>

                {/* Badge de no leídas */}
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 20,
                        height: 20,
                        borderRadius: '10px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                )}
            </button>

            {/* Dropdown de notificaciones */}
            {showDropdown && (
                <>
                    {/* Overlay para cerrar */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998
                        }}
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Panel de notificaciones */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 8,
                        width: 380,
                        maxHeight: 500,
                        background: 'white',
                        borderRadius: 12,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        border: '1px solid #e5e7eb',
                        zIndex: 999,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                                Notificaciones
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: '4px 8px'
                                    }}
                                >
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        {/* Lista de notificaciones */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {loading ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                    Cargando...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                                    <p style={{ margin: 0, fontWeight: 500 }}>
                                        No tenés notificaciones
                                    </p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        style={{
                                            padding: '16px 20px',
                                            borderBottom: '1px solid #f3f4f6',
                                            cursor: 'pointer',
                                            background: notif.leida ? 'white' : '#eff6ff',
                                            transition: 'background 0.2s',
                                            display: 'flex',
                                            gap: 12,
                                            alignItems: 'flex-start'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = notif.leida ? 'white' : '#eff6ff'}
                                    >
                                        {/* Icono */}
                                        <div style={{
                                            fontSize: 24,
                                            flexShrink: 0,
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#f3f4f6',
                                            borderRadius: 8
                                        }}>
                                            {getNotificationIcon(notif.tipo)}
                                        </div>

                                        {/* Contenido */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: 14,
                                                marginBottom: 4,
                                                color: '#111827'
                                            }}>
                                                {notif.titulo}
                                            </div>
                                            <div style={{
                                                fontSize: 13,
                                                color: '#6b7280',
                                                marginBottom: 6,
                                                lineHeight: 1.4
                                            }}>
                                                {notif.mensaje}
                                            </div>
                                            <div style={{
                                                fontSize: 12,
                                                color: '#9ca3af'
                                            }}>
                                                {formatTimeAgo(notif.creado_en)}
                                            </div>
                                        </div>

                                        {/* Indicador no leída */}
                                        {!notif.leida && (
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: '#2563eb',
                                                flexShrink: 0,
                                                marginTop: 6
                                            }} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div style={{
                                padding: '12px 20px',
                                borderTop: '1px solid #e5e7eb',
                                textAlign: 'center'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        navigate('/notifications');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        padding: '4px 8px'
                                    }}
                                >
                                    Ver todas las notificaciones
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}