// NotificationsMessages.jsx (corregido)
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';

export const NotificationMessages = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const { seguirUsuario, obtenerMiUsuarioId } = useSeguidores(); // ✅ Usamos la del hook

    useEffect(() => {
        cargarNotificaciones();
        const channel = suscribirNotificaciones();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    // ❌ ELIMINAR esta función duplicada
    // const obtenerMiUsuarioId = async () => {
    //     try {
    //         const { data: { user } } = await supabase.auth.getUser();
    //         if (!user) return null;
    //
    //         const { data: usuarioData } = await supabase
    //             .from('usuario')
    //             .select('id_usuario')
    //             .eq('auth_id', user.id)
    //             .single();
    //
    //         return usuarioData?.id_usuario || null;
    //     } catch (error) {
    //         console.error('Error obteniendo usuario ID:', error);
    //         return null;
    //     }
    // };

    const cargarNotificaciones = async () => {
        try {
            setCargando(true);
            const miUsuarioId = await obtenerMiUsuarioId(); // ✅ Usa la función del hook
            if (!miUsuarioId) return;

            const { data, error } = await supabase
                .from('notificaciones')
                .select(`
                    *,
                    emisor:usuario!notificaciones_emisor_id_fkey(
                        id_usuario,
                        nombre,
                        avatar_url,
                        correo
                    )
                `)
                .eq('usuario_id', miUsuarioId)
                .order('creado_en', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Filtrar notificaciones de usuarios bloqueados
            const notificacionesFiltradas = await filtrarNotificacionesBloqueadas(data || []);
            setNotificaciones(notificacionesFiltradas);

        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setCargando(false);
        }
    };

    const filtrarNotificacionesBloqueadas = async (notificaciones) => {
        const miUsuarioId = await obtenerMiUsuarioId(); // ✅ Usa la función del hook
        if (!miUsuarioId) return notificaciones;

        const { data: bloqueos } = await supabase
            .from('bloqueos')
            .select('bloqueado_id')
            .eq('bloqueador_id', miUsuarioId);

        if (!bloqueos || bloqueos.length === 0) return notificaciones;

        const bloqueadosIds = bloqueos.map(b => b.bloqueado_id);

        return notificaciones.filter(notif =>
            !notif.emisor_id || !bloqueadosIds.includes(notif.emisor_id)
        );
    };

    const suscribirNotificaciones = () => {
        return supabase
            .channel('notificaciones-cambios')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones'
                },
                async (payload) => {
                    const miId = await obtenerMiUsuarioId(); // ✅ Usa la función del hook
                    if (payload.new.usuario_id === miId) {
                        // Verificar si el emisor está bloqueado
                        const { data: bloqueo } = await supabase
                            .from('bloqueos')
                            .select('id')
                            .eq('bloqueador_id', miId)
                            .eq('bloqueado_id', payload.new.emisor_id)
                            .single();

                        if (bloqueo) return;

                        // Obtener datos completos
                        const { data: notifCompleta } = await supabase
                            .from('notificaciones')
                            .select(`
                                *,
                                emisor:usuario!notificaciones_emisor_id_fkey(
                                    id_usuario,
                                    nombre,
                                    avatar_url
                                )
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (notifCompleta) {
                            setNotificaciones(prev => [notifCompleta, ...prev]);
                        }
                    }
                }
            )
            .subscribe();
    };

    const marcarComoLeida = async (notificacionId) => {
        try {
            await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('id', notificacionId);

            setNotificaciones(prev =>
                prev.map(notif =>
                    notif.id === notificacionId
                        ? { ...notif, leida: true }
                        : notif
                )
            );
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    };

    const eliminarNotificacion = async (notificacionId) => {
        try {
            await supabase
                .from('notificaciones')
                .delete()
                .eq('id', notificacionId);

            setNotificaciones(prev => prev.filter(notif => notif.id !== notificacionId));
        } catch (error) {
            console.error('Error eliminando notificación:', error);
        }
    };

    const handleFollowBack = async (emisorId) => {
        try {
            await seguirUsuario(emisorId);
            cargarNotificaciones(); // Recargar para actualizar estado
        } catch (error) {
            console.error('Error haciendo follow back:', error);
        }
    };

    const getAccionesNotificacion = (notif) => {
        if (notif.tipo === 'nuevo_seguidor') {
            return (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                        onClick={() => handleFollowBack(notif.emisor_id)}
                        style={{
                            padding: '4px 12px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        Follow Back
                    </button>
                </div>
            );
        }
        return null;
    };

    if (cargando) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando notificaciones...</div>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '0 16px'
            }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Notificaciones</h2>
                <button
                    onClick={cargarNotificaciones}
                    style={{
                        background: 'none',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ↻
                </button>
            </div>

            <div>
                {notificaciones.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#6b7280'
                    }}>
                        No tienes notificaciones
                    </div>
                ) : (
                    notificaciones.map(notif => (
                        <div
                            key={notif.id}
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid #f3f4f6',
                                background: notif.leida ? '#fff' : '#f0f9ff',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onClick={() => !notif.leida && marcarComoLeida(notif.id)}
                        >
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <img
                                    src={notif.emisor?.avatar_url || '/default-avatar.png'}
                                    alt={notif.emisor?.nombre}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p style={{
                                        margin: '0 0 4px 0',
                                        color: '#111827',
                                        fontSize: '14px'
                                    }}>
                                        {notif.mensaje}
                                    </p>
                                    <small style={{
                                        color: '#6b7280',
                                        fontSize: '12px'
                                    }}>
                                        {new Date(notif.creado_en).toLocaleString()}
                                    </small>
                                    {getAccionesNotificacion(notif)}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarNotificacion(notif.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '18px',
                                        cursor: 'pointer',
                                        color: '#9ca3af',
                                        padding: '4px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};