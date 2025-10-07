import { useState } from 'react';
import { supabase } from '../supabase'; // Cambié la ruta

export const useSeguidores = () => {
    const [seguidores, setSeguidores] = useState([]);
    const [siguiendo, setSiguiendo] = useState([]);

    // Función auxiliar para obtener ID del usuario actual
    const obtenerMiUsuarioId = async () => {
        const { data, error } = await supabase.rpc('obtener_usuario_actual_id');
        if (error) throw error;
        return data;
    };

    // Seguir a un usuario
    const seguirUsuario = async (usuarioId) => {
        const { data, error } = await supabase
            .rpc('seguir_usuario', { usuario_a_seguir_id: usuarioId });

        if (error) throw error;
        if (data && data.error) throw new Error(data.error);

        return data; // Retorna { success: true, estado: 'pendiente' }
    };

    const aceptarSeguidor = async (seguidorId) => {
        const { data, error } = await supabase
            .rpc('responder_solicitud_seguidor', {
                seguidor_id: seguidorId,
                aceptar: true
            });

        if (error) throw error;
        return data;
    };

    const rechazarSeguidor = async (seguidorId) => {
        const { data, error } = await supabase
            .rpc('responder_solicitud_seguidor', {
                seguidor_id: seguidorId,
                aceptar: false
            });

        if (error) throw error;
        return data;
    };


    // Dejar de seguir
    const dejarSeguir = async (usuarioId) => {
        const miId = await obtenerMiUsuarioId();
        const { error } = await supabase
            .from('seguidores')
            .delete()
            .eq('seguidor_id', miId)
            .eq('seguido_id', usuarioId);

        if (error) throw error;
    };

    // Bloquear usuario
    const bloquearUsuario = async (usuarioId) => {
        const miId = await obtenerMiUsuarioId();
        const { error } = await supabase
            .from('bloqueos')
            .insert({
                bloqueador_id: miId,
                bloqueado_id: usuarioId
            });

        if (error) throw error;
    };

    // Obtener seguidores
    const obtenerSeguidores = async (usuarioId) => {
        const { data, error } = await supabase
            .from('seguidores')
            .select(`
                id,
                creado_en,
                seguidor:seguidor_id(*)
            `)
            .eq('seguido_id', usuarioId)
            .eq('estado', 'activo');

        if (error) throw error;
        return data;
    };

    // Obtener a quién sigue un usuario
    const obtenerSiguiendo = async (usuarioId) => {
        const { data, error } = await supabase
            .from('seguidores')
            .select(`
                id,
                creado_en,
                seguido:seguido_id(*)
            `)
            .eq('seguidor_id', usuarioId)
            .eq('estado', 'activo');

        if (error) throw error;
        return data;
    };

    return {
        seguidores,
        siguiendo,
        seguirUsuario,
        dejarSeguir,
        bloquearUsuario,
        obtenerSeguidores,
        obtenerSiguiendo,
        obtenerMiUsuarioId,
        aceptarSeguidor,
        rechazarSeguidor
    };
};