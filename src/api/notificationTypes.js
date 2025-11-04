import { supabase } from '../supabase';

/**
 * Crear notificación usando función RPC (bypasea RLS)
 */
async function createNotification({ usuarioId, tipo, emisorId, relacionId, mensaje }) {
    try {
        const { data, error } = await supabase.rpc('crear_notificacion', {
            p_usuario_id: Number(usuarioId),
            p_tipo: String(tipo),
            p_emisor_id: emisorId ? Number(emisorId) : null,
            p_relacion_id: relacionId ? Number(relacionId) : null,
            p_mensaje: String(mensaje),
        });

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
    async nuevoSeguidor(seguidorId, seguidoId, nombreSeguidor, usernameSeguidor = null) {
        return createNotification({
            usuarioId: seguidoId,
            tipo: 'nuevo_seguidor',
            emisorId: seguidorId,
            relacionId: null,
            mensaje: `${nombreSeguidor} comenzó a seguirte`,
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
     * ✨ NUEVA: Alguien agendó una clase contigo (para mentores)
     */
    async nuevaClaseAgendada(mentorUserId, estudianteId, nombreEstudiante, sesionId, fechaHora, materiaNombre) {
        // Formatear fecha y hora para el mensaje
        const fecha = new Date(fechaHora);
        const fechaFormateada = fecha.toLocaleDateString('es-UY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const horaFormateada = fecha.toLocaleTimeString('es-UY', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return createNotification({
            usuarioId: mentorUserId,
            tipo: 'nueva_clase_agendada',
            emisorId: estudianteId,
            relacionId: sesionId,
            mensaje: `${nombreEstudiante} agendó una clase de ${materiaNombre} para el ${fechaFormateada} a las ${horaFormateada}`,
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