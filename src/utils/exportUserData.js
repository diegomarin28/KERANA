// src/utils/exportUserData.js
import { supabase } from '../supabase';

/**
 * Exporta todos los datos del usuario a un archivo JSON
 */
export async function exportUserData() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No hay usuario autenticado');
        }

        // Obtener perfil
        const { data: perfil } = await supabase
            .from('usuario')
            .select('*')
            .eq('auth_id', user.id)
            .single();

        if (!perfil) {
            throw new Error('No se encontró el perfil del usuario');
        }

        // Obtener notificaciones
        const { data: notificaciones } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('usuario_id', perfil.id_usuario);

        // Obtener seguidores
        const { data: seguidores } = await supabase
            .from('seguidores')
            .select('*')
            .or(`seguidor_id.eq.${perfil.id_usuario},seguido_id.eq.${perfil.id_usuario}`);

        // Obtener apuntes subidos
        const { data: apuntes } = await supabase
            .from('apunte')
            .select('*, thumbnail_path')
            .eq('id_usuario', perfil.id_usuario);

        // Obtener favoritos de apuntes
        const { data: favoritosApuntes } = await supabase
            .from('apunte_fav')
            .select('*')
            .eq('id_usuario', perfil.id_usuario);

        // Obtener ratings/reseñas
        const { data: ratings } = await supabase
            .from('rating')
            .select('*')
            .eq('user_id', perfil.id_usuario);

        // Obtener datos de mentor (si aplica)
        const { data: mentor } = await supabase
            .from('mentor')
            .select('*')
            .eq('id_usuario', perfil.id_usuario)
            .maybeSingle();

        let mentorData = null;
        if (mentor) {
            // Obtener materias del mentor
            const { data: mentorMaterias } = await supabase
                .from('mentor_materia')
                .select('*, materia(*)')
                .eq('id_mentor', mentor.id_mentor);

            // Obtener disponibilidad
            const { data: disponibilidad } = await supabase
                .from('mentor_disponibilidad')
                .select('*')
                .eq('id_mentor', mentor.id_mentor);

            // Obtener sesiones
            const { data: sesiones } = await supabase
                .from('mentor_sesion')
                .select('*')
                .eq('id_mentor', mentor.id_mentor);

            mentorData = {
                ...mentor,
                materias: mentorMaterias || [],
                disponibilidad: disponibilidad || [],
                sesiones: sesiones || [],
            };
        }

        // Construir objeto completo
        const userData = {
            exportado_en: new Date().toISOString(),
            version: '1.0',
            usuario: {
                auth_id: user.id,
                email: user.email,
                creado_en: user.created_at,
                perfil: {
                    ...perfil,
                    // Remover datos sensibles si es necesario
                    // auth_id: undefined,
                },
            },
            estadisticas: {
                total_notificaciones: notificaciones?.length || 0,
                total_seguidores: seguidores?.filter(s => s.seguido_id === perfil.id_usuario).length || 0,
                total_siguiendo: seguidores?.filter(s => s.seguidor_id === perfil.id_usuario).length || 0,
                total_apuntes: apuntes?.length || 0,
                total_favoritos: favoritosApuntes?.length || 0,
                total_reseñas: ratings?.length || 0,
                es_mentor: !!mentor,
            },
            notificaciones: notificaciones || [],
            seguidores: seguidores || [],
            apuntes: apuntes || [],
            favoritos: favoritosApuntes || [],
            reseñas: ratings || [],
            mentor: mentorData,
        };

        return userData;
    } catch (error) {
        console.error('Error exportando datos:', error);
        throw error;
    }
}

/**
 * Descarga los datos como archivo JSON
 */
export async function downloadUserData() {
    try {
        const data = await exportUserData();

        // Convertir a JSON con formato bonito
        const jsonString = JSON.stringify(data, null, 2);

        // Crear blob
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Crear URL temporal
        const url = URL.createObjectURL(blob);

        // Crear elemento de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `kerana-mis-datos-${new Date().toISOString().split('T')[0]}.json`;

        // Trigger download
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error descargando datos:', error);
        return false;
    }
}

/**
 * Obtiene un resumen de los datos del usuario
 */
export async function getUserDataSummary() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: perfil } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('auth_id', user.id)
            .single();

        if (!perfil) return null;

        // Contar en paralelo
        const [
            { count: notifCount },
            { count: apuntesCount },
            { count: favCount },
            { count: ratingsCount },
        ] = await Promise.all([
            supabase.from('notificaciones').select('*', { count: 'exact', head: true }).eq('usuario_id', perfil.id_usuario),
            supabase.from('apunte').select('*', { count: 'exact', head: true }).eq('id_usuario', perfil.id_usuario),
            supabase.from('apunte_fav').select('*', { count: 'exact', head: true }).eq('id_usuario', perfil.id_usuario),
            supabase.from('rating').select('*', { count: 'exact', head: true }).eq('user_id', perfil.id_usuario),
        ]);

        return {
            notificaciones: notifCount || 0,
            apuntes: apuntesCount || 0,
            favoritos: favCount || 0,
            reseñas: ratingsCount || 0,
        };
    } catch (error) {
        console.error('Error obteniendo resumen:', error);
        return null;
    }
}