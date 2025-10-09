import { supabase } from '../supabase';

export const notificationsAPI = {
    /**
     * Obtener mis notificaciones
     * @param {number} limit - Límite de notificaciones a traer
     */
    async obtenerMisNotificaciones(limit = 50) {
        try {
            const { data: miId } = await supabase.rpc('obtener_usuario_actual_id');
            if (!miId) {
                return { data: [], error: 'No autenticado' };
            }

            const { data, error } = await supabase
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
                .eq('usuario_id', miId)
                .order('creado_en', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('[notificationsAPI] Error obteniendo notificaciones:', error);
                return { data: [], error: error.message };
            }

            return { data: data || [], error: null };
        } catch (e) {
            console.error('[notificationsAPI] Exception en obtenerMisNotificaciones:', e);
            return { data: [], error: e.message };
        }
    },

    /**
     * Contar notificaciones no leídas
     */
    async contarNoLeidas() {
        try {
            const { data: miId } = await supabase.rpc('obtener_usuario_actual_id');
            if (!miId) return { count: 0 };

            const { count, error } = await supabase
                .from('notificaciones')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', miId)
                .eq('leida', false);

            if (error) {
                console.error('[notificationsAPI] Error contando no leídas:', error);
                return { count: 0 };
            }

            return { count: count || 0 };
        } catch (e) {
            console.error('[notificationsAPI] Exception en contarNoLeidas:', e);
            return { count: 0 };
        }
    },

    /**
     * Marcar una notificación como leída
     * @param {number} notifId - ID de la notificación
     */
    async marcarComoLeida(notifId) {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('id', notifId);

            if (error) {
                console.error('[notificationsAPI] Error marcando como leída:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            console.error('[notificationsAPI] Exception en marcarComoLeida:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Marcar todas como leídas
     */
    async marcarTodasLeidas() {
        try {
            const { data: miId } = await supabase.rpc('obtener_usuario_actual_id');
            if (!miId) {
                return { success: false, error: 'No autenticado' };
            }

            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true })
                .eq('usuario_id', miId)
                .eq('leida', false);

            if (error) {
                console.error('[notificationsAPI] Error marcando todas:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            console.error('[notificationsAPI] Exception en marcarTodasLeidas:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Eliminar una notificación
     * @param {number} notifId - ID de la notificación
     */
    async eliminarNotificacion(notifId) {
        try {
            const { error } = await supabase
                .from('notificaciones')
                .delete()
                .eq('id', notifId);

            if (error) {
                console.error('[notificationsAPI] Error eliminando:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            console.error('[notificationsAPI] Exception en eliminarNotificacion:', e);
            return { success: false, error: e.message };
        }
    }
};