// src/components/NotificationsRealtimeSubscriber.jsx
import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useNotifications } from './NotificationProvider';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

const POLLING_INTERVAL = 10000; // 10 segundos

let audioContext = null;
let audioUnlocked = false;

export default function NotificationsRealtimeSubscriber() {
    const { cargarNotificaciones, contarNoLeidas } = useNotificationsContext();
    const { addNotification } = useNotifications();
    const { shouldPlaySound, shouldShowToast, isTypeEnabled } = useNotificationSettings();
    const intervalRef = useRef(null);
    const lastCheckRef = useRef(new Date());
    const miUsuarioIdRef = useRef(null);
    const isOnlineRef = useRef(navigator.onLine);

    // 🌐 Detectar cambios de conexión
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Conexión restaurada');
            isOnlineRef.current = true;
            lastCheckRef.current = new Date(Date.now() - 30000);
        };

        const handleOffline = () => {
            console.log('📡 Conexión perdida');
            isOnlineRef.current = false;
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 🔓 Desbloquear audio
    useEffect(() => {
        const unlockAudio = async () => {
            if (audioUnlocked) return;

            try {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);

                audioUnlocked = true;
                console.log('🔓 Audio desbloqueado');

                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            } catch (error) {
                console.log('⚠️ No se pudo desbloquear audio:', error);
            }
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const setupPolling = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                const { data: usuarioData } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .single();

                if (!usuarioData || cancelled) return;

                miUsuarioIdRef.current = usuarioData.id_usuario;

                const checkForNewNotifications = async () => {
                    if (cancelled) return;

                    if (!isOnlineRef.current) {
                        console.log('⏸️ Polling pausado (sin conexión)');
                        return;
                    }

                    try {
                        const { data: nuevasNotifs, error } = await supabase
                            .from('notificaciones')
                            .select(`
                                *,
                                emisor:usuario!notificaciones_emisor_id_fkey(
                                    id_usuario,
                                    nombre,
                                    username,
                                    foto
                                )
                            `)
                            .eq('usuario_id', miUsuarioIdRef.current)
                            .gte('creado_en', lastCheckRef.current.toISOString())
                            .order('creado_en', { ascending: false });

                        if (error) {
                            console.error('❌ Error en polling:', error);
                            return;
                        }

                        if (nuevasNotifs && nuevasNotifs.length > 0) {
                            lastCheckRef.current = new Date();

                            await cargarNotificaciones();
                            await contarNoLeidas();

                            for (const notif of nuevasNotifs) {
                                if (!isTypeEnabled(notif.tipo)) {
                                    continue;
                                }

                                if (shouldPlaySound) {
                                    playSound(notif.tipo);
                                }

                                if (shouldShowToast) {
                                    // 🎨 FORMATO MEJORADO - OPCIÓN 1
                                    const emisorNombre = notif.emisor?.nombre || 'Alguien';
                                    const emisorUsername = notif.emisor?.username;

                                    let mensajeFormateado = notif.mensaje;
                                    let urlDestino = notif.url || (emisorUsername ? `/user/${emisorUsername}` : null);

                                    // Extraer acción del mensaje según tipo
                                    if (notif.tipo === 'nuevo_seguidor') {
                                        mensajeFormateado = 'empezó a seguirte';
                                    } else if (notif.tipo === 'nuevo_apunte_seguido') {
                                        const match = notif.mensaje.match(/subió "(.+)"/);
                                        if (match) {
                                            mensajeFormateado = `subió "${match[1]}"`;
                                        }
                                    } else if (notif.tipo === 'compra_apunte') {
                                        const match = notif.mensaje.match(/compró "(.+)"/);
                                        if (match) {
                                            mensajeFormateado = `compró "${match[1]}"`;
                                        }
                                    } else if (notif.tipo === 'nueva_resena') {
                                        const match = notif.mensaje.match(/calificó "(.+)" con (\d+)/);
                                        if (match) {
                                            mensajeFormateado = `calificó "${match[1]}" con ${match[2]} ⭐`;
                                        }
                                    }

                                    addNotification({
                                        id: notif.id,
                                        title: emisorNombre,
                                        username: emisorUsername,
                                        message: mensajeFormateado,
                                        type: 'info',
                                        duration: 5000,
                                        avatar: notif.emisor?.foto,
                                        url: urlDestino, // ✅ URL para navegación
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error en checkForNewNotifications:', error);
                    }
                };

                checkForNewNotifications();
                intervalRef.current = setInterval(checkForNewNotifications, POLLING_INTERVAL);

            } catch (error) {
                console.error('❌ Error en setupPolling:', error);
            }
        };

        setupPolling();

        return () => {
            cancelled = true;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [cargarNotificaciones, contarNoLeidas, addNotification, shouldPlaySound, shouldShowToast, isTypeEnabled]);

    return null;
}

// 🔊 Función para reproducir sonido según tipo
function playSound(tipo = 'default') {
    if (!audioUnlocked) {
        console.log('⚠️ Audio aún no desbloqueado. Esperando interacción del usuario...');
        return;
    }

    try {
        if (!audioContext) return;

        const now = audioContext.currentTime;

        switch (tipo) {
            case 'nuevo_seguidor':
                playNote(523, now, 0.15, 0.2);
                playNote(659, now + 0.1, 0.15, 0.2);
                playNote(784, now + 0.2, 0.2, 0.3);
                break;

            case 'solicitud_aceptada':
                playNote(880, now, 0.25, 0.15);
                playNote(1047, now + 0.1, 0.3, 0.25);
                break;

            case 'nuevo_comentario':
                playNote(700, now, 0.2, 0.1);
                playNote(900, now + 0.05, 0.15, 0.1);
                break;

            case 'nuevo_like':
                playNote(1200, now, 0.25, 0.08);
                playNote(1400, now + 0.06, 0.2, 0.08);
                break;

            case 'nueva_resena':
                playNote(800, now, 0.2, 0.15);
                playNote(1000, now + 0.1, 0.2, 0.15);
                break;

            case 'mentor_acepto':
            case 'mentor_aprobado':
                playNote(523, now, 0.15, 0.12);
                playNote(659, now + 0.1, 0.15, 0.12);
                playNote(784, now + 0.2, 0.15, 0.12);
                playNote(1047, now + 0.3, 0.25, 0.2);
                break;

            case 'nuevo_apunte':
                playNote(600, now, 0.2, 0.12);
                playNote(800, now + 0.08, 0.2, 0.12);
                playNote(900, now + 0.16, 0.25, 0.15);
                break;

            case 'apunte_aprobado':
                playNote(700, now, 0.2, 0.1);
                playNote(900, now + 0.08, 0.2, 0.1);
                playNote(1100, now + 0.16, 0.3, 0.2);
                break;

            case 'system':
            case 'update':
                playNote(900, now, 0.25, 0.2);
                break;

            default:
                playNote(800, now, 0.2, 0.15);
                playNote(1000, now + 0.1, 0.2, 0.15);
        }

        console.log(`🔔 Sonido reproducido: ${tipo}`);
    } catch (error) {
        console.log('⚠️ Error al reproducir sonido:', error);
    }
}

function playNote(frequency, startTime, volume = 0.2, duration = 0.15) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}