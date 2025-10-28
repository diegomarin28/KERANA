import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export function useRealTimeCalendar(filterMateria = 'all') {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [slotsData, setSlotsData] = useState({});
    const [availabilityByDate, setAvailabilityByDate] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSlotsForMonth();

        // Suscribirse a cambios en slots.js en tiempo real
        const channel = supabase
            .channel('slots.js-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mentor_slots_disponibles'
                },
                (payload) => {
                    console.log('🔔 Cambio en slots.js:', payload);
                    loadSlotsForMonth();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentDate, filterMateria]);

    const loadSlotsForMonth = async () => {
        setLoading(true);

        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        try {
            let query = supabase
                .from('mentor_slots_disponibles')
                .select(`
                    fecha,
                    hora,
                    temp_reserved_by,
                    temp_reserved_until,
                    mentor!inner(
                        id_mentor,
                        calendly_disponible,
                        usuario!inner(
                            nombre,
                            calendly_url
                        ),
                        mentor_materia!inner(
                            materia!inner(nombre_materia)
                        )
                    )
                `)
                .eq('disponible', true)
                .eq('mentor.calendly_disponible', true)
                .gte('fecha', startOfMonth.toISOString().split('T')[0])
                .lte('fecha', endOfMonth.toISOString().split('T')[0]);

            const { data: slots, error } = await query;

            if (error) throw error;

            // 🔒 Filtrar slots.js temporalmente reservados por otros usuarios
            const { data: currentUserData } = await supabase.rpc('obtener_usuario_actual_id');

            let filteredSlots = (slots || []).filter(slot => {
                // Si no tiene reserva temporal, mostrarlo
                if (!slot.temp_reserved_by) return true;

                // Si está reservado por el usuario actual, mostrarlo
                if (slot.temp_reserved_by === currentUserData) return true;

                // Si está reservado por otro usuario, ocultarlo
                return false;
            });

            // Filtrar por materia si está seleccionada
            if (filterMateria !== 'all') {
                filteredSlots = filteredSlots.filter(slot =>
                    slot.mentor.mentor_materia.some(mm => mm.materia.nombre_materia === filterMateria)
                );
            }

            // Agrupar por fecha para el calendario
            const grouped = {};
            const availability = {};

            filteredSlots.forEach(slot => {
                const materias = slot.mentor.mentor_materia.map(mm => mm.materia.nombre_materia);

                const slotData = {
                    mentor_id: slot.mentor.id_mentor,
                    mentor_nombre: slot.mentor.usuario.nombre,
                    calendly_url: slot.mentor.usuario.calendly_url,
                    fecha: slot.fecha,
                    hora: slot.hora,
                    materias: materias
                };

                // Estructura para lista de slots.js
                if (!grouped[slot.fecha]) {
                    grouped[slot.fecha] = [];
                }
                grouped[slot.fecha].push(slotData);

                // Estructura para conteo de mentores disponibles por día
                if (!availability[slot.fecha]) {
                    availability[slot.fecha] = {
                        mentorCount: 0,
                        mentorIds: new Set(),
                        mentors: [],
                        totalSlots: 0
                    };
                }

                // Contar mentores únicos por día
                if (!availability[slot.fecha].mentorIds.has(slot.mentor.id_mentor)) {
                    availability[slot.fecha].mentorIds.add(slot.mentor.id_mentor);
                    availability[slot.fecha].mentorCount++;
                    availability[slot.fecha].mentors.push({
                        mentorId: slot.mentor.id_mentor,
                        mentorName: slot.mentor.usuario.nombre,
                        calendlyUrl: slot.mentor.usuario.calendly_url,
                        materias: materias
                    });
                }
                availability[slot.fecha].totalSlots++;
            });

            // Limpiar Sets antes de guardar
            Object.keys(availability).forEach(date => {
                delete availability[date].mentorIds;
            });

            setSlotsData(grouped);
            setAvailabilityByDate(availability);
        } catch (err) {
            console.error('Error cargando slots.js:', err);
        } finally {
            setLoading(false);
        }
    };

    // Formatear fecha a string YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Obtener mentores disponibles para una fecha específica
    const getMentorsForDate = (date) => {
        const dateKey = formatDate(date);
        const availability = availabilityByDate[dateKey];
        const slots = slotsData[dateKey] || [];

        return {
            mentorCount: availability?.mentorCount || 0,
            mentors: availability?.mentors || [],
            totalSlots: availability?.totalSlots || 0,
            slots: slots
        };
    };

    // Verificar si una fecha tiene disponibilidad
    const hasAvailability = (date) => {
        const dateKey = formatDate(date);
        return (availabilityByDate[dateKey]?.mentorCount || 0) > 0;
    };

    // Obtener conteo de mentores para una fecha
    const getMentorCount = (date) => {
        const dateKey = formatDate(date);
        return availabilityByDate[dateKey]?.mentorCount || 0;
    };

    // Cambiar mes
    const changeMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    // Seleccionar fecha específica
    const selectDate = (date) => {
        setSelectedDate(date);
    };

    return {
        currentDate,
        selectedDate,
        slotsData,
        availabilityByDate,
        loading,
        getMentorsForDate,
        hasAvailability,
        getMentorCount,
        changeMonth,
        selectDate,
        formatDate,
        refresh: loadSlotsForMonth
    };
}