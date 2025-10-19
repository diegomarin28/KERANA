import { supabase } from '../supabase';
import { notificationTypes } from './notificationTypes';

export const followersAPI = {
    /**
     * Obtener mi ID de usuario actual
     */
    async obtenerMiId() {
        try {
            const { data: miId } = await supabase.rpc('obtener_usuario_actual_id');
            return miId;
        } catch (e) {
            console.error('[followersAPI] Error obteniendo mi ID:', e);
            return null;
        }
    },

    /**
     * Seguir a un usuario (directo, sin pendientes)
     * @param {number} usuarioId - ID del usuario a seguir
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async seguirUsuario(usuarioId) {
        try {
            const miId = await this.obtenerMiId();
            if (!miId) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            // Primero verificar si ya lo sigo
            const { data: existente } = await supabase
                .from('seguidores')
                .select('id')
                .eq('seguidor_id', miId)
                .eq('seguido_id', Number(usuarioId))
                .maybeSingle();

            if (existente) {
                // Ya lo sigo
                return { success: true, alreadyFollowing: true };
            }

            // Insertar relación directamente con estado 'activo'
            const { data, error } = await supabase
                .from('seguidores')
                .insert({
                    seguidor_id: miId,
                    seguido_id: Number(usuarioId),
                    estado: 'activo'
                })
                .select();

            if (error) {
                console.error('[followersAPI] Error en seguirUsuario:', error);
                return { success: false, error: error.message };
            }

            // ✅ CREAR NOTIFICACIÓN
            try {
                // Obtener mi nombre y username
                const { data: miUsuario } = await supabase
                    .from('usuario')
                    .select('nombre, username')
                    .eq('id_usuario', miId)
                    .single();

                const miNombre = miUsuario?.nombre || miUsuario?.username || 'Alguien';
                const miUsername = miUsuario?.username || null;

                // Crear notificación para el usuario seguido
                await notificationTypes.nuevoSeguidor(
                    miId,           // ID de quien sigue
                    usuarioId,      // ID de quien recibe la notificación
                    miNombre,       // Nombre de quien sigue
                    miUsername      // Username de quien sigue
                );

                console.log('✅ Notificación de seguidor creada');
            } catch (notifError) {
                console.error('⚠️ Error creando notificación (no crítico):', notifError);
                // No fallar toda la operación si falla la notificación
            }

            return { success: true };
        } catch (e) {
            console.error('[followersAPI] Exception en seguirUsuario:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Dejar de seguir a un usuario
     * @param {number} usuarioId - ID del usuario a dejar de seguir
     */
    async dejarDeSeguir(usuarioId) {
        try {
            const miId = await this.obtenerMiId();
            if (!miId) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase
                .from('seguidores')
                .delete()
                .eq('seguidor_id', miId)
                .eq('seguido_id', Number(usuarioId));

            if (error) {
                console.error('[followersAPI] Error en dejarDeSeguir:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (e) {
            console.error('[followersAPI] Exception en dejarDeSeguir:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Verificar si sigo a un usuario
     * @param {number} usuarioId - ID del usuario a verificar
     */
    async verificarSiSigue(usuarioId) {
        try {
            const miId = await this.obtenerMiId();
            if (!miId) return { sigue: false };

            const { data, error } = await supabase
                .from('seguidores')
                .select('id, estado')
                .eq('seguidor_id', miId)
                .eq('seguido_id', Number(usuarioId))
                .maybeSingle();

            if (error) {
                console.error('[followersAPI] Error verificando:', error);
                return { sigue: false };
            }

            return {
                sigue: !!data,
                estado: data?.estado || null
            };
        } catch (e) {
            console.error('[followersAPI] Exception en verificarSiSigue:', e);
            return { sigue: false };
        }
    },

    /**
     * Obtener seguidores de un usuario
     * @param {number} usuarioId - ID del usuario
     */
    async obtenerSeguidores(usuarioId) {
        try {
            const { data, error } = await supabase
                .from('seguidores')
                .select(`
          id,
          creado_en,
          estado,
          seguidor:usuario!seguidores_seguidor_id_fkey(
            id_usuario,
            nombre,
            username,
            foto
          )
        `)
                .eq('seguido_id', Number(usuarioId))
                .eq('estado', 'activo')
                .order('creado_en', { ascending: false });

            if (error) {
                console.error('[followersAPI] Error obteniendo seguidores:', error);
                return { data: [], error: error.message };
            }

            return { data: data || [], error: null };
        } catch (e) {
            console.error('[followersAPI] Exception en obtenerSeguidores:', e);
            return { data: [], error: e.message };
        }
    },

    /**
     * Obtener usuarios que sigue
     * @param {number} usuarioId - ID del usuario
     */
    async obtenerSiguiendo(usuarioId) {
        try {
            const { data, error } = await supabase
                .from('seguidores')
                .select(`
          id,
          creado_en,
          estado,
          seguido:usuario!seguidores_seguido_id_fkey(
            id_usuario,
            nombre,
            username,
            foto
          )
        `)
                .eq('seguidor_id', Number(usuarioId))
                .eq('estado', 'activo')
                .order('creado_en', { ascending: false });

            if (error) {
                console.error('[followersAPI] Error obteniendo siguiendo:', error);
                return { data: [], error: error.message };
            }

            return { data: data || [], error: null };
        } catch (e) {
            console.error('[followersAPI] Exception en obtenerSiguiendo:', e);
            return { data: [], error: e.message };
        }
    },

    /**
     * Obtener contadores de seguidores/siguiendo
     * @param {number} usuarioId - ID del usuario
     */
    async obtenerContadores(usuarioId) {
        try {
            const { data: seguidoresCount } = await supabase.rpc(
                'obtener_seguidores_count',
                { p_usuario_id: Number(usuarioId) }
            );

            const { data: siguiendoCount } = await supabase.rpc(
                'obtener_siguiendo_count',
                { p_usuario_id: Number(usuarioId) }
            );

            return {
                seguidores: seguidoresCount || 0,
                siguiendo: siguiendoCount || 0
            };
        } catch (e) {
            console.error('[followersAPI] Exception en obtenerContadores:', e);
            return { seguidores: 0, siguiendo: 0 };
        }
    }
};