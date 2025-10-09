import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useNotifications } from './NotificationProvider'; // Toast provider

export default function NotificationsRealtimeSubscriber() {
    const { cargarNotificaciones, contarNoLeidas } = useNotificationsContext();
    const { addNotification } = useNotifications();
    const channelRef = useRef(null);
    const userIdRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function subscribe() {
            try {
                // Obtener mi usuario ID
                const { data: miIdData } = await supabase.rpc('obtener_usuario_actual_id');

                if (!miIdData || cancelled) {
                    console.log('[Realtime] No hay usuario logueado');
                    return;
                }

                userIdRef.current = miIdData;
                console.log('🔴 [Realtime] Iniciando suscripción para usuario:', miIdData);

                // Crear canal de Realtime
                channelRef.current = supabase
                    .channel(`notificaciones-realtime-${miIdData}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notificaciones',
                            filter: `usuario_id=eq.${miIdData}` // Solo mis notificaciones
                        },
                        async (payload) => {
                            if (cancelled) return;

                            console.log('🔔 [Realtime] Nueva notificación recibida:', payload);

                            // Obtener datos completos con el emisor
                            const { data: notifCompleta } = await supabase
                                .from('notificaciones')
                                .select(`
                  id,
                  tipo,
                  emisor_id,
                  relacion_id,
                  mensaje,
                  leida,
                  creado_en,
                  emisor:usuario!notificaciones_emisor_id_fkey(
                    id_usuario,
                    nombre,
                    username,
                    foto
                  )
                `)
                                .eq('id', payload.new.id)
                                .single();

                            if (notifCompleta && !cancelled) {
                                // Recargar lista de notificaciones
                                cargarNotificaciones();
                                contarNoLeidas();

                                // Mostrar toast
                                const emisorNombre = notifCompleta.emisor?.nombre || 'Alguien';
                                const mensaje = notifCompleta.mensaje || 'Nueva notificación';

                                addNotification({
                                    type: 'info',
                                    title: `🔔 ${emisorNombre}`,
                                    message: mensaje,
                                    duration: 5000,
                                });

                                console.log('✅ [Realtime] Notificación procesada');
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('📡 [Realtime] Estado de suscripción:', status);
                    });

            } catch (error) {
                console.error('❌ [Realtime] Error en suscripción:', error);
            }
        }

        // Iniciar suscripción
        subscribe();

        // Cleanup
        return () => {
            cancelled = true;
            if (channelRef.current) {
                console.log('🔴 [Realtime] Cerrando canal');
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [cargarNotificaciones, contarNoLeidas, addNotification]);

    // Este componente no renderiza nada
    return null;
}