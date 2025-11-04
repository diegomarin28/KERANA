import { supabase } from "../../supabase.js";
import { sesionesAPI } from "../../api/sesiones.js";
import { slotsAPI } from "../../api/slots.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendar, faChevronLeft, faChevronRight, faClock,
    faCheck, faTimes, faTrash, faExclamationCircle,
    faCheckCircle, faSave, faCalendarDay, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import {useEffect, useState} from "react";
import { notificationTypes } from '../../api/notificationTypes';


export default function MyCalendar() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [misSesiones, setMisSesiones] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showReservedWarning, setShowReservedWarning] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState({});
    const [savedSlots, setSavedSlots] = useState({});
    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [currentMentorId, setCurrentMentorId] = useState(null);
    const [mentoriaDuration, setMentoriaDuration] = useState(60);
    const [slotDurations, setSlotDurations] = useState({});
    const [slotMaxAlumnos, setSlotMaxAlumnos] = useState({});
    const [slotDisponibilidad, setSlotDisponibilidad] = useState({});
    const [mentorInfo, setMentorInfo] = useState({
        max_alumnos: 1,
        acepta_virtual: false,
        acepta_presencial: false
    });
    const [slotLocaciones, setSlotLocaciones] = useState({});
    const [slotModalidades, setSlotModalidades] = useState({});

    const availableHours = [
        '07:00' ,'08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00' , '21:00'
    ];

    const durationOptions = [60, 90, 120, 150, 180];

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    const calculateEndTime = (startTime, durationMinutes) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    };

    const formatTimeRange = (startTime, durationMinutes) => {
        const endTime = calculateEndTime(startTime, durationMinutes);
        return `${startTime.slice(0, 5)} - ${endTime}`;
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        await loadMentorId();
        setLoading(false);
    };

    useEffect(() => {
        if (currentMentorId) {
            loadSavedSlots();
            loadMisSesiones();
        }
    }, [currentMentorId]);

    const loadMentorId = async () => {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error('❌ Error obteniendo usuario:', userError);
                setError('No se pudo obtener el usuario autenticado');
                return;
            }

            console.log('✅ Usuario autenticado UUID:', user.id);

            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (usuarioError || !usuarioData) {
                console.error('❌ Error obteniendo usuario:', usuarioError);
                const { data: usuarioByEmail, error: emailError } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('email', user.email)
                    .maybeSingle();

                if (emailError || !usuarioByEmail) {
                    setError('No se encontró el usuario en la base de datos');
                    return;
                }

                console.log('✅ Usuario encontrado por email:', usuarioByEmail);

                const { data: mentorData, error: mentorError } = await supabase
                    .from('mentor')
                    .select('id_mentor, max_alumnos, acepta_virtual, acepta_presencial')
                    .eq('id_usuario', usuarioByEmail.id_usuario)
                    .maybeSingle();

                if (mentorError || !mentorData) {
                    console.error('❌ Error obteniendo mentor:', mentorError);
                    setError('No tienes un perfil de mentor configurado');
                    return;
                }

                console.log('✅ Datos del mentor:', mentorData);
                setCurrentMentorId(mentorData.id_mentor);
                setMentoriaDuration(60);
                setMentorInfo({
                    max_alumnos: mentorData.max_alumnos || 1,
                    acepta_virtual: mentorData.acepta_virtual || false,
                    acepta_presencial: mentorData.acepta_presencial || false
                });
                return;
            }

            console.log('✅ ID usuario numérico:', usuarioData.id_usuario);

            const { data: mentorData, error: mentorError } = await supabase
                .from('mentor')
                .select('id_mentor, max_alumnos, acepta_virtual, acepta_presencial')
                .eq('id_usuario', usuarioData.id_usuario)
                .maybeSingle();

            if (mentorError || !mentorData) {
                console.error('❌ Error obteniendo mentor:', mentorError);
                setError('No tienes un perfil de mentor configurado');
                return;
            }

            console.log('✅ Datos del mentor:', mentorData);
            setCurrentMentorId(mentorData.id_mentor);
            setMentoriaDuration(60);
            setMentorInfo({
                max_alumnos: mentorData.max_alumnos || 1,
                acepta_virtual: mentorData.acepta_virtual || false,
                acepta_presencial: mentorData.acepta_presencial || false
            });
        } catch (err) {
            console.error('❌ Error en loadMentorId:', err);
            setError('Error cargando datos del mentor');
        }
    };

    const loadMisSesiones = async () => {
        if (!currentMentorId) return;
        const { data: sesiones } = await sesionesAPI.obtenerSesionesMentor(currentMentorId);
        setMisSesiones(sesiones || []);
    };

    const loadSavedSlots = async () => {
        if (!currentMentorId) return;

        const now = new Date();
        const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        const { data } = await slotsAPI.obtenerSlotsConfigurados(
            currentMentorId,
            now.toISOString().split('T')[0],
            threeMonthsLater.toISOString().split('T')[0]
        );

        console.log('🔍 DEBUG loadSavedSlots - Datos recibidos:', data);

        if (data) {
            const slotsByDate = {};
            const duracionesBySlot = {};
            const modalidadesBySlot = {};
            const locacionesBySlot = {};
            const maxAlumnosBySlot = {};
            const disponibilidadBySlot = {};

            data.forEach(slot => {
                // Normalizar hora al formato HH:MM (sin segundos)
                const horaOriginal = slot.hora;
                const horaNormalizada = horaOriginal.slice(0, 5); // "11:00:00" -> "11:00"

                const slotDateTime = new Date(`${slot.fecha}T${horaOriginal}`);

                console.log('🔍 Procesando slot:', {
                    fecha: slot.fecha,
                    horaOriginal: horaOriginal,
                    horaNormalizada: horaNormalizada,
                    disponible: slot.disponible,
                    esPasado: slotDateTime < now,
                    seFiltra: slotDateTime < now && slot.disponible !== false
                });

                // Filtrar SOLO slots disponibles que ya pasaron
                // Los slots reservados (disponible === false) se mantienen SIEMPRE visibles
                if (slotDateTime < now && slot.disponible !== false) {
                    console.log('❌ Slot filtrado (pasado y disponible)');
                    return;
                }

                console.log('✅ Slot incluido');

                if (!slotsByDate[slot.fecha]) slotsByDate[slot.fecha] = [];
                slotsByDate[slot.fecha].push(horaNormalizada);

                const slotKey = `${slot.fecha}-${horaNormalizada}`;
                duracionesBySlot[slotKey] = slot.duracion || mentoriaDuration;
                modalidadesBySlot[slotKey] = slot.modalidad || getDefaultModalidad();
                locacionesBySlot[slotKey] = slot.locacion || null;
                maxAlumnosBySlot[slotKey] = slot.max_alumnos || mentorInfo.max_alumnos;
                disponibilidadBySlot[slotKey] = slot.disponible;
            });

            console.log('📊 Resultado final slotsByDate:', slotsByDate);
            console.log('📊 Disponibilidad:', disponibilidadBySlot);

            setSavedSlots(slotsByDate);
            setSlotDurations(duracionesBySlot);
            setSlotModalidades(modalidadesBySlot);
            setSlotLocaciones(locacionesBySlot);
            setSlotMaxAlumnos(maxAlumnosBySlot);
            setSlotDisponibilidad(disponibilidadBySlot);
        }
    };

    const getDefaultModalidad = () => {
        if (mentorInfo.acepta_virtual) return 'virtual';
        if (mentorInfo.acepta_presencial) return 'presencial';
        return 'virtual';
    };

    const formatDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = (date) => date && new Date().toDateString() === date.toDateString();
    const isPastDate = (date) => date && new Date(date.setHours(0, 0, 0, 0)) < new Date().setHours(0, 0, 0, 0);

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
        return days;
    };

    const handleDayClick = (date) => {
        if (!date || isPastDate(date)) return;
        setSelectedDate(date);
        setShowTimeSelector(true);
        const dateKey = formatDateKey(date);

        const existingSlots = savedSlots[dateKey] ? [...savedSlots[dateKey]] : [];
        setSelectedSlots(prev => ({
            ...prev,
            [dateKey]: existingSlots
        }));

        if (existingSlots.length > 0) {
            existingSlots.forEach(hour => {
                const slotKey = `${dateKey}-${hour}`;
                if (!slotDurations[slotKey]) {
                    setSlotDurations(prev => ({
                        ...prev,
                        [slotKey]: mentoriaDuration
                    }));
                }
                if (!slotModalidades[slotKey]) {
                    setSlotModalidades(prev => ({
                        ...prev,
                        [slotKey]: getDefaultModalidad()
                    }));
                }
            });
        }
    };

    const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const checkOverlap = (dateKey, hours) => {
        if (hours.length <= 1) return false;

        const sortedHours = [...hours].sort();
        const overlaps = [];

        for (let i = 0; i < sortedHours.length - 1; i++) {
            const currentHour = sortedHours[i];
            const nextHour = sortedHours[i + 1];

            const current = parseTime(currentHour);
            const next = parseTime(nextHour);

            const duration = slotDurations[`${dateKey}-${currentHour}`] || mentoriaDuration;
            const currentEnd = current + duration;

            if (currentEnd > next) {
                overlaps.push({ hour1: currentHour, hour2: nextHour, duration });
            }
        }

        return overlaps;
    };

    const toggleSlot = (hour) => {
        if (!selectedDate) return;
        const dateKey = formatDateKey(selectedDate);
        const slotKey = `${dateKey}-${hour}`;

        setSelectedSlots(prev => {
            const dateSlots = prev[dateKey] || [];

            if (dateSlots.includes(hour)) {
                // ✅ VERIFICAR si el slot está reservado antes de permitir deselección
                const estaReservado = slotDisponibilidad[slotKey] === false;

                if (estaReservado) {
                    setShowReservedWarning(true);
                    return prev; // No permite deseleccionar
                }

                const newSlots = dateSlots.filter(h => h !== hour).sort();
                setSlotDurations(prevDur => {
                    const newDur = { ...prevDur };
                    delete newDur[slotKey];
                    return newDur;
                });
                setSlotModalidades(prevMod => {
                    const newMod = { ...prevMod };
                    delete newMod[slotKey];
                    return newMod;
                });
                setSlotLocaciones(prevLoc => {
                    const newLoc = { ...prevLoc };
                    delete newLoc[slotKey];
                    return newLoc;
                });
                return { ...prev, [dateKey]: newSlots };
            }

            const newSlots = [...dateSlots, hour].sort();

            setSlotDurations(prevDur => ({
                ...prevDur,
                [slotKey]: mentoriaDuration
            }));

            const defaultModalidad = getDefaultModalidad();
            setSlotModalidades(prevMod => ({
                ...prevMod,
                [slotKey]: defaultModalidad
            }));

            setSlotLocaciones(prevLoc => ({
                ...prevLoc,
                [slotKey]: defaultModalidad === 'presencial' ? 'casa' : null
            }));

            const overlaps = checkOverlap(dateKey, newSlots);
            if (overlaps.length > 0) {
                const overlap = overlaps[0];
                setError(`Solapamiento: El slot de ${overlap.hour1} (${overlap.duration} min) se solapa con ${overlap.hour2}`);
                setTimeout(() => setError(''), 5000);
                return prev;
            }

            return { ...prev, [dateKey]: newSlots };
        });
    };

    const updateSlotLocacion = (dateKey, hour, locacion) => {
        const slotKey = `${dateKey}-${hour}`;
        setSlotLocaciones(prev => ({
            ...prev,
            [slotKey]: locacion
        }));
    };

    const updateSlotDuration = (dateKey, hour, duration) => {
        setSlotDurations(prev => ({
            ...prev,
            [`${dateKey}-${hour}`]: duration
        }));

        const slots = selectedSlots[dateKey] || [];
        const overlaps = checkOverlap(dateKey, slots);

        if (overlaps.length > 0) {
            const overlap = overlaps[0];
            setError(`Con ${duration} min, ${overlap.hour1} se solapa con ${overlap.hour2}`);
            setTimeout(() => setError(''), 5000);
        } else {
            setError('');
        }
    };

    const updateSlotModalidad = (dateKey, hour, modalidad) => {
        const slotKey = `${dateKey}-${hour}`;

        setSlotModalidades(prev => ({
            ...prev,
            [slotKey]: modalidad
        }));

        if (modalidad === 'presencial') {
            setSlotLocaciones(prev => ({
                ...prev,
                [slotKey]: prev[slotKey] || 'casa'
            }));
        } else {
            setSlotLocaciones(prev => ({
                ...prev,
                [slotKey]: null
            }));
        }
    };

    const saveManualSlots = async () => {
        if (!selectedDate || !currentMentorId) return;
        const dateKey = formatDateKey(selectedDate);
        const slots = selectedSlots[dateKey] || [];

        if (slots.length === 0) {
            setError('Debes seleccionar al menos un horario');
            setTimeout(() => setError(''), 3000);
            return;
        }

        const overlaps = checkOverlap(dateKey, slots);
        if (overlaps.length > 0) {
            setError('No se pueden guardar horarios solapados');
            setTimeout(() => setError(''), 4000);
            return;
        }

        try {
            const slotsConDuracion = slots.map(hora => {
                const slotKey = `${dateKey}-${hora}`;
                const duracion = slotDurations[slotKey] || mentoriaDuration;
                const modalidad = slotModalidades[slotKey] || getDefaultModalidad();
                const locacion = slotLocaciones[slotKey] || null;

                return {
                    hora,
                    duracion,
                    modalidad,
                    locacion,
                    max_alumnos: mentorInfo.max_alumnos
                };
            });

            const { error } = await slotsAPI.guardarSlotsManual(
                currentMentorId,
                dateKey,
                slotsConDuracion,
                mentoriaDuration
            );

            if (error) {
                setError('Error guardando horarios: ' + error.message);
                setTimeout(() => setError(''), 4000);
            } else {
                setSavedSlots(prev => ({ ...prev, [dateKey]: slots }));
                setSuccess(`${slots.length} ${slots.length === 1 ? 'horario guardado' : 'horarios guardados'} correctamente`);
                setTimeout(() => setSuccess(''), 3000);
                setShowTimeSelector(false);
                setSelectedDate(null);
                loadSavedSlots();
            }
        } catch (err) {
            console.error('❌ Error guardando slots:', err);
            setError('Error inesperado guardando horarios');
            setTimeout(() => setError(''), 4000);
        }

        try {
            // Obtener datos del mentor
            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_usuario')
                .eq('id_mentor', currentMentorId)
                .single();

            if (mentorData) {
                const { data: usuarioData } = await supabase
                    .from('usuario')
                    .select('nombre')
                    .eq('id_usuario', mentorData.id_usuario)
                    .single();

                if (usuarioData) {
                    await notificationTypes.mentorNuevasHorasDisponibles(
                        mentorData.id_usuario,
                        usuarioData.nombre,
                        dateKey,
                        slots.length,
                        currentMentorId
                    );
                }
            }
        } catch (notifError) {
            console.error('Error enviando notificaciones:', notifError);
            // No mostrar error al usuario, los horarios ya se guardaron
        }
    };

    const deleteManualSlots = async (dateKey) => {
        // Verificar si hay slots reservados en esa fecha
        const slotsEnFecha = savedSlots[dateKey] || [];
        const hayReservados = slotsEnFecha.some(hora => {
            const slotKey = `${dateKey}-${hora}`;
            return slotDisponibilidad[slotKey] === false;
        });

        if (hayReservados) {
            setShowReservedWarning(true);
            return;
        }

        setConfirmDelete(dateKey);
    };
    const confirmDeleteSlots = async (dateKey) => {
        setIsDeleting(true);
        const { error } = await slotsAPI.eliminarSlotsFecha(currentMentorId, dateKey);
        if (error) {
            setError('Error eliminando horarios: ' + error.message);
            setTimeout(() => setError(''), 4000);
        } else {
            setSavedSlots(prev => {
                const newSlots = { ...prev };
                delete newSlots[dateKey];
                return newSlots;
            });
            setSuccess('Horarios eliminados correctamente');
            setTimeout(() => setSuccess(''), 3000);
        }
        setConfirmDelete(null);
        setIsDeleting(false);
    };

    const getSlotCountForDate = (date) => {
        if (!date) return 0;
        const dateKey = formatDateKey(date);
        return (savedSlots[dateKey] || []).length;
    };

    if (loading) return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(14px, 2vw, 16px)',
            fontWeight: 500,
            color: '#64748b'
        }}>
            <FontAwesomeIcon icon={faClock} spin style={{ marginRight: 12, color: '#2563eb' }} />
            Cargando calendario...
        </div>
    );

    const days = getDaysInMonth();

    return (
        <div style={{
            maxWidth: 'min(1400px, 92vw)',
            margin: '0 auto',
            padding: 'clamp(16px, 3vw, 24px)',
            fontFamily: 'Inter, sans-serif',
            position: 'relative'
        }}>
            {/* Modal de advertencia de slots reservados */}
            {showReservedWarning && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <style>
                        {`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -45%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `}
                    </style>
                    <div style={{
                        background: 'linear-gradient(135deg, #fff 0%, #fefce8 100%)',
                        padding: 24,
                        borderRadius: 16,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '3px solid #fbbf24',
                        maxWidth: 400,
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                        }}>
                            <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: 32, color: '#f59e0b' }} />
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#92400e'
                        }}>
                            ⚠️ Hay horarios reservados
                        </h3>
                        <p style={{
                            color: '#78350f',
                            marginBottom: 20,
                            fontSize: 14,
                            lineHeight: 1.6,
                            fontWeight: 500
                        }}>
                            Esta fecha tiene sesiones confirmadas. Para cancelarlas, ve a la sección
                            <strong style={{ display: 'block', marginTop: 8, color: '#92400e' }}>
                                📅 "Próximas Mentorías"
                            </strong>
                            en Soy Mentor.
                        </p>
                        <button
                            onClick={() => setShowReservedWarning(false)}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '12px 24px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 14,
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif',
                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                            }}
                            onMouseEnter={e => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.3)';
                            }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
            {/* Modal de confirmación */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: 20
                }}>
                    <div style={{
                        background: '#fff',
                        padding: 28,
                        borderRadius: 16,
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: 380,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '2px solid #f1f5f9'
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: 28, color: '#dc2626' }} />
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 'clamp(18px, 3vw, 22px)',
                            fontWeight: 700,
                            color: '#0f172a'
                        }}>
                            ¿Eliminar horarios?
                        </h3>
                        <p style={{
                            color: '#64748b',
                            marginBottom: 24,
                            fontSize: 14,
                            lineHeight: 1.5,
                            fontWeight: 500
                        }}>
                            Esta acción eliminará todos los horarios configurados para ese día.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                style={{
                                    flex: 1,
                                    background: '#f8fafc',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: 10,
                                    padding: '12px 20px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: '#0f172a',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={e => {
                                    e.target.style.background = '#f1f5f9';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={e => {
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
                                Cancelar
                            </button>
                            <button
                                onClick={() => confirmDeleteSlots(confirmDelete)}
                                disabled={isDeleting}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '12px 20px',
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    opacity: isDeleting ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={e => !isDeleting && (e.target.style.transform = 'translateY(-2px)')}
                                onMouseLeave={e => !isDeleting && (e.target.style.transform = 'translateY(0)')}
                            >
                                <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'clamp(28px, 5vw, 42px)',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em'
                }}>
                    <FontAwesomeIcon icon={faCalendar} style={{ marginRight: 12, color: '#2563eb' }} />
                    Mi Calendario
                </h1>
                <p style={{
                    color: '#64748b',
                    margin: 0,
                    fontSize: 'clamp(14px, 2vw, 16px)',
                    fontWeight: 500
                }}>
                    Gestiona tu disponibilidad y sesiones de mentoría
                </p>
            </div>

            {/* Alertas */}
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    color: '#dc2626',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontWeight: 600,
                    fontSize: 14
                }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: 20 }} />
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: '#d1fae5',
                    border: '2px solid #6ee7b7',
                    color: '#065f46',
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontWeight: 600,
                    fontSize: 14
                }}>
                    <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: 20 }} />
                    {success}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr',
                gap: 32,
                marginBottom: 32
            }}>
                {/* Calendario */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    height: 'fit-content'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 24
                    }}>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                fontSize: 16
                            }}
                            onMouseEnter={e => e.target.style.transform = 'translateX(-2px)'}
                            onMouseLeave={e => e.target.style.transform = 'translateX(0)'}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <h2 style={{
                            margin: 0,
                            fontSize: 'clamp(18px, 3vw, 22px)',
                            fontWeight: 700,
                            color: '#0f172a'
                        }}>
                            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                fontSize: 16
                            }}
                            onMouseEnter={e => e.target.style.transform = 'translateX(2px)'}
                            onMouseLeave={e => e.target.style.transform = 'translateX(0)'}
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                        {daysOfWeek.map(day => (
                            <div key={day} style={{
                                textAlign: 'center',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#64748b',
                                padding: '8px 0',
                                letterSpacing: '0.5px'
                            }}>
                                {day}
                            </div>
                        ))}

                        {days.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} />;

                            const dateKey = formatDateKey(date);
                            const slotCount = getSlotCountForDate(date);
                            const isDisabled = isPastDate(date);
                            const today = isToday(date);
                            const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

                            return (
                                <div
                                    key={index}
                                    onClick={() => !isDisabled && handleDayClick(date)}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 10,
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        background: isDisabled ? '#f9fafb' :
                                            slotCount > 0 ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                                today ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#fff',
                                        border: isSelected ? '3px solid #6366f1' :
                                            today ? '2px solid #2563eb' : '2px solid #f1f5f9',
                                        opacity: isDisabled ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        boxShadow: isSelected ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isDisabled && !isSelected) {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                            e.target.style.borderColor = '#cbd5e1';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isDisabled && !isSelected) {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                            e.target.style.borderColor = today ? '#2563eb' : '#f1f5f9';
                                        }
                                    }}
                                >
                                    <span>{date.getDate()}</span>
                                    {slotCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: 4,
                                            fontSize: 10,
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#fff',
                                            borderRadius: 12,
                                            padding: '2px 6px',
                                            fontWeight: 700
                                        }}>
                                            {slotCount}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', gap: 16, fontSize: 12, fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                borderRadius: 4,
                                border: '2px solid #6ee7b7'
                            }} />
                            <span style={{ color: '#64748b' }}>Con horarios</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                border: '2px solid #2563eb',
                                borderRadius: 4
                            }} />
                            <span style={{ color: '#64748b' }}>Hoy</span>
                        </div>
                    </div>
                </div>

                {/* Panel de horarios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {showTimeSelector && selectedDate ? (
                        <div style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 24,
                            border: '2px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            height: 'fit-content',
                            maxHeight: 'calc(100vh - 100px)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 20
                            }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FontAwesomeIcon icon={faCalendarDay} style={{ color: '#fff', fontSize: 18 }} />
                                </div>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: 'clamp(18px, 3vw, 20px)',
                                        fontWeight: 700,
                                        color: '#0f172a'
                                    }}>
                                        Seleccionar horarios
                                    </h3>
                                    <p style={{
                                        color: '#64748b',
                                        margin: 0,
                                        fontSize: 13,
                                        fontWeight: 500
                                    }}>
                                        {selectedDate.getDate()} de {months[selectedDate.getMonth()]}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                                gap: 8,
                                marginBottom: 20,
                                maxHeight: '240px',
                                overflowY: 'auto',
                                padding: '4px',
                                borderRadius: 8
                            }}>
                                {availableHours.map(hour => {
                                    const dateKey = formatDateKey(selectedDate);
                                    const isSelected = (selectedSlots[dateKey] || []).includes(hour);

                                    return (
                                        <button
                                            key={hour}
                                            onClick={() => toggleSlot(hour)}
                                            style={{
                                                padding: '12px 8px',
                                                background: isSelected
                                                    ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                                                    : '#f8fafc',
                                                color: isSelected ? '#fff' : '#0f172a',
                                                border: isSelected ? 'none' : '2px solid #e2e8f0',
                                                borderRadius: 10,
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                transition: 'all 0.2s ease',
                                                fontFamily: 'Inter, sans-serif'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) {
                                                    e.target.style.background = '#f1f5f9';
                                                    e.target.style.borderColor = '#cbd5e1';
                                                }
                                                e.target.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) {
                                                    e.target.style.background = '#f8fafc';
                                                    e.target.style.borderColor = '#e2e8f0';
                                                }
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faClock} style={{ marginRight: 6, fontSize: 12 }} />
                                            {hour}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Duraciones personalizadas */}
                            {selectedDate && (selectedSlots[formatDateKey(selectedDate)] || []).length > 0 && (
                                <div style={{
                                    background: '#f8fafc',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 20,
                                    border: '2px solid #f1f5f9',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 12
                                    }}>
                                        <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#2563eb', fontSize: 14 }} />
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#0f172a'
                                        }}>
                                            Configuración por horario
                                        </h4>
                                    </div>

                                    {/* Info de capacidad */}
                                    <div style={{
                                        background: '#fff',
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: '2px solid #e2e8f0',
                                        marginBottom: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                                            👥 Capacidad máxima:
                                        </span>
                                        <span style={{
                                            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                            color: '#1e40af',
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            fontSize: 12,
                                            fontWeight: 700
                                        }}>
                                            {mentorInfo.max_alumnos} {mentorInfo.max_alumnos === 1 ? 'alumno' : 'alumnos'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {(selectedSlots[formatDateKey(selectedDate)] || []).map(hour => {
                                            const dateKey = formatDateKey(selectedDate);
                                            const currentDuration = slotDurations[`${dateKey}-${hour}`] || mentoriaDuration;
                                            const currentModalidad = slotModalidades[`${dateKey}-${hour}`] || getDefaultModalidad();

                                            return (
                                                <div key={hour} style={{
                                                    background: '#fff',
                                                    padding: '12px',
                                                    borderRadius: 8,
                                                    border: '2px solid #e2e8f0'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        marginBottom: 8
                                                    }}>
                                                        <span style={{
                                                            fontSize: 13,
                                                            fontWeight: 700,
                                                            color: '#0f172a'
                                                        }}>
                                                            <FontAwesomeIcon icon={faClock} style={{ marginRight: 8, color: '#64748b' }} />
                                                            {hour}
                                                        </span>
                                                        <select
                                                            value={currentDuration}
                                                            onChange={(e) => updateSlotDuration(dateKey, hour, Number(e.target.value))}
                                                            style={{
                                                                padding: '6px 10px',
                                                                borderRadius: 8,
                                                                border: '2px solid #e2e8f0',
                                                                fontSize: 12,
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                background: '#fff',
                                                                color: '#0f172a',
                                                                outline: 'none',
                                                                transition: 'all 0.2s ease',
                                                                fontFamily: 'Inter, sans-serif'
                                                            }}
                                                        >
                                                            {durationOptions.map(dur => (
                                                                <option key={dur} value={dur}>{dur} min</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Selector de modalidad */}
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: 6,
                                                        marginTop: 8
                                                    }}>
                                                        {mentorInfo.acepta_virtual && (
                                                            <button
                                                                onClick={() => updateSlotModalidad(dateKey, hour, 'virtual')}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '6px 10px',
                                                                    borderRadius: 6,
                                                                    border: currentModalidad === 'virtual' ? '2px solid #2563eb' : '2px solid #e2e8f0',
                                                                    background: currentModalidad === 'virtual'
                                                                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                                                        : '#fff',
                                                                    color: currentModalidad === 'virtual' ? '#1e40af' : '#64748b',
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    fontFamily: 'Inter, sans-serif'
                                                                }}
                                                            >
                                                                💻 Virtual
                                                            </button>
                                                        )}
                                                        {mentorInfo.acepta_presencial && (
                                                            <button
                                                                onClick={() => updateSlotModalidad(dateKey, hour, 'presencial')}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '6px 10px',
                                                                    borderRadius: 6,
                                                                    border: currentModalidad === 'presencial' ? '2px solid #059669' : '2px solid #e2e8f0',
                                                                    background: currentModalidad === 'presencial'
                                                                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                                                        : '#fff',
                                                                    color: currentModalidad === 'presencial' ? '#065f46' : '#64748b',
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    fontFamily: 'Inter, sans-serif'
                                                                }}
                                                            >
                                                                🏢 Presencial
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Selector de localización (solo si es presencial) */}
                                                    {currentModalidad === 'presencial' && (
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: 6,
                                                            marginTop: 6,
                                                            paddingTop: 6,
                                                            borderTop: '1px solid #e2e8f0'
                                                        }}>
                                                            <button
                                                                onClick={() => updateSlotLocacion(dateKey, hour, 'casa')}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '6px 10px',
                                                                    borderRadius: 6,
                                                                    border: (slotLocaciones[`${dateKey}-${hour}`] || 'casa') === 'casa'
                                                                        ? '2px solid #059669'
                                                                        : '2px solid #e2e8f0',
                                                                    background: (slotLocaciones[`${dateKey}-${hour}`] || 'casa') === 'casa'
                                                                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                                                        : '#fff',
                                                                    color: (slotLocaciones[`${dateKey}-${hour}`] || 'casa') === 'casa'
                                                                        ? '#065f46'
                                                                        : '#64748b',
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    fontFamily: 'Inter, sans-serif'
                                                                }}
                                                            >
                                                                🏠 Casa
                                                            </button>
                                                            <button
                                                                onClick={() => updateSlotLocacion(dateKey, hour, 'facultad')}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '6px 10px',
                                                                    borderRadius: 6,
                                                                    border: slotLocaciones[`${dateKey}-${hour}`] === 'facultad'
                                                                        ? '2px solid #059669'
                                                                        : '2px solid #e2e8f0',
                                                                    background: slotLocaciones[`${dateKey}-${hour}`] === 'facultad'
                                                                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                                                                        : '#fff',
                                                                    color: slotLocaciones[`${dateKey}-${hour}`] === 'facultad'
                                                                        ? '#065f46'
                                                                        : '#64748b',
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease',
                                                                    fontFamily: 'Inter, sans-serif'
                                                                }}
                                                            >
                                                                🎓 Facultad
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => {
                                        setShowTimeSelector(false);
                                        setSelectedDate(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.background = '#f1f5f9';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={saveManualSlots}
                                    style={{
                                        flex: 1,
                                        padding: '12px 20px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faSave} style={{ marginRight: 8 }} />
                                    Guardar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 40,
                            border: '2px dashed #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <FontAwesomeIcon icon={faCalendarDay} style={{ fontSize: 36, color: '#2563eb' }} />
                            </div>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#0f172a'
                            }}>
                                Selecciona un día
                            </h3>
                            <p style={{
                                color: '#64748b',
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 500,
                                lineHeight: 1.5
                            }}>
                                Haz clic en un día del calendario para configurar tus horarios disponibles
                            </p>
                        </div>
                    )}

                    {/* Resumen de horarios del mes */}
                    {Object.keys(savedSlots).length > 0 && (
                        <div style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 24,
                            border: '2px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            height: 'fit-content',
                            maxHeight: showTimeSelector ? 'none' : 'calc(100vh - 100px)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 16
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8, color: '#10b981' }} />
                                    Horarios configurados
                                </h3>
                                <div style={{
                                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                    color: '#1e40af',
                                    padding: '6px 14px',
                                    borderRadius: 16,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    letterSpacing: '0.3px'
                                }}>
                                    {Object.keys(savedSlots).length} {Object.keys(savedSlots).length === 1 ? 'DÍA' : 'DÍAS'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', paddingRight: 4 }}>
                                {Object.entries(savedSlots)
                                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                                    .map(([dateKey, slots]) => {
                                        const date = new Date(dateKey + 'T00:00:00');
                                        const formattedDate = date.toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long',
                                        });

                                        return (
                                            <div key={dateKey} style={{
                                                padding: 16,
                                                background: '#f8fafc',
                                                borderRadius: 12,
                                                border: '2px solid #f1f5f9',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontWeight: 700,
                                                            marginBottom: 10,
                                                            fontSize: 14,
                                                            color: '#0f172a',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8
                                                        }}>
                                                            <FontAwesomeIcon icon={faCalendar} style={{ color: '#2563eb', fontSize: 14 }} />
                                                            {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 8
                                                        }}>
                                                            {slots.sort().map(slot => {
                                                                const slotKey = `${dateKey}-${slot}`;
                                                                const duracion = slotDurations[slotKey] || mentoriaDuration;
                                                                const modalidad = slotModalidades[slotKey] || 'virtual';
                                                                const locacion = slotLocaciones[slotKey];
                                                                const disponible = slotDisponibilidad[slotKey] !== false;

                                                                const modalidadIcon = modalidad === 'virtual' ? '💻' : '🏢';
                                                                const modalidadColor = !disponible
                                                                    ? '#fef3c7'
                                                                    : modalidad === 'virtual'
                                                                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                                                        : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                                                                const modalidadText = !disponible
                                                                    ? '#92400e'
                                                                    : modalidad === 'virtual' ? '#1e40af' : '#065f46';

                                                                return (
                                                                    <div key={slot} style={{
                                                                        background: modalidadColor,
                                                                        color: modalidadText,
                                                                        padding: '8px 12px',
                                                                        borderRadius: 8,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: 4,
                                                                        minWidth: '110px',
                                                                        position: 'relative',
                                                                        border: !disponible ? '2px solid #fbbf24' : 'none'
                                                                    }}>
                                                                        {!disponible && (
                                                                            <div style={{
                                                                                position: 'absolute',
                                                                                top: -8,
                                                                                right: -8,
                                                                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                                                color: 'white',
                                                                                padding: '3px 8px',
                                                                                borderRadius: 6,
                                                                                fontSize: 9,
                                                                                fontWeight: 700,
                                                                                boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
                                                                                letterSpacing: '0.3px'
                                                                            }}>
                                                                                RESERVADA
                                                                            </div>
                                                                        )}
                                                                        <div style={{
                                                                            fontSize: 12,
                                                                            fontWeight: 700,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 4
                                                                        }}>
                                                                            <FontAwesomeIcon icon={faClock} style={{ fontSize: 10 }} />
                                                                            {formatTimeRange(slot, duracion)}
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: 10,
                                                                            fontWeight: 600,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            gap: 6
                                                                        }}>
                                                                            <span>
                                                                                {modalidadIcon} {modalidad.charAt(0).toUpperCase() + modalidad.slice(1)}
                                                                                {modalidad === 'presencial' && locacion && (
                                                                                    <span style={{ marginLeft: 4 }}>
                                                                                        • {locacion === 'casa' ? '🏠 Casa' : '🎓 Facultad'}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                            <span style={{
                                                                                background: 'rgba(255,255,255,0.5)',
                                                                                padding: '2px 6px',
                                                                                borderRadius: 4,
                                                                                fontWeight: 700
                                                                            }}>
                                                                                👤 {slotMaxAlumnos[slotKey] || mentorInfo.max_alumnos}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteManualSlots(dateKey)}
                                                        style={{
                                                            padding: '8px 14px',
                                                            background: '#fef2f2',
                                                            color: '#dc2626',
                                                            border: '2px solid #fecaca',
                                                            borderRadius: 8,
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            flexShrink: 0,
                                                            transition: 'all 0.2s ease',
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.target.style.background = '#fee2e2';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.target.style.background = '#fef2f2';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lista de sesiones agendadas */}
            {misSesiones.length > 0 && (
                <div>
                    <h2 style={{
                        fontSize: 22,
                        fontWeight: 700,
                        marginBottom: 16,
                        color: '#0f172a'
                    }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8, color: '#10b981' }} />
                        Mis Sesiones Agendadas
                    </h2>
                    <div style={{ display: 'grid', gap: 12 }}>
                        {misSesiones.filter(s => s.estado === 'confirmada').map(sesion => (
                            <div key={sesion.id_sesion} style={{
                                background: '#fff',
                                border: '2px solid #f1f5f9',
                                borderRadius: 12,
                                padding: 16,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div>
                                    <div style={{
                                        fontWeight: 600,
                                        marginBottom: 4,
                                        color: '#0f172a',
                                        fontSize: 15
                                    }}>
                                        {sesion.estudiante?.nombre || 'Estudiante'}
                                    </div>
                                    <div style={{
                                        fontSize: 13,
                                        color: '#64748b',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}>
                                        <FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} />
                                        {new Date(sesion.fecha_hora).toLocaleString('es-ES', {
                                            day: 'numeric',
                                            month: 'long',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        await sesionesAPI.cancelarSesion(sesion.id_sesion);
                                        loadMisSesiones();
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#fef2f2',
                                        color: '#dc2626',
                                        border: '2px solid #fecaca',
                                        borderRadius: 8,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.background = '#fee2e2';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.background = '#fef2f2';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ marginRight: 6 }} />
                                    Cancelar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}