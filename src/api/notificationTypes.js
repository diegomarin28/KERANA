import { supabase } from '../supabase';

/**
 * Crear notificación genérica
 */
async function createNotification({ usuarioId, tipo, emisorId, relacionId, mensaje }) {
    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .insert([{
                usuario_id: Number(usuarioId),
                tipo: String(tipo),
                emisor_id: emisorId ? Number(emisorId) : null,
                relacion_id: relacionId ? Number(relacionId) : null,
                mensaje: String(mensaje),
                leida: false,
            }])
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (e) {
        console.error('[notificationTypes] Error creando notificación:', e);
        return { data: null, error: e.message };
    }
}

// ============================================
// TIPOS DE NOTIFICACIONES
// ============================================

export const notificationTypes = {
    /**
     * Alguien te siguió
     */
    async nuevoSeguidor(seguidorId, seguidoId, nombreSeguidor) {
        return createNotification({
            usuarioId: seguidoId,
            tipo: 'nuevo_seguidor',
            emisorId: seguidorId,
            relacionId: null,
            mensaje: `${nombreSeguidor} comenzó a seguirte`,
        });
    },

    /**
     * Aceptaron tu solicitud de seguimiento
     */
    async solicitudAceptada(seguidorId, seguidoId, nombreSeguido) {
        return createNotification({
            usuarioId: seguidorId,
            tipo: 'solicitud_aceptada',
            emisorId: seguidoId,
            relacionId: null,
            mensaje: `${nombreSeguido} aceptó tu solicitud para seguirle`,
        });
    },

    /**
     * Alguien comentó en tu apunte
     */
    async nuevoComentario(autorApunteId, comentadorId, nombreComentador, apunteId, tituloApunte) {
        return createNotification({
            usuarioId: autorApunteId,
            tipo: 'nuevo_comentario',
            emisorId: comentadorId,
            relacionId: apunteId,
            mensaje: `${nombreComentador} comentó en tu apunte "${tituloApunte}"`,
        });
    },

    /**
     * Alguien dio like a tu apunte
     */
    async nuevoLike(autorApunteId, likerId, nombreLiker, apunteId, tituloApunte) {
        return createNotification({
            usuarioId: autorApunteId,
            tipo: 'nuevo_like',
            emisorId: likerId,
            relacionId: apunteId,
            mensaje: `A ${nombreLiker} le gustó tu apunte "${tituloApunte}"`,
        });
    },

    /**
     * Nueva reseña en una materia que seguís
     */
    async nuevaResenia(usuarioId, resenadorId, nombreResenador, materiaId, materiaNombre) {
        return createNotification({
            usuarioId: usuarioId,
            tipo: 'nueva_resenia',
            emisorId: resenadorId,
            relacionId: materiaId,
            mensaje: `${nombreResenador} dejó una reseña en ${materiaNombre}`,
        });
    },

    /**
     * Un mentor aceptó tu solicitud
     */
    async mentorAcepto(estudianteId, mentorId, nombreMentor, materiaId, materiaNombre) {
        return createNotification({
            usuarioId: estudianteId,
            tipo: 'mentor_acepto',
            emisorId: mentorId,
            relacionId: materiaId,
            mensaje: `${nombreMentor} aceptó ser tu mentor en ${materiaNombre}`,
        });
    },

    /**
     * Nuevo apunte en materia que seguís
     */
    async nuevoApunte(usuarioId, autorId, nombreAutor, apunteId, tituloApunte, materiaNombre) {
        return createNotification({
            usuarioId: usuarioId,
            tipo: 'nuevo_apunte',
            emisorId: autorId,
            relacionId: apunteId,
            mensaje: `${nombreAutor} subió "${tituloApunte}" en ${materiaNombre}`,
        });
    },

    /**
     * Tu apunte fue aprobado
     */
    async apunteAprobado(usuarioId, apunteId, tituloApunte) {
        return createNotification({
            usuarioId: usuarioId,
            tipo: 'apunte_aprobado',
            emisorId: null,
            relacionId: apunteId,
            mensaje: `Tu apunte "${tituloApunte}" fue aprobado y ya está visible`,
        });
    },

    /**
     * Tu aplicación de mentor fue aprobada
     */
    async mentorAprobado(usuarioId, materiaId, materiaNombre) {
        return createNotification({
            usuarioId: usuarioId,
            tipo: 'mentor_aprobado',
            emisorId: null,
            relacionId: materiaId,
            mensaje: `¡Felicitaciones! Fuiste aprobado como mentor de ${materiaNombre}`,
        });
    },

    /**
     * Notificación del sistema
     */
    async sistema(usuarioId, mensaje) {
        return createNotification({
            usuarioId: usuarioId,
            tipo: 'system',
            emisorId: null,
            relacionId: null,
            mensaje: mensaje,
        });
    },

    /**
     * Actualización de la plataforma
     */
    async actualizacion(usuarioId, mensaje) {
        return createNotification({
            usuarioId: usuarioId,
            tipo: 'update',
            emisorId: null,
            relacionId: null,
            mensaje: mensaje,
        });
    },
};

// ============================================
// EJEMPLO DE USO:
// ============================================

/*
// Cuando alguien comenta en un apunte:
import { notificationTypes } from '../api/notificationTypes';

await notificationTypes.nuevoComentario(
  autorApunteId,      // ID del dueño del apunte
  comentadorId,       // ID de quien comenta
  'Juan Pérez',       // Nombre de quien comenta
  123,                // ID del apunte
  'Resumen de Álgebra' // Título del apunte
);
*/