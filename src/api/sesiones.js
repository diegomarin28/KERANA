import { supabase } from '../supabase.js';

export const sesionesAPI = {
    /**
     * Registrar una nueva sesión de mentoría
     */
    async registrarSesion(mentorId, alumnoId, fechaHora, materiaId = null, duracionMinutos = 60) {
        try {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .insert({
                    id_mentor: mentorId,
                    id_alumno: alumnoId,
                    id_materia: materiaId,
                    fecha_hora: fechaHora,
                    duracion_minutos: duracionMinutos,
                    estado: 'confirmada',
                    pagado: false
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Sesión registrada:', data);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error registrando sesión:', error);
            return { data: null, error };
        }
    },

    /**
     * Obtener sesiones de un mentor
     */
    async obtenerSesionesMentor(mentorId) {
        try {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .select(`
                    *,
                    alumno:id_alumno(nombre),
                    materia:id_materia(nombre_materia)
                `)
                .eq('id_mentor', mentorId)
                .order('fecha_hora', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error obteniendo sesiones:', error);
            return { data: null, error };
        }
    },

    /**
     * Obtener sesiones de un alumno
     */
    async obtenerSesionesAlumno(alumnoId) {
        try {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .select(`
                    *,
                    mentor:id_mentor(usuario:id_usuario(nombre)),
                    materia:id_materia(nombre_materia)
                `)
                .eq('id_alumno', alumnoId)
                .order('fecha_hora', { ascending: true });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error obteniendo sesiones:', error);
            return { data: null, error };
        }
    },

    /**
     * Actualizar estado de sesión
     */
    async actualizarEstadoSesion(sesionId, nuevoEstado) {
        try {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .update({ estado: nuevoEstado })
                .eq('id_sesion', sesionId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error actualizando estado:', error);
            return { data: null, error };
        }
    },

    /**
     * Cancelar sesión
     */
    async cancelarSesion(sesionId) {
        try {
            const { data, error } = await supabase
                .from('mentor_sesion')
                .update({ estado: 'cancelada' })
                .eq('id_sesion', sesionId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error cancelando sesión:', error);
            return { data: null, error };
        }
    }
};