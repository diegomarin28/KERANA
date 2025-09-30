import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // Cambié la ruta
import { useSeguidores } from '../hooks/useSeguidores'; // Importar el hook

export const Notificaciones = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const { seguirUsuario } = useSeguidores(); // Usar el hook

    useEffect(() => {
        cargarNotificaciones();
        const channel = suscribirNotificaciones();

        // Cleanup
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const cargarNotificaciones = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notificaciones')
                .select(`
                    *,
                    emisor:emisor_id(*)
                `)
                .eq('usuario_id', await obtenerMiUsuarioId()) // Filtrar por usuario actual
                .order('creado_en', { ascending: false })
                .limit(20);

            if (!error) {
                setNotificaciones(data || []);
            }
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        }
    };

    const obtenerMiUsuarioId = async () => {
        const { data, error } = await supabase.rpc('obtener_usuario_actual_id');
        return error ? null : data;
    };

    const suscribirNotificaciones = () => {
        return supabase
            .channel('notificaciones')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notificaciones' },
                async (payload) => {
                    const miId = await obtenerMiUsuarioId();
                    if (payload.new.usuario_id === miId) {
                        // Obtener datos completos de la nueva notificación
                        const { data: notifCompleta } = await supabase
                            .from('notificaciones')
                            .select(`
                                *,
                                emisor:emisor_id(*)
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
        await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', notificacionId);
    };

    const handleFollowBack = async (emisorId) => {
        try {
            await seguirUsuario(emisorId);
            // Recargar notificaciones después de follow back
            cargarNotificaciones();
        } catch (error) {
            console.error('Error haciendo follow back:', error);
        }
    };

    return (
        <div className="notificaciones">
            {notificaciones.map(notif => (
                <div key={notif.id} className={`notificacion ${notif.leida ? 'leida' : ''}`}>
                    <img src={notif.emisor?.foto} alt={notif.emisor?.nombre} />
                    <div>
                        <p>{notif.mensaje}</p>
                        <small>{new Date(notif.creado_en).toLocaleDateString()}</small>
                        {notif.tipo === 'nuevo_seguidor' && (
                            <button onClick={() => handleFollowBack(notif.emisor_id)}>
                                Follow Back
                            </button>
                        )}
                    </div>
                    <button onClick={() => marcarComoLeida(notif.id)}>×</button>
                </div>
            ))}
        </div>
    );
};