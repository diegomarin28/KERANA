import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export function useRealTimeMentors(filterMateria = 'all', filterDate = null) {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMentors();

        // Suscribirse a cambios en mentores en tiempo real
        const mentorChannel = supabase
            .channel('mentor-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'mentor',
                    filter: 'calendly_disponible=eq.true'
                },
                (payload) => {
                    console.log('🔔 Mentor actualizado:', payload);
                    loadMentors();
                }
            )
            .subscribe();

        // Si hay filtro de fecha, también escuchar cambios en slots.js
        let slotsChannel = null;
        if (filterDate) {
            slotsChannel = supabase
                .channel('slots.js-changes-filtered')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'mentor_slots_disponibles'
                    },
                    (payload) => {
                        console.log('🔔 Slots actualizados:', payload);
                        loadMentors();
                    }
                )
                .subscribe();
        }

        return () => {
            supabase.removeChannel(mentorChannel);
            if (slotsChannel) {
                supabase.removeChannel(slotsChannel);
            }
        };
    }, [filterMateria, filterDate]);

    const formatDate = (date) => {
        if (!date) return null;
        const d = typeof date === 'string' ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loadMentors = async () => {
        try {
            setLoading(true);

            const { data: currentUserData } = await supabase.rpc('obtener_usuario_actual_id');

            // Query base de mentores
            const { data: mentorsData, error } = await supabase
                .from('mentor')
                .select(`
                    id_mentor,
                    estrellas_mentor,
                    descripcion,
                    calendly_disponible,
                    ultima_verificacion,
                    usuario!inner(
                        nombre,
                        username,
                        foto,
                        calendly_url
                    ),
                    mentor_materia(
                        materia(nombre_materia)
                    )
                `)
                .eq('calendly_disponible', true)
                .not('usuario.id_usuario', 'eq', currentUserData || 0);

            if (error) throw error;

            let processed = (mentorsData || []).map(m => ({
                id_mentor: m.id_mentor,
                nombre: m.usuario.nombre,
                username: m.usuario.username,
                foto: m.usuario.foto,
                calendly_url: m.usuario.calendly_url,
                estrellas_mentor: m.estrellas_mentor,
                descripcion: m.descripcion,
                ultima_verificacion: m.ultima_verificacion,
                materias: m.mentor_materia?.map(mm => mm.materia.nombre_materia) || []
            }));

            // Si hay filtro de fecha, obtener solo mentores con slots.js disponibles esa fecha
            if (filterDate) {
                const dateKey = formatDate(filterDate);

                const { data: slotsData, error: slotsError } = await supabase
                    .from('mentor_slots_disponibles')
                    .select(`
                        hora,
                        mentor!inner(id_mentor)
                    `)
                    .eq('fecha', dateKey)
                    .eq('disponible', true);

                if (slotsError) throw slotsError;

                // Agrupar slots.js por mentor
                const slotsByMentor = {};
                (slotsData || []).forEach(slot => {
                    const mentorId = slot.mentor.id_mentor;
                    if (!slotsByMentor[mentorId]) {
                        slotsByMentor[mentorId] = [];
                    }
                    slotsByMentor[mentorId].push(slot.hora);
                });

                // Filtrar mentores y agregar sus slots.js disponibles
                processed = processed
                    .filter(mentor => slotsByMentor[mentor.id_mentor])
                    .map(mentor => ({
                        ...mentor,
                        availableSlots: slotsByMentor[mentor.id_mentor] || [],
                        slotCount: (slotsByMentor[mentor.id_mentor] || []).length
                    }));
            }

            // Filtrar por materia
            const filtered = filterMateria === 'all'
                ? processed
                : processed.filter(m => m.materias.includes(filterMateria));

            setMentors(filtered);
        } catch (err) {
            console.error('Error cargando mentores:', err);
        } finally {
            setLoading(false);
        }
    };

    // Obtener mentor específico por ID
    const getMentorById = async (mentorId) => {
        try {
            const { data, error } = await supabase
                .from('mentor')
                .select(`
                    id_mentor,
                    estrellas_mentor,
                    descripcion,
                    calendly_disponible,
                    usuario!inner(
                        nombre,
                        username,
                        foto,
                        calendly_url
                    ),
                    mentor_materia(
                        materia(nombre_materia)
                    )
                `)
                .eq('id_mentor', mentorId)
                .single();

            if (error) throw error;

            return {
                id_mentor: data.id_mentor,
                nombre: data.usuario.nombre,
                username: data.usuario.username,
                foto: data.usuario.foto,
                calendly_url: data.usuario.calendly_url,
                estrellas_mentor: data.estrellas_mentor,
                descripcion: data.descripcion,
                materias: data.mentor_materia?.map(mm => mm.materia.nombre_materia) || []
            };
        } catch (err) {
            console.error('Error obteniendo mentor:', err);
            return null;
        }
    };

    // Obtener disponibilidad de un mentor para un rango de fechas
    const getMentorAvailabilityRange = async (mentorId, startDate, endDate) => {
        try {
            const startKey = formatDate(startDate);
            const endKey = formatDate(endDate);

            const { data: slots, error } = await supabase
                .from('mentor_slots_disponibles')
                .select('fecha, hora')
                .eq('mentor', mentorId)
                .eq('disponible', true)
                .gte('fecha', startKey)
                .lte('fecha', endKey)
                .order('fecha', { ascending: true })
                .order('hora', { ascending: true });

            if (error) throw error;

            // Agrupar por fecha
            const availability = {};
            (slots || []).forEach(slot => {
                if (!availability[slot.fecha]) {
                    availability[slot.fecha] = {
                        slots: [],
                        availableSlots: []
                    };
                }
                availability[slot.fecha].slots.push(slot.hora);
                availability[slot.fecha].availableSlots.push(slot.hora);
            });

            return availability;
        } catch (err) {
            console.error('Error obteniendo disponibilidad:', err);
            return {};
        }
    };

    return {
        mentors,
        loading,
        getMentorById,
        getMentorAvailabilityRange,
        refresh: loadMentors
    };
}