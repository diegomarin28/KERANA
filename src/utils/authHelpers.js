import { supabase } from '../supabase';

/** Verifica si un username está disponible (case-insensitive) */
export async function isUsernameAvailable(username) {
    const clean = String(username || '').trim().toLowerCase();
    if (!clean || clean.length < 3) {
        return { ok: false, reason: 'El usuario debe tener al menos 3 caracteres' };
    }
    const { data, error } = await supabase
        .from('usuario')
        .select('id_usuario')
        .ilike('username', clean)
        .maybeSingle();
    if (error) return { ok: false, reason: error.message };
    return { ok: !data, reason: !data ? null : 'Ya está en uso' };
}

/**
 * Crea/actualiza perfil en 'usuario' usando authUser (obligatorio) y extras { nombre, username, foto }
 * - NO autogenera username. Si falta, devuelve error explícito.
 * - Si entra con Google y hay metadata, la usa como fallback para nombre/foto.
 */

export async function createOrUpdateUserProfile(authUser, extras = {}) {
    try {
        if (!authUser?.id) throw new Error('authUser.id es requerido');

        const nombreFromMeta =
            authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            (authUser.user_metadata?.given_name && authUser.user_metadata?.family_name
                ? `${authUser.user_metadata.given_name} ${authUser.user_metadata.family_name}`.trim()
                : null);

        const fotoFromMeta =
            authUser.user_metadata?.avatar_url ||
            authUser.user_metadata?.picture || null;

        const nombre = (extras.nombre || nombreFromMeta || authUser.email?.split('@')[0] || 'Usuario').trim();

        // ✅ PRIMERO: Verificar si ya existe un perfil para este usuario
        const { data: existingProfile, error: fetchError } = await supabase
            .from('usuario')
            .select('id_usuario, username, nombre, foto, creditos')
            .eq('auth_id', authUser.id)
            .maybeSingle();

        if (fetchError) {
            console.warn('Error buscando perfil existente:', fetchError);
        }

        // ✅ SI YA EXISTE EL PERFIL: Retornarlo directamente
        if (existingProfile) {
            console.log('✅ Perfil ya existe, retornando:', existingProfile.username);
            return { data: existingProfile, error: null };
        }

        let username = (extras.username || '').trim().toLowerCase();

        // ✅ SOLO generar username automático si no existe y no se proporcionó uno
        if (!username) {
            // Generar username base del email
            const baseUsername = authUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

            // Verificar si el username base está disponible
            const checkBase = await isUsernameAvailable(baseUsername);
            if (checkBase.ok) {
                username = baseUsername;
            } else {
                // Si no está disponible, generar uno con timestamp para evitar colisiones
                const timestamp = Date.now().toString().slice(-4);
                username = `${baseUsername}${timestamp}`;

                // Verificar solo una vez más
                const checkFinal = await isUsernameAvailable(username);
                if (!checkFinal.ok) {
                    // Último intento con random
                    const random = Math.floor(Math.random() * 1000);
                    username = `${baseUsername}${random}`;
                }
            }
        }

        if (!username) {
            return { data: null, error: new Error('No se pudo generar un username único') };
        }

        // ✅ Crear nuevo perfil
        const profile = {
            auth_id: authUser.id,
            correo: authUser.email,
            nombre,
            username,
            foto: extras.foto || fotoFromMeta || null,
            creditos: 10, // créditos iniciales
            fecha_creado: new Date().toISOString(),
        };

        console.log('🔄 Creando nuevo perfil:', profile);

        const { data, error } = await supabase
            .from('usuario')
            .insert(profile)
            .select()
            .single();

        if (error) {
            // Si hay error de duplicado, intentar con otro username
            if (error.code === '23505' && error.message.includes('username')) {
                const randomSuffix = Math.floor(Math.random() * 10000);
                profile.username = `${profile.username}${randomSuffix}`;

                const { data: retryData, error: retryError } = await supabase
                    .from('usuario')
                    .insert(profile)
                    .select()
                    .single();

                if (retryError) throw retryError;
                return { data: retryData, error: null };
            }
            throw error;
        }

        return { data, error: null };
    } catch (err) {
        console.error('[authHelpers] createOrUpdateUserProfile ERROR:', err);
        return { data: null, error: err };
    }
}

/** Obtiene perfil; si no existe, devuelve error para que la UI pida username */
export async function fetchUserProfile() {
    try {
        const { data: { user }, error: auErr } = await supabase.auth.getUser();
        if (auErr || !user) return { data: null, error: auErr || new Error('No hay sesión') };

        const { data: profile, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle();

        // ✅ CAMBIO: Si no hay perfil, devolver null sin error
        if (error) {
            // Solo loguear, no devolver como error
            console.warn('[fetchUserProfile] Error en query:', error);
            return { data: null, error: null }; // ← CAMBIO AQUÍ
        }

        if (!profile) {
            console.log('[fetchUserProfile] Perfil no existe aún');
            return { data: null, error: null }; // ← Y AQUÍ
        }

        return { data: profile, error: null };
    } catch (err) {
        console.error('[fetchUserProfile] Excepción:', err);
        return { data: null, error: null }; // ← Y AQUÍ
    }
}

/** Cierre de sesión limpio (igual que tenías) */
export async function cleanLogout() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-') || key.includes('user'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        await supabase.auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}
export async function ensureUniqueUsername(username) {
    const { data, error } = await supabase
        .from("usuario")
        .select("id_usuario", { count: "exact", head: true })
        .ilike("username", username);
    if (error) return false;
    return (data === null || data?.length === 0); // head:true => data null, usamos count en error?.count si preferís
}