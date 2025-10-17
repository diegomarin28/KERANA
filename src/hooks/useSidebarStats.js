import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useSeguidores } from './useSeguidores';

export function useSidebarStats() {
    const [stats, setStats] = useState({
        credits: 0,
        seguidores: 0,
        siguiendo: 0,
        apuntes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const { obtenerContadores } = useSeguidores();
    const isOnlineRef = useRef(navigator.onLine);

    // 🌐 Detectar cambios de conexión
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Stats: Conexión restaurada');
            isOnlineRef.current = true;
            // Recargar stats inmediatamente al volver online
            if (userId) loadStats();
        };

        const handleOffline = () => {
            console.log('📡 Stats: Conexión perdida');
            isOnlineRef.current = false;
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [userId]);

    // 1️⃣ Obtener datos iniciales
    useEffect(() => {
        loadStats();
    }, []);

    // 2️⃣ Suscripción realtime (intentamos primero con esto)
    useEffect(() => {
        if (!userId) return;

        // Suscribirse a cambios en seguidores
        const seguidoresChannel = supabase
            .channel(`sidebar-seguidores-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'seguidores',
                    filter: `id_seguidor=eq.${userId}`
                },
                () => {
                    loadFollowStats();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'seguidores',
                    filter: `id_seguido=eq.${userId}`
                },
                () => {
                    loadFollowStats();
                }
            )
            .subscribe();

        // Suscribirse a cambios en créditos
        const usuarioChannel = supabase
            .channel(`sidebar-usuario-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'usuario',
                    filter: `id_usuario=eq.${userId}`
                },
                (payload) => {
                    if (payload.new?.creditos !== undefined) {
                        setStats(prev => ({ ...prev, credits: payload.new.creditos }));
                    }
                }
            )
            .subscribe();

        // Suscribirse a cambios en apuntes
        const apuntesChannel = supabase
            .channel(`sidebar-apuntes-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'apunte',
                    filter: `id_usuario=eq.${userId}`
                },
                () => {
                    loadApuntesCount();
                }
            )
            .subscribe();

        return () => {
            console.log('🔌 Cerrando canales Realtime');
            supabase.removeChannel(seguidoresChannel);
            supabase.removeChannel(usuarioChannel);
            supabase.removeChannel(apuntesChannel);
        };
    }, [userId]);

    // 3️⃣ 🆕 POLLING como backup (cada 5 segundos)
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(() => {
            // 🛑 No hacer polling si no hay conexión
            if (!navigator.onLine || !isOnlineRef.current) {
                console.log('⏸️ Stats polling pausado (sin conexión)');
                return;
            }

            loadStats();
        }, 5000); // 5 segundos

        return () => clearInterval(interval);
    }, [userId]);

    const loadStats = async () => {
        // 🛑 No cargar si no hay conexión
        if (!navigator.onLine || !isOnlineRef.current) {
            return;
        }

        try {
            setLoading(true);

            // Obtener ID del usuario actual
            const { data: miIdData } = await supabase.rpc('obtener_usuario_actual_id');
            if (!miIdData) {
                setLoading(false);
                return;
            }

            setUserId(miIdData);

            // Cargar todos los stats en paralelo
            const [followStats, creditsData, apuntesCount] = await Promise.all([
                obtenerContadores(miIdData),
                supabase
                    .from('usuario')
                    .select('creditos')
                    .eq('id_usuario', miIdData)
                    .single(),
                supabase
                    .from('apunte')
                    .select('id_apunte', { count: 'exact', head: true })
                    .eq('id_usuario', miIdData)
            ]);

            setStats({
                credits: creditsData.data?.creditos || 0,
                seguidores: followStats.seguidores || 0,
                siguiendo: followStats.siguiendo || 0,
                apuntes: apuntesCount.count || 0,
            });

        } catch (error) {
            console.error('[useSidebarStats] Error:', error);
            // Si es error de red, marcar como offline
            if (error.message?.includes('Failed to fetch') ||
                error.message?.includes('ERR_CONNECTION') ||
                error.message?.includes('NetworkError')) {
                isOnlineRef.current = false;
            }
        } finally {
            setLoading(false);
        }
    };

    const loadFollowStats = async () => {
        if (!userId || !navigator.onLine || !isOnlineRef.current) return;

        try {
            const followStats = await obtenerContadores(userId);
            setStats(prev => ({
                ...prev,
                seguidores: followStats.seguidores || 0,
                siguiendo: followStats.siguiendo || 0,
            }));
        } catch (error) {
            console.error('[useSidebarStats] Error en loadFollowStats:', error);
            if (error.message?.includes('Failed to fetch') ||
                error.message?.includes('ERR_CONNECTION')) {
                isOnlineRef.current = false;
            }
        }
    };

    const loadApuntesCount = async () => {
        if (!userId || !navigator.onLine || !isOnlineRef.current) return;

        try {
            const { count } = await supabase
                .from('apunte')
                .select('id_apunte', { count: 'exact', head: true })
                .eq('id_usuario', userId);

            setStats(prev => ({ ...prev, apuntes: count || 0 }));
        } catch (error) {
            console.error('[useSidebarStats] Error en loadApuntesCount:', error);
            if (error.message?.includes('Failed to fetch') ||
                error.message?.includes('ERR_CONNECTION')) {
                isOnlineRef.current = false;
            }
        }
    };

    return { ...stats, loading };
}