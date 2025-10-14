import { useState, useCallback } from 'react';
import { followersAPI } from '../api/followers';

export function useSeguidores() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Obtener mi ID de usuario desde auth
     */
    const obtenerMiUsuarioId = useCallback(async () => {
        try {
            const { data: { user }, error: authError } = await (await import('../supabase')).supabase.auth.getUser();

            if (authError || !user) {
                console.error('[useSeguidores] Error obteniendo user auth:', authError);
                return null;
            }

            const { data, error: dbError } = await (await import('../supabase')).supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (dbError || !data) {
                console.error('[useSeguidores] Error obteniendo id_usuario:', dbError);
                return null;
            }

            return data.id_usuario;
        } catch (e) {
            console.error('[useSeguidores] Exception en obtenerMiUsuarioId:', e);
            return null;
        }
    }, []);

    /**
     * Seguir a un usuario
     */
    const seguirUsuario = useCallback(async (usuarioId) => {
        try {
            setLoading(true);
            setError(null);

            const result = await followersAPI.seguirUsuario(usuarioId);

            if (!result.success) {
                setError(result.error);
                return { success: false, error: result.error };
            }

            return { success: true, estado: result.estado };
        } catch (e) {
            const errorMsg = e.message || 'Error al seguir usuario';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Dejar de seguir a un usuario
     */
    const dejarDeSeguir = useCallback(async (usuarioId) => {
        try {
            setLoading(true);
            setError(null);

            const result = await followersAPI.dejarDeSeguir(usuarioId);

            if (!result.success) {
                setError(result.error);
                return { success: false, error: result.error };
            }

            return { success: true };
        } catch (e) {
            const errorMsg = e.message || 'Error al dejar de seguir';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Verificar si sigo a un usuario
     */
    const verificarSiSigue = useCallback(async (usuarioId) => {
        try {
            const result = await followersAPI.verificarSiSigue(usuarioId);
            return result;
        } catch (e) {
            console.error('[useSeguidores] Error verificando:', e);
            return { sigue: false };
        }
    }, []);

    /**
     * Obtener seguidores de un usuario
     */
    const obtenerSeguidores = useCallback(async (usuarioId) => {
        try {
            setLoading(true);
            setError(null);

            const result = await followersAPI.obtenerSeguidores(usuarioId);

            if (result.error) {
                setError(result.error);
                return { data: [], error: result.error };
            }

            return { data: result.data, error: null };
        } catch (e) {
            const errorMsg = e.message || 'Error obteniendo seguidores';
            setError(errorMsg);
            return { data: [], error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Obtener usuarios que sigue
     */
    const obtenerSiguiendo = useCallback(async (usuarioId) => {
        try {
            setLoading(true);
            setError(null);

            const result = await followersAPI.obtenerSiguiendo(usuarioId);

            if (result.error) {
                setError(result.error);
                return { data: [], error: result.error };
            }

            return { data: result.data, error: null };
        } catch (e) {
            const errorMsg = e.message || 'Error obteniendo siguiendo';
            setError(errorMsg);
            return { data: [], error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Obtener contadores
     */
    const obtenerContadores = useCallback(async (usuarioId) => {
        try {
            const result = await followersAPI.obtenerContadores(usuarioId);
            return result;
        } catch (e) {
            console.error('[useSeguidores] Error obteniendo contadores:', e);
            return { seguidores: 0, siguiendo: 0 };
        }
    }, []);

    /**
     * Toggle seguir/dejar de seguir
     */
    const toggleSeguir = useCallback(async (usuarioId, siguiendo) => {
        if (siguiendo) {
            return await dejarDeSeguir(usuarioId);
        } else {
            return await seguirUsuario(usuarioId);
        }
    }, [seguirUsuario, dejarDeSeguir]);

    return {
        // Estado
        loading,
        error,

        // Acciones
        seguirUsuario,
        dejarDeSeguir,
        toggleSeguir,

        // Queries
        verificarSiSigue,
        obtenerSeguidores,
        obtenerSiguiendo,
        obtenerContadores,
        obtenerMiUsuarioId,
    };
}

export default useSeguidores;