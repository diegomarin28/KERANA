import { supabase } from '../supabase.js';

/**
 * Sistema de gestión de disponibilidad con Calendly versión gratuita
 * Usa la tabla mentor_slots_disponibles existente en Supabase
 */

/**
 * Generar slots.js disponibles para un mentor basado en horarios semanales
 * @param {string} mentorId - ID del mentor
 * @param {Object} weeklySchedule - Horarios por día: { monday: ["09:00", "10:00"], ... }
 * @param {number} daysAhead - Días hacia adelante a generar (default: 60)
 */
export const generateMentorSlots = async (mentorId, weeklySchedule, daysAhead = 60) => {
    try {
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        const slotsToInsert = [];

        for (let i = 0; i < daysAhead; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);

            const dayName = daysOfWeek[currentDate.getDay()];
            const slots = weeklySchedule[dayName] || [];

            if (slots.length > 0) {
                const dateKey = formatDate(currentDate);

                const { data: existingSlots } = await supabase
                    .from('slots_disponibles')
                    .select('hora')
                    .eq('mentor', mentorId)
                    .eq('fecha', dateKey);

                const existingHours = new Set((existingSlots || []).map(s => s.hora));

                for (const hora of slots) {
                    if (!existingHours.has(hora)) {
                        slotsToInsert.push({
                            mentor: mentorId,
                            fecha: dateKey,
                            hora: hora,
                            disponible: true
                        });
                    }
                }
            }
        }

        if (slotsToInsert.length > 0) {
            const { error } = await supabase
                .from('mentor_slots_disponibles')
                .insert(slotsToInsert);

            if (error) throw error;
        }

        return {
            success: true,
            slotsCreated: slotsToInsert.length,
            message: `${slotsToInsert.length} slots generados exitosamente`
        };
    } catch (error) {
        console.error('Error generando slots.js:', error);
        return { success: false, error: error.message };
    }
};

export const reserveSlotTemporarily = async (mentorId, date, timeSlot, userId) => {
    try {
        const dateKey = formatDate(date);
        const reservedUntil = new Date(Date.now() + 5 * 60000);

        const { data: slot, error: fetchError } = await supabase
            .from('mentor_slots_disponibles')
            .select('*')
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot)
            .eq('disponible', true)
            .single();

        if (fetchError || !slot) {
            throw new Error('Slot no disponible');
        }

        const { error: updateError } = await supabase
            .from('mentor_slots_disponibles')
            .update({
                disponible: false,
                temp_reserved_by: userId,
                temp_reserved_until: reservedUntil.toISOString()
            })
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot);

        if (updateError) throw updateError;

        return {
            success: true,
            reservedUntil: reservedUntil,
            message: 'Slot reservado temporalmente por 5 minutos'
        };
    } catch (error) {
        console.error('Error reservando slot temporalmente:', error);
        return { success: false, error: error.message };
    }
};

export const confirmSlotReservation = async (mentorId, date, timeSlot, userId, studentId) => {
    try {
        const dateKey = formatDate(date);

        const { data: slot, error: fetchError } = await supabase
            .from('mentor_slots_disponibles')
            .select('*')
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot)
            .eq('temp_reserved_by', userId)
            .single();

        if (fetchError || !slot) {
            throw new Error('Reserva temporal no encontrada o expirada');
        }

        const { error: updateError } = await supabase
            .from('mentor_slots_disponibles')
            .update({
                disponible: false,
                temp_reserved_by: null,
                temp_reserved_until: null
            })
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot);

        if (updateError) throw updateError;

        // Comentado para usar después con tabla sesiones
        /*
        const { error: sesionError } = await supabase
            .from('sesiones')
            .insert({
                id_mentor: mentorId,
                id_estudiante: studentId,
                fecha: dateKey,
                hora: timeSlot,
                estado: 'programada'
            });

        if (sesionError) {
            console.error('Error creando sesión:', sesionError);
        }
        */

        return {
            success: true,
            message: 'Reserva confirmada exitosamente'
        };
    } catch (error) {
        console.error('Error confirmando reserva:', error);
        return { success: false, error: error.message };
    }
};

