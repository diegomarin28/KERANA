import { supabase } from '../supabase';

/**
 * Sube avatar del usuario a Supabase Storage
 * @param {File} file - Archivo de imagen
 * @param {string} userId - ID del usuario (auth_id)
 * @returns {Promise<{url: string|null, error: any}>}
 */
export async function uploadAvatar(file, userId) {
    try {
        // Validar archivo
        if (!file) {
            return { url: null, error: new Error('No se seleccionó ningún archivo') };
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            return { url: null, error: new Error('El archivo debe ser una imagen') };
        }

        // Validar tamaño (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return { url: null, error: new Error('La imagen no puede superar los 5MB') };
        }

        // Generar nombre único
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/avatar.${fileExt}`;

        // Eliminar avatar anterior si existe
        await supabase.storage
            .from('avatars')
            .remove([fileName]);

        // Subir nueva imagen
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Error subiendo avatar:', uploadError);
            return { url: null, error: uploadError };
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return { url: publicUrl, error: null };
    } catch (error) {
        console.error('Error en uploadAvatar:', error);
        return { url: null, error };
    }
}

/**
 * Elimina el avatar del usuario
 * @param {string} userId - ID del usuario (auth_id)
 */
export async function deleteAvatar(userId) {
    try {
        const { data: files } = await supabase.storage
            .from('avatars')
            .list(userId);

        if (files && files.length > 0) {
            const filePaths = files.map(file => `${userId}/${file.name}`);
            await supabase.storage
                .from('avatars')
                .remove(filePaths);
        }

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}