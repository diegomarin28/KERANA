// src/components/NotificationsRealtimeSubscriber.jsx
import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useNotifications } from './NotificationProvider';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

const POLLING_INTERVAL = 10000; // 10 segundos

// 🔊 Audio context global para evitar el autoplay policy
let audioContext = null;
let audioUnlocked = false;

export default function NotificationsRealtimeSubscriber() {
    const { cargarNotificaciones, contarNoLeidas, notificaciones } = useNotificationsContext();
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
            // Hacer un check inmediato al volver online
            lastCheckRef.current = new Date(Date.now() - 30000); // Buscar últimos 30s
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

    // 🔓 Desbloquear audio con la primera interacción del usuario
    useEffect(() => {
        const unlockAudio = async () => {
            if (audioUnlocked) return;

            try {
                // Crear el audio context
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }

                // Intentar reproducir un sonido silencioso
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);

                audioUnlocked = true;
                console.log('🔓 Audio desbloqueado');

                // Remover listeners después de desbloquear
                document.removeEventListener('click', unlockAudio);
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            } catch (error) {
                console.log('⚠️ No se pudo desbloquear audio:', error);
            }
        };

        // Escuchar cualquier interacción del usuario
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
                // Obtener mi usuario ID
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                const { data: usuarioData } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .single();

                if (!usuarioData || cancelled) return;

                miUsuarioIdRef.current = usuarioData.id_usuario;


                // Función de polling
                const checkForNewNotifications = async () => {
                    if (cancelled) return;

                    if (!isOnlineRef.current) {
                        console.log('⏸️ Polling pausado (sin conexión)');
                        return;
                    }

                    try {
                        // Buscar notificaciones nuevas desde el último check
                        const { data: nuevasNotifs, error } = await supabase
                            .from('notificaciones')
                            .select(`
                                *,
                                emisor:usuario!notificaciones_emisor_id_fkey(
                                    id_usuario,
                                    nombre,
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

                        // Si hay notificaciones nuevas
                        if (nuevasNotifs && nuevasNotifs.length > 0) {

                            // Actualizar última verificación
                            lastCheckRef.current = new Date();

                            // Recargar lista completa
                            await cargarNotificaciones();
                            await contarNoLeidas();

                            // Mostrar cada notificación nueva
                            for (const notif of nuevasNotifs) {
                                // Verificar si el tipo está habilitado
                                if (!isTypeEnabled(notif.tipo)) {
                                    continue;
                                }

                                // Sonido
                                if (shouldPlaySound) {
                                    playSound(notif.tipo);
                                }

                                // Toast
                                if (shouldShowToast) {
                                    addNotification({
                                        id: notif.id,
                                        title: notif.emisor?.nombre || 'Nueva notificación',
                                        message: notif.mensaje,
                                        type: 'info',
                                        duration: 5000,
                                        avatar: notif.emisor?.foto,
                                    });
                                }
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error en checkForNewNotifications:', error);
                    }
                };

                // Ejecutar inmediatamente
                checkForNewNotifications();

                // Configurar intervalo
                intervalRef.current = setInterval(checkForNewNotifications, POLLING_INTERVAL);

            } catch (error) {
                console.error('❌ Error en setupPolling:', error);
            }
        };

        setupPolling();

        // Cleanup
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

// 🔊 Función mejorada para reproducir sonido según tipo
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
                // 🎵 Sonido ascendente alegre (Do-Mi-Sol)
                playNote(523, now, 0.15, 0.2);      // Do
                playNote(659, now + 0.1, 0.15, 0.2); // Mi
                playNote(784, now + 0.2, 0.2, 0.3);  // Sol
                break;

            case 'solicitud_aceptada':
                // 🎵 Sonido de éxito (ding brillante)
                playNote(880, now, 0.25, 0.15);      // La alto
                playNote(1047, now + 0.1, 0.3, 0.25); // Do alto
                break;

            case 'nuevo_comentario':
                // 🎵 Pop suave
                playNote(700, now, 0.2, 0.1);
                playNote(900, now + 0.05, 0.15, 0.1);
                break;

            case 'nuevo_like':
                // 💖 Sonido corto y brillante
                playNote(1200, now, 0.25, 0.08);
                playNote(1400, now + 0.06, 0.2, 0.08);
                break;

            case 'nueva_resenia':
                // 📝 Sonido de notificación estándar
                playNote(800, now, 0.2, 0.15);
                playNote(1000, now + 0.1, 0.2, 0.15);
                break;

            case 'mentor_acepto':
            case 'mentor_aprobado':
                // 🎓 Fanfarria de éxito (Do-Mi-Sol-Do)
                playNote(523, now, 0.15, 0.12);
                playNote(659, now + 0.1, 0.15, 0.12);
                playNote(784, now + 0.2, 0.15, 0.12);
                playNote(1047, now + 0.3, 0.25, 0.2);
                break;

            case 'nuevo_apunte':
                // 📚 Sonido de nuevo contenido
                playNote(600, now, 0.2, 0.12);
                playNote(800, now + 0.08, 0.2, 0.12);
                playNote(900, now + 0.16, 0.25, 0.15);
                break;

            case 'apunte_aprobado':
                // ✅ Sonido de aprobación
                playNote(700, now, 0.2, 0.1);
                playNote(900, now + 0.08, 0.2, 0.1);
                playNote(1100, now + 0.16, 0.3, 0.2);
                break;

            case 'system':
            case 'update':
                // 🔔 Campana simple del sistema
                playNote(900, now, 0.25, 0.2);
                break;

            default:
                // 🔔 Sonido por defecto
                playNote(800, now, 0.2, 0.15);
                playNote(1000, now + 0.1, 0.2, 0.15);
        }

        console.log(`🔔 Sonido reproducido: ${tipo}`);
    } catch (error) {
        console.log('⚠️ Error al reproducir sonido:', error);
    }
}

// Helper para tocar una nota individual
function playNote(frequency, startTime, volume = 0.2, duration = 0.15) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope (fade in/out)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}