export const cancelTemporaryReservation = async (mentorId, date, timeSlot, userId) => {
    try {
        const dateKey = formatDate(date);

        const { error } = await supabase
            .from('mentor_slots_disponibles')
            .update({
                disponible: true,
                temp_reserved_by: null,
                temp_reserved_until: null
            })
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot)
            .eq('temp_reserved_by', userId);

        if (error) throw error;

        return { success: true, message: 'Reserva temporal cancelada' };
    } catch (error) {
        console.error('Error cancelando reserva temporal:', error);
        return { success: false, error: error.message };
    }
};

export const releaseExpiredTemporaryReservations = async () => {
    try {
        const now = new Date().toISOString();

        const { error } = await supabase
            .from('mentor_slots_disponibles')
            .update({
                disponible: true,
                temp_reserved_by: null,
                temp_reserved_until: null
            })
            .lt('temp_reserved_until', now)
            .not('temp_reserved_until', 'is', null);

        if (error) throw error;

        return { success: true, message: 'Reservas temporales expiradas liberadas' };
    } catch (error) {
        console.error('Error liberando reservas expiradas:', error);
        return { success: false, error: error.message };
    }
};

export const bookMentorSlot = async (mentorId, date, timeSlot, studentId = null) => {
    try {
        const dateKey = formatDate(date);

        const { data: slot, error: fetchError } = await supabase
            .from('mentor_slots_disponibles')
            .select('*')
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot)
            .eq('disponible', true)
            .single();

        if (fetchError || !slot) {
            throw new Error('Slot no disponible');
        }

        const { error: updateError } = await supabase
            .from('mentor_slots_disponibles')
            .update({ disponible: false })
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot);

        if (updateError) throw updateError;

        return {
            success: true,
            message: 'Slot reservado exitosamente'
        };
    } catch (error) {
        console.error('Error reservando slot:', error);
        return { success: false, error: error.message };
    }
};

export const cancelMentorSlot = async (mentorId, date, timeSlot) => {
    try {
        const dateKey = formatDate(date);

        const { error } = await supabase
            .from('mentor_slots_disponibles')
            .update({ disponible: true })
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .eq('hora', timeSlot);

        if (error) throw error;

        return { success: true, message: 'Slot liberado exitosamente' };
    } catch (error) {
        console.error('Error cancelando slot:', error);
        return { success: false, error: error.message };
    }
};

export const getMentorSlotsForDate = async (mentorId, date) => {
    try {
        const dateKey = formatDate(date);

        const { data: slots, error } = await supabase
            .from('mentor_slots_disponibles')
            .select('hora, disponible')
            .eq('mentor', mentorId)
            .eq('fecha', dateKey)
            .order('hora', { ascending: true });

        if (error) throw error;

        return {
            success: true,
            slots: slots || [],
            availableSlots: (slots || []).filter(s => s.disponible),
            bookedSlots: (slots || []).filter(s => !s.disponible)
        };
    } catch (error) {
        console.error('Error obteniendo slots.js:', error);
        return { success: false, error: error.message, slots: [] };
    }
};

export const cleanupOldSlots = async () => {
    try {
        const today = formatDate(new Date());

        const { error } = await supabase
            .from('mentor_slots_disponibles')
            .delete()
            .lt('fecha', today);

        if (error) throw error;

        return { success: true, message: 'Slots antiguos eliminados' };
    } catch (error) {
        console.error('Error limpiando slots.js:', error);
        return { success: false, error: error.message };
    }
};

export const updateMentorCalendlyAvailability = async (mentorId, isAvailable) => {
    try {
        const { error } = await supabase
            .from('mentor')
            .update({
                calendly_disponible: isAvailable,
                ultima_verificacion: new Date().toISOString()
            })
            .eq('id_mentor', mentorId);

        if (error) throw error;

        return { success: true, message: 'Disponibilidad actualizada' };
    } catch (error) {
        console.error('Error actualizando disponibilidad:', error);
        return { success: false, error: error.message };
    }
};

// Helper function
const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};