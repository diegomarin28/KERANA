
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const Notificaciones = () => {
    const [notificaciones, setNotificaciones] = useState([]);

    useEffect(() => {
        cargarNotificaciones();
        suscribirNotificaciones();
    }, []);

    const cargarNotificaciones = async () => {
        const { data } = await supabase
            .from('notificaciones')
            .select(`
        *,
        emisor:emisor_id(*)
      `)
            .order('creado_en', { ascending: false })
            .limit(20);

        setNotificaciones(data || []);
    };

    const suscribirNotificaciones = () => {
        supabase
            .channel('notificaciones')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notificaciones' },
                async (payload) => {
                    // Obtener el usuario actual de forma asíncrona
                    const { data: { user } } = await supabase.auth.getUser();

                    if (payload.new.usuario_id === user?.id) {
                        setNotificaciones(prev => [payload.new, ...prev]);
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

    return (
        <div className="notificaciones">
            {notificaciones.map(notif => (
                <div key={notif.id} className={`notificacion ${notif.leida ? 'leida' : ''}`}>
                    <img src={notif.emisor?.avatar_url} alt={notif.emisor?.nombre} />
                    <div>
                        <p>{notif.mensaje}</p>
                        <small>{new Date(notif.creado_en).toLocaleDateString()}</small>
                        {notif.tipo === 'nuevo_seguidor' && (
                            <button onClick={() => seguirUsuario(notif.emisor_id)}>
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