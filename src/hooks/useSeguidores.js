import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSeguidores = () => {
    const [seguidores, setSeguidores] = useState([]);
    const [siguiendo, setSiguiendo] = useState([]);

    // Seguir a un usuario
    const seguirUsuario = async (usuarioId) => {
        const { data, error } = await supabase
            .rpc('seguir_usuario', { usuario_a_seguir_id: usuarioId });

        if (error) throw error;
        return data;
    };

    // Dejar de seguir
    const dejarSeguir = async (usuarioId) => {
        const { error } = await supabase
            .from('seguidores')
            .delete()
            .eq('seguidor_id', (await supabase.auth.getUser()).data.user.id)
            .eq('seguido_id', usuarioId);

        if (error) throw error;
    };

    // Bloquear usuario
    const bloquearUsuario = async (usuarioId) => {
        const { error } = await supabase
            .from('bloqueos')
            .insert({ bloqueador_id: (await supabase.auth.getUser()).data.user.id, bloqueado_id: usuarioId });

        if (error) throw error;
    };

    // Obtener seguidores
    const obtenerSeguidores = async (usuarioId) => {
        const { data, error } = await supabase
            .from('seguidores')
            .select(`
        seguidor_id,
        usuario:seguidor_id(*)
      `)
            .eq('seguido_id', usuarioId)
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
        obtenerSeguidores
    };
};