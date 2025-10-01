// src/api/userService.js
import { supabase } from '../supabase';

export async function getOrCreateUserProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('No hay usuario autenticado');
    }

    // Buscar por auth_id (el ID real de Supabase)
    const { data: existing } = await supabase
        .from('usuario')
        .select('id_usuario, nombre, username, correo, creditos, auth_id')
        .eq('auth_id', user.id)
        .maybeSingle();

    if (existing) {
        return existing;
    }

    // Crear perfil con auth_id
    const username = user.user_metadata?.name || user.email.split('@')[0];
    const { data: newProfile, error: insertError } = await supabase
        .from('usuario')
        .insert({
            auth_id: user.id, // 👈 CLAVE: usamos el ID de Supabase
            correo: user.email.toLowerCase().trim(),
            nombre: user.user_metadata?.name || username,
            username: username.slice(0, 32),
            fecha_creado: new Date().toISOString(),
            creditos: 0
        })
        .select()
        .single();

    if (insertError) throw insertError;
    return newProfile;
}