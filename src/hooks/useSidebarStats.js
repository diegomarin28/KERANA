import { useState, useEffect } from 'react';
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

    // 1️⃣ Obtener datos iniciales
    useEffect(() => {
        loadStats();
    }, []);

    // 2️⃣ Suscripción realtime (intentamos primero con esto)
    useEffect(() => {
        if (!userId) return;

        console.log('🔌 Iniciando suscripciones Realtime para userId:', userId);

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
                    console.log('👥 Siguiendo actualizado (Realtime)');
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
                    console.log('👥 Seguidores actualizado (Realtime)');
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
                    table: 'usuarios',
                    filter: `id_usuario=eq.${userId}`
                },
                (payload) => {
                    console.log('💰 Créditos actualizados (Realtime):', payload.new?.creditos);
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
                    table: 'apuntes',
                    filter: `id_usuario=eq.${userId}`
                },
                () => {
                    console.log('📚 Apuntes actualizado (Realtime)');
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

    // 3️⃣ 🆕 POLLING como backup (cada 10 segundos)
    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(() => {
            console.log('🔄 Actualizando stats (polling cada 10s)...');
            loadStats();
        }, 5000); // 5 segundos

        return () => clearInterval(interval);
    }, [userId]);

    const loadStats = async () => {
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
        } finally {
            setLoading(false);
        }
    };

    const loadFollowStats = async () => {
        if (!userId) return;
        const followStats = await obtenerContadores(userId);
        setStats(prev => ({
            ...prev,
            seguidores: followStats.seguidores || 0,
            siguiendo: followStats.siguiendo || 0,
        }));
    };

    const loadApuntesCount = async () => {
        if (!userId) return;
        const { count } = await supabase
            .from('apuntes')
            .select('id_apunte', { count: 'exact', head: true })
            .eq('id_usuario', userId);

        setStats(prev => ({ ...prev, apuntes: count || 0 }));
    };

    return { ...stats, loading };
}