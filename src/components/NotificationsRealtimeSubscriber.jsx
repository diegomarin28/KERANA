// src/components/NotificationsRealtimeSubscriber.jsx
import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useNotifications } from './NotificationProvider';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

export default function NotificationsRealtimeSubscriber() {
    const { cargarNotificaciones, contarNoLeidas } = useNotificationsContext();
    const { addNotification } = useNotifications();
    const { shouldPlaySound, shouldShowToast, isTypeEnabled } = useNotificationSettings();
    const channelRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const setupRealtimeSubscription = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                const { data: usuarioData } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .single();

                if (!usuarioData || cancelled) return;

                const miUsuarioId = usuarioData.id_usuario;

                // Limpiar canal existente si hay uno
                if (channelRef.current) {
                    await supabase.removeChannel(channelRef.current);
                }

                // Crear nuevo canal
                const channel = supabase
                    .channel('notificaciones-realtime')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'notificaciones',
                            filter: `usuario_id=eq.${miUsuarioId}`
                        },
                        async (payload) => {
                            console.log('🔔 Nueva notificación recibida:', payload);

                            if (cancelled) return;

                            // Obtener la notificación completa con datos del emisor
                            const { data: notifCompleta } = await supabase
                                .from('notificaciones')
                                .select(`
                                    *,
                                    emisor:usuario!notificaciones_emisor_id_fkey(
                                        id_usuario,
                                        nombre,
                                        foto
                                    )
                                `)
                                .eq('id', payload.new.id)
                                .single();

                            if (notifCompleta && !cancelled) {
                                // ✅ Verificar si el tipo está habilitado en settings
                                if (!isTypeEnabled(notifCompleta.tipo)) {
                                    console.log('⏭️ Notificación ignorada por settings:', notifCompleta.tipo);
                                    return;
                                }

                                // Recargar lista de notificaciones y contador
                                await cargarNotificaciones();
                                await contarNoLeidas();

                                // ✅ Sonido solo si está habilitado en settings
                                if (shouldPlaySound) {
                                    playSound();
                                }

                                // ✅ Toast solo si está habilitado en settings
                                if (shouldShowToast) {
                                    addNotification({
                                        id: notifCompleta.id,
                                        title: notifCompleta.emisor?.nombre || 'Nueva notificación',
                                        message: notifCompleta.mensaje,
                                        type: 'info',
                                        duration: 5000,
                                        avatar: notifCompleta.emisor?.foto,
                                    });
                                }
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('📡 Estado de suscripción realtime:', status);
                    });

                channelRef.current = channel;

            } catch (error) {
                console.error('❌ Error en suscripción realtime:', error);
            }
        };

        setupRealtimeSubscription();

        // Cleanup
        return () => {
            cancelled = true;
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [cargarNotificaciones, contarNoLeidas, addNotification, shouldPlaySound, shouldShowToast, isTypeEnabled]);

    return null;
}

// Función para reproducir sonido de notificación
function playSound() {
    try {
        // Opción 1: Usar un archivo local
        const audio = new Audio('/notification-sound.mp3');

        // Opción 2: Usar un sonido de CDN si no tienes archivo local
        // const audio = new Audio('https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3');

        audio.volume = 0.5;
        audio.play().catch(err => {
            console.log('⚠️ No se pudo reproducir sonido:', err);
        });
    } catch (error) {
        console.log('⚠️ Error al reproducir sonido:', error);
    }
}