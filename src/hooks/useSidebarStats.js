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

    // Obtener datos iniciales
    useEffect(() => {
        loadStats();
    }, []);

    // Suscripción realtime
    useEffect(() => {
        if (!userId) return;

        // Suscribirse a cambios en seguidores
        const seguidoresChannel = supabase
            .channel('sidebar-seguidores')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'seguidores',
                    filter: `seguidor_id=eq.${userId}`
                },
                () => loadFollowStats()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'seguidores',
                    filter: `seguido_id=eq.${userId}`
                },
                () => loadFollowStats()
            )
            .subscribe();

        // Suscribirse a cambios en créditos
        const usuarioChannel = supabase
            .channel('sidebar-usuario')
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
            .channel('sidebar-apuntes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'apunte',
                    filter: `id_usuario=eq.${userId}`
                },
                () => loadApuntesCount()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(seguidoresChannel);
            supabase.removeChannel(usuarioChannel);
            supabase.removeChannel(apuntesChannel);
        };
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
            .from('apunte')
            .select('id_apunte', { count: 'exact', head: true })
            .eq('id_usuario', userId);

        setStats(prev => ({ ...prev, apuntes: count || 0 }));
    };

    return { ...stats, loading };
}