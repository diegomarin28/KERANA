import { supabase } from '../supabase';

export const followersAPI = {
    /**
     * Seguir a un usuario
     * @param {number} usuarioId - ID del usuario a seguir
     * @returns {Promise<{success: boolean, estado?: string, error?: string}>}
     */
    async seguirUsuario(usuarioId) {
        try {
            const { data, error } = await supabase.rpc('seguir_usuario', {
                usuario_a_seguir_id: Number(usuarioId)
            });

            if (error) {
                console.error('[followersAPI] Error en seguir_usuario:', error);
                return { success: false, error: error.message };
            }

            return data;
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
            // Obtener mi ID
            const { data: miId } = await supabase.rpc('obtener_usuario_actual_id');
            if (!miId) {
                return { success: false, error: 'No autenticado' };
            }

            // Eliminar relación
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
            const { data: miId } = await supabase.rpc('obtener_usuario_actual_id');
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
    },

    /**
     * Responder a solicitud de seguidor (aceptar/rechazar)
     * @param {number} seguidorId - ID del seguidor
     * @param {boolean} aceptar - true para aceptar, false para rechazar
     */
    async responderSolicitud(seguidorId, aceptar) {
        try {
            const { data, error } = await supabase.rpc('responder_solicitud_seguidor', {
                seguidor_id: Number(seguidorId),
                aceptar: Boolean(aceptar)
            });

            if (error) {
                console.error('[followersAPI] Error respondiendo solicitud:', error);
                return { ok: false, error: error.message };
            }

            return data;
        } catch (e) {
            console.error('[followersAPI] Exception en responderSolicitud:', e);
            return { ok: false, error: e.message };
        }
    }
};