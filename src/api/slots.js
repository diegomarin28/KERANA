import { supabase } from '../supabase.js';

export const slotsAPI = {
    /**
     * Guardar slots manualmente configurados por el mentor
     * Elimina los slots existentes de esa fecha y crea los nuevos
     * @param {string} mentorId - ID del mentor
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @param {Array<Object|string>} horarios - Array de horarios con duración o strings simples
     *   Ejemplo: [{hora: '09:00', duracion: 60}, {hora: '10:30', duracion: 90}]
     *   O simplemente: ['09:00', '10:30'] (usa duración por defecto)
     */
    async guardarSlotsManual(mentorId, fecha, slotsConDuracion, duracionDefault) {
        const { data, error } = await supabase
            .from('slots_disponibles')
            .upsert(
                slotsConDuracion.map(slot => ({
                    id_mentor: mentorId,
                    fecha: fecha,
                    hora: slot.hora,
                    duracion: slot.duracion || duracionDefault,
                    modalidad: slot.modalidad || 'zoom', // 👈 Ahora se guardará
                    disponible: true,
                    origen: 'manual'
                })),
                {
                    onConflict: 'id_mentor,fecha,hora',
                    ignoreDuplicates: false
                }
            );

        return { data, error };
    },
    /**
     * Obtener slots configurados por el mentor en un rango de fechas
     */
    async obtenerSlotsConfigurados(mentorId, fechaInicio, fechaFin) {
        const { data, error } = await supabase
            .from('slots_disponibles')
            .select('id_slot, fecha, hora, duracion, modalidad, disponible') // 👈 Agregar modalidad
            .eq('id_mentor', mentorId)
            .gte('fecha', fechaInicio)
            .lte('fecha', fechaFin)
            .eq('disponible', true)
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        return { data, error };
    },
    /**
     * Eliminar todos los slots manuales de una fecha específica
     */
    async eliminarSlotsFecha(mentorId, fecha) {
        try {
            const { data, error } = await supabase
                .from('slots_disponibles')
                .delete()
                .eq('id_mentor', mentorId)
                .eq('fecha', fecha)
                .eq('origen', 'manual');

            if (error) throw error;

            console.log('🗑️ Slots eliminados para fecha:', fecha);
            return { data: { success: true }, error: null };
        } catch (error) {
            console.error('❌ Error eliminando slots:', error);
            return { data: null, error };
        }
    },

    /**
     * Obtener todos los slots disponibles (para el calendario global)
     * Incluye información del mentor y duración
     */
    async obtenerSlotsDisponiblesGlobal(fechaInicio, fechaFin) {
        try {
            const { data, error } = await supabase
                .from('slots_disponibles')
                .select(`
                *,
                mentor:id_mentor (
                    id_mentor,
                    max_alumnos,
                    usuario:id_usuario (
                        nombre
                    ),
                    mentor_materia!inner (
                        id_materia
                    )
                )
            `)
                .eq('disponible', true)
                .is('reservado_por', null)
                .gte('fecha', fechaInicio)
                .lte('fecha', fechaFin)
                .order('fecha', { ascending: true })
                .order('hora', { ascending: true });

            if (error) throw error;

            console.log('🌍 Slots disponibles globales:', data?.length || 0);
            return { data: data || [], error: null };
        } catch (error) {
            console.error('❌ Error obteniendo slots disponibles:', error);
            return { data: [], error };
        }
    },

    /**
     * Reservar temporalmente un slot (cuando un estudiante inicia el proceso de agendado)
     * La reserva expira en 5 minutos
     */
    async reservarSlotTemporalmente(slotId, usuarioId) {
        try {
            const expiracion = new Date();
            expiracion.setMinutes(expiracion.getMinutes() + 5); // 5 minutos

            const { data, error } = await supabase
                .from('slots_disponibles')
                .update({
                    disponible: false,
                    reservado_por: usuarioId,
                    reservado_hasta: expiracion.toISOString()
                })
                .eq('id_slot', slotId)
                .eq('disponible', true) // Solo si está disponible
                .is('reservado_por', null)
                .select()
                .single();

            if (error) throw error;

            console.log('⏳ Slot reservado temporalmente:', slotId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error reservando slot:', error);
            return { data: null, error };
        }
    },

    /**
     * Confirmar una reserva (cuando el estudiante completa el agendado)
     */
    async confirmarReserva(slotId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('slots_disponibles')
                .update({
                    disponible: false,
                    reservado_por: usuarioId,
                    reservado_hasta: null // Ya no expira, está confirmado
                })
                .eq('id_slot', slotId)
                .eq('reservado_por', usuarioId)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Reserva confirmada:', slotId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error confirmando reserva:', error);
            return { data: null, error };
        }
    },

    /**
     * Cancelar una reserva temporal
     */
    async cancelarReservaTemporalmente(slotId, usuarioId) {
        try {
            const { data, error } = await supabase
                .from('slots_disponibles')
                .update({
                    disponible: true,
                    reservado_por: null,
                    reservado_hasta: null
                })
                .eq('id_slot', slotId)
                .eq('reservado_por', usuarioId)
                .select()
                .single();

            if (error) throw error;

            console.log('❌ Reserva cancelada:', slotId);
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error cancelando reserva:', error);
            return { data: null, error };
        }
    },

    /**
     * Limpiar reservas expiradas (debe ejecutarse periódicamente)
     */
    async limpiarReservasExpiradas() {
        try {
            const ahora = new Date().toISOString();

            const { data, error } = await supabase
                .from('slots_disponibles')
                .update({
                    disponible: true,
                    reservado_por: null,
                    reservado_hasta: null
                })
                .lt('reservado_hasta', ahora)
                .not('reservado_hasta', 'is', null);

            if (error) throw error;

            console.log('🧹 Reservas expiradas limpiadas');
            return { data: { success: true }, error: null };
        } catch (error) {
            console.error('❌ Error limpiando reservas expiradas:', error);
            return { data: null, error };
        }
    },

    /**
     * Obtener un slot por mentor, fecha y hora específica
     */
    async obtenerSlotPorDetalle(mentorId, fecha, hora) {
        try {
            const { data, error } = await supabase
                .from('slots_disponibles')
                .select('*')
                .eq('id_mentor', mentorId)
                .eq('fecha', fecha)
                .eq('hora', hora)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('❌ Error obteniendo slot:', error);
            return { data: null, error };
        }
    },

    /**
     * NUEVA: Validar que no haya solapamiento de horarios
     * @param {string} mentorId - ID del mentor
     * @param {string} fecha - Fecha en formato YYYY-MM-DD
     * @param {Array<Object>} slots - Array de {hora, duracion}
     * @returns {Object} {valido: boolean, solapamientos: Array}
     */
    validarSolapamientos(slots) {
        if (slots.length <= 1) return { valido: true, solapamientos: [] };

        const parseTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const sortedSlots = [...slots].sort((a, b) => {
            const horaA = typeof a === 'string' ? a : a.hora;
            const horaB = typeof b === 'string' ? b : b.hora;
            return parseTime(horaA) - parseTime(horaB);
        });

        const solapamientos = [];

        for (let i = 0; i < sortedSlots.length - 1; i++) {
            const current = sortedSlots[i];
            const next = sortedSlots[i + 1];

            const currentHora = typeof current === 'string' ? current : current.hora;
            const nextHora = typeof next === 'string' ? next : next.hora;
            const currentDuracion = typeof current === 'object' ? current.duracion : 60;

            const currentTime = parseTime(currentHora);
            const nextTime = parseTime(nextHora);
            const currentEnd = currentTime + currentDuracion;

            if (currentEnd > nextTime) {
                solapamientos.push({
                    slot1: currentHora,
                    slot2: nextHora,
                    duracion: currentDuracion,
                    mensaje: `${currentHora} (${currentDuracion}min) se solapa con ${nextHora}`
                });
            }
        }

        return {
            valido: solapamientos.length === 0,
            solapamientos
        };
    }
};