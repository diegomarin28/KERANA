import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { slotsAPI } from '../api/slots';
import { sesionesAPI } from '../api/sesiones';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendar, faChevronLeft, faChevronRight, faClock,
    faUser, faBook, faCheckCircle, faTimes, faVideo,
    faBuilding, faUsers, faFilter, faXmark
} from '@fortawesome/free-solid-svg-icons';

export default function GlobalCalendar() {
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availabilityByDate, setAvailabilityByDate] = useState({});
    const [mentorsForDate, setMentorsForDate] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentEstudianteId, setCurrentEstudianteId] = useState(null);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // Estados para el filtro de materias
    const [materias, setMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    useEffect(() => {
        loadInitialData();
    }, [selectedMateria]);

    useEffect(() => {
        if (selectedDate) {
            loadMentorsForDate(selectedDate);
        }
    }, [selectedDate, availabilityByDate]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([
            getUserData(),
            loadAvailability()
        ]);
        setLoading(false);
    };

    const getUserData = async () => {
        const { data: userId } = await supabase.rpc('obtener_usuario_actual_id');
        setCurrentUserId(userId);
        if (userId) {
            setCurrentEstudianteId(userId);
        }
    };

    const loadAvailability = async () => {
        const now = new Date();
        const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        try {
            const { data: slotsData, error } = await slotsAPI.obtenerSlotsDisponiblesGlobal(
                now.toISOString().split('T')[0],
                threeMonthsLater.toISOString().split('T')[0]
            );

            if (error) {
                console.error('Error loading slots:', error);
                return;
            }

            console.log('📊 Slots cargados:', slotsData);

            // Obtener IDs de materias únicos
            const materiaIds = [...new Set(
                slotsData?.map(s => s.mentor?.mentor_materia?.[0]?.id_materia).filter(Boolean)
            )];

            let materiasMap = {};
            let materiasArray = [];

            // Consultar nombres de materias
            if (materiaIds.length > 0) {
                const { data: materiasData } = await supabase
                    .from('materia')
                    .select('id_materia, nombre_materia')
                    .in('id_materia', materiaIds);

                materiasData?.forEach(m => {
                    materiasMap[m.id_materia] = m.nombre_materia;
                });

                materiasArray = materiasData || [];
            }

            setMaterias(materiasArray);

            // Aplicar filtro de materia si existe
            const slots = selectedMateria
                ? slotsData?.filter(slot =>
                    slot.mentor?.mentor_materia?.[0]?.id_materia === selectedMateria
                )
                : slotsData;

            // Organizar slots por fecha
            const availability = {};
            slots?.forEach(slot => {
                const mentorMateria = slot.mentor?.mentor_materia?.[0];
                const materiaId = mentorMateria?.id_materia;
                const materiaNombre = materiasMap[materiaId] || 'Sin materia';

                if (!slot.mentor) slot.mentor = {};
                slot.mentor.materia_nombre = materiaNombre;
                slot.mentor.id_materia = materiaId;

                if (!availability[slot.fecha]) {
                    availability[slot.fecha] = {
                        mentors: new Set(),
                        slots: []
                    };
                }
                availability[slot.fecha].mentors.add(slot.id_mentor);
                availability[slot.fecha].slots.push(slot);
            });

            // Convertir Sets a arrays
            Object.keys(availability).forEach(date => {
                availability[date].mentors = Array.from(availability[date].mentors);
            });

            console.log('📅 Disponibilidad organizada:', availability);
            setAvailabilityByDate(availability);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const loadMentorsForDate = (date) => {
        const dateKey = formatDateKey(date);
        const dayData = availabilityByDate[dateKey];

        if (!dayData) {
            setMentorsForDate([]);
            return;
        }

        const mentorMap = {};
        dayData.slots.forEach(slot => {
            if (!mentorMap[slot.id_mentor]) {
                mentorMap[slot.id_mentor] = {
                    mentorId: slot.id_mentor,
                    mentorName: slot.mentor.usuario.nombre,
                    materia: slot.mentor.materia_nombre || 'Sin materia',
                    materiaId: slot.mentor.id_materia,
                    maxAlumnos: slot.mentor.max_alumnos,
                    slots: []
                };
            }
            mentorMap[slot.id_mentor].slots.push({
                id_slot: slot.id_slot,
                hora: slot.hora,
                duracion: slot.duracion,
                modalidad: slot.modalidad,
                disponible: slot.disponible,
                max_alumnos: slot.mentor.max_alumnos
            });
        });

        Object.values(mentorMap).forEach(mentor => {
            mentor.slots.sort((a, b) => a.hora.localeCompare(b.hora));
        });

        console.log('👨‍🏫 Mentores para fecha:', dateKey, Object.values(mentorMap));
        setMentorsForDate(Object.values(mentorMap));
    };

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

    const formatDateKey = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    };

    const getMentorCount = (date) => {
        const dateKey = formatDateKey(date);
        return availabilityByDate[dateKey]?.mentors?.length || 0;
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelectedDate = (date) => {
        if (!date) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isPastDate = (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate < today;
    };

    const handleDayClick = (date) => {
        if (!date || isPastDate(date)) return;
        setSelectedDate(date);
    };

    const handleBookSlot = (mentor, slot) => {
        if (!currentUserId) {
            alert('Debes iniciar sesión para agendar una sesión');
            return;
        }
        console.log('🔍 Mentor seleccionado:', mentor); // Para debuggear
        setSelectedMentor(mentor);
        setSelectedSlot(slot);
        setShowConfirmModal(true);
    };

    const confirmBooking = async () => {
        if (!selectedMentor || !selectedSlot || !currentEstudianteId) return;

        setIsBooking(true);

        try {
            const fechaHora = `${formatDateKey(selectedDate)}T${selectedSlot.hora}`;

            const { data: sesionData, error: sesionError } = await sesionesAPI.registrarSesion(
                selectedMentor.mentorId,
                currentEstudianteId,
                fechaHora,
                selectedMentor.materiaId,
                selectedSlot.duracion
            );

            if (sesionError) {
                console.error('Error creating session:', sesionError);
                alert('Error al crear la sesión');
                setIsBooking(false);
                return;
            }

            const { error: slotError } = await supabase
                .from('slots_disponibles')
                .update({ disponible: false })
                .eq('id_slot', selectedSlot.id_slot);

            if (slotError) {
                console.error('Error updating slot:', slotError);
            }

            alert('¡Sesión agendada exitosamente!');
            setShowConfirmModal(false);
            setSelectedMentor(null);
            setSelectedSlot(null);
            await loadAvailability();

        } catch (error) {
            console.error('Error:', error);
            alert('Error al agendar la sesión');
        } finally {
            setIsBooking(false);
        }
    };

    if (loading) return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            fontWeight: 500,
            color: '#64748b'
        }}>
            <FontAwesomeIcon icon={faClock} spin style={{ marginRight: 12, color: '#2563eb' }} />
            Cargando calendario...
        </div>
    );

    const days = getDaysInMonth();
    const selectedMateriaName = materias.find(m => m.id_materia === selectedMateria)?.nombre_materia;

    return (
        <div style={{
            maxWidth: 'min(1400px, 92vw)',
            margin: '0 auto',
            padding: 'clamp(16px, 3vw, 24px)',
            fontFamily: 'Inter, sans-serif'
        }}>
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
                    Calendario Global
                </h1>
                <p style={{
                    color: '#64748b',
                    margin: 0,
                    fontSize: 'clamp(14px, 2vw, 16px)',
                    fontWeight: 500
                }}>
                    Encuentra mentores disponibles y agenda tu sesión
                </p>
            </div>

            {/* Filtro de materia mejorado */}
            <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                border: '2px solid #f1f5f9',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FontAwesomeIcon icon={faFilter} style={{ color: '#2563eb', fontSize: 18 }} />
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                Filtrar por materia
            </span>
                    </div>

                    <div style={{ position: 'relative', minWidth: 250 }}>
                        <select
                            value={selectedMateria || ''}
                            onChange={(e) => setSelectedMateria(e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: 10,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                outline: 'none',
                                background: '#fff',
                                color: '#0f172a',
                                appearance: 'none',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        >
                            <option value="">📚 Todas las materias</option>
                            {materias.map(materia => (
                                <option key={materia.id_materia} value={materia.id_materia}>
                                    {materia.nombre_materia}
                                </option>
                            ))}
                        </select>
                        <div style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: '#64748b'
                        }}>
                            ▼
                        </div>
                    </div>
                </div>

                {selectedMateria && (
                    <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: '#d1fae5',
                        border: '2px solid #6ee7b7',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
            <span style={{ color: '#065f46', fontWeight: 600, fontSize: 14 }}>
                📚 Filtrando por: {selectedMateriaName}
            </span>
                        <button
                            onClick={() => setSelectedMateria(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#065f46',
                                cursor: 'pointer',
                                fontSize: 18,
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                )}
            </div>

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

                            const mentorCount = getMentorCount(date);
                            const hasAvailability = mentorCount > 0;
                            const today = isToday(date);
                            const selected = isSelectedDate(date);
                            const isPast = isPastDate(date);

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleDayClick(date)}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 10,
                                        cursor: isPast ? 'not-allowed' : 'pointer',  // ← Cambiado
                                        background: isPast ? '#f9fafb' :
                                            selected ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' :
                                                hasAvailability ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                                    today ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#fff',
                                        border: today && !selected ? '2px solid #2563eb' : '2px solid #f1f5f9',
                                        color: selected ? '#fff' : isPast ? '#9ca3af' : '#0f172a',
                                        opacity: isPast ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isPast && !selected) {  // ← Cambiado, removimos hasAvailability
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isPast && !selected) {  // ← Cambiado
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    <span>{date.getDate()}</span>
                                    {hasAvailability && !isPast && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: 4,
                                            fontSize: 10,
                                            background: selected ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#fff',
                                            borderRadius: 12,
                                            padding: '2px 6px',
                                            fontWeight: 700
                                        }}>
                                            {mentorCount}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', gap: 16, fontSize: 12, fontWeight: 600, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                borderRadius: 4,
                                border: '2px solid #6ee7b7'
                            }} />
                            <span style={{ color: '#64748b' }}>Disponible</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                borderRadius: 4
                            }} />
                            <span style={{ color: '#64748b' }}>Seleccionado</span>
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

                {/* Mentores disponibles */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 24,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    maxHeight: 'calc(100vh - 100px)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                            <FontAwesomeIcon icon={faUser} style={{ marginRight: 8, color: '#2563eb' }} />
                            {selectedDate.getDate()} de {months[selectedDate.getMonth()]}
                        </h3>
                        <p style={{ color: '#64748b', margin: 0, fontSize: 14, fontWeight: 500 }}>
                            {mentorsForDate.length} {mentorsForDate.length === 1 ? 'mentor disponible' : 'mentores disponibles'}
                        </p>
                    </div>

                    {mentorsForDate.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 40,
                            color: '#6b7280',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <FontAwesomeIcon icon={faCalendar} style={{ fontSize: 36, color: '#94a3b8' }} />
                            </div>
                            <h4 style={{
                                fontWeight: 700,
                                marginBottom: 8,
                                fontSize: 18,
                                color: '#0f172a'
                            }}>
                                No hay mentores disponibles
                            </h4>
                            <p style={{ fontSize: 14, margin: 0 }}>
                                Intenta seleccionar otro día {selectedMateria && 'o cambiar el filtro de materia'}
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            overflowY: 'auto',
                            flex: 1,
                            paddingRight: 4
                        }}>
                            {mentorsForDate.map(mentor => (
                                <div key={mentor.mentorId} style={{
                                    background: '#f8fafc',
                                    borderRadius: 12,
                                    padding: 16,
                                    border: '2px solid #f1f5f9',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <div style={{
                                        marginBottom: 16,
                                        paddingBottom: 12,
                                        borderBottom: '2px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            marginBottom: 8
                                        }}>
                                            <div>
                                                <h4 style={{
                                                    margin: '0 0 4px 0',
                                                    fontSize: 16,
                                                    fontWeight: 700,
                                                    color: '#0f172a'
                                                }}>
                                                    <FontAwesomeIcon icon={faUser} style={{ marginRight: 8, color: '#2563eb', fontSize: 14 }} />
                                                    {mentor.mentorName}
                                                </h4>
                                                <p style={{
                                                    margin: '0 0 6px 0',
                                                    fontSize: 13,
                                                    color: '#64748b',
                                                    fontWeight: 500
                                                }}>
                                                    <FontAwesomeIcon icon={faBook} style={{ marginRight: 6, fontSize: 11 }} />
                                                    {mentor.materia}
                                                </p>
                                            </div>
                                            <div style={{
                                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                                color: '#1e40af',
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}>
                                                👤 {mentor.maxAlumnos}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 8
                                    }}>
                                        {mentor.slots.map(slot => {
                                            const modalidadIcon = slot.modalidad === 'zoom' ? '💻' : '🏢';
                                            const modalidadColor = slot.modalidad === 'zoom'
                                                ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                                : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                                            const modalidadText = slot.modalidad === 'zoom' ? '#1e40af' : '#065f46';
                                            const modalidadBorder = slot.modalidad === 'zoom' ? '#93c5fd' : '#6ee7b7';

                                            return (
                                                <button
                                                    key={slot.id_slot}
                                                    onClick={() => handleBookSlot(mentor, slot)}
                                                    disabled={!slot.disponible}
                                                    style={{
                                                        padding: '12px',
                                                        background: slot.disponible ? modalidadColor : '#f1f5f9',
                                                        border: slot.disponible ? `2px solid ${modalidadBorder}` : '2px solid #e2e8f0',
                                                        borderRadius: 10,
                                                        cursor: slot.disponible ? 'pointer' : 'not-allowed',
                                                        transition: 'all 0.2s ease',
                                                        fontFamily: 'Inter, sans-serif',
                                                        opacity: slot.disponible ? 1 : 0.5,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 6,
                                                        alignItems: 'flex-start'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (slot.disponible) {
                                                            e.target.style.transform = 'translateY(-2px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (slot.disponible) {
                                                            e.target.style.transform = 'translateY(0)';
                                                            e.target.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        color: slot.disponible ? modalidadText : '#94a3b8',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}>
                                                        <FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} />
                                                        {formatTimeRange(slot.hora, slot.duracion)}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        width: '100%',
                                                        gap: 6
                                                    }}>
                                                        <span style={{
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            color: slot.disponible ? modalidadText : '#94a3b8'
                                                        }}>
                                                            {modalidadIcon} {slot.modalidad === 'zoom' ? 'Zoom' : 'Presencial'}
                                                        </span>
                                                        <span style={{
                                                            fontSize: 10,
                                                            fontWeight: 700,
                                                            background: slot.disponible ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)',
                                                            color: slot.disponible ? modalidadText : '#94a3b8',
                                                            padding: '2px 6px',
                                                            borderRadius: 4
                                                        }}>
                                                            {slot.duracion}min
                                                        </span>
                                                    </div>
                                                    {!slot.disponible && (
                                                        <span style={{
                                                            fontSize: 10,
                                                            color: '#94a3b8',
                                                            fontWeight: 600,
                                                            width: '100%',
                                                            textAlign: 'center'
                                                        }}>
                                                            No disponible
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación */}
            {showConfirmModal && selectedMentor && selectedSlot && (
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
                        borderRadius: 16,
                        padding: 32,
                        maxWidth: 480,
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: '2px solid #f1f5f9'
                    }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: 28, color: '#059669' }} />
                        </div>

                        <h3 style={{
                            margin: '0 0 24px 0',
                            fontSize: 24,
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#0f172a'
                        }}>
                            Confirmar sesión
                        </h3>

                        <div style={{
                            background: '#f8fafc',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 24,
                            border: '2px solid #f1f5f9'
                        }}>
                            {/* Mentor */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    <FontAwesomeIcon icon={faUser} style={{ color: '#64748b', fontSize: 14 }} />
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Mentor:</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                    {selectedMentor.mentorName}
                                </p>
                            </div>

                            {/* Materia */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    <FontAwesomeIcon icon={faBook} style={{ color: '#64748b', fontSize: 14 }} />
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Materia:</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                    {selectedMentor.materia}
                                </p>
                            </div>

                            {/* Fecha */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    <FontAwesomeIcon icon={faCalendar} style={{ color: '#64748b', fontSize: 14 }} />
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Fecha:</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                    {selectedDate.getDate()} de {months[selectedDate.getMonth()]} de {selectedDate.getFullYear()}
                                </p>
                            </div>

                            {/* Horario */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    <FontAwesomeIcon icon={faClock} style={{ color: '#64748b', fontSize: 14 }} />
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Horario:</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#2563eb' }}>
                                    {formatTimeRange(selectedSlot.hora, selectedSlot.duracion)}
                                </p>
                            </div>

                            {/* Modalidad */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    {selectedSlot.modalidad === 'zoom' ? (
                                        <FontAwesomeIcon icon={faVideo} style={{ color: '#64748b', fontSize: 14 }} />
                                    ) : (
                                        <FontAwesomeIcon icon={faBuilding} style={{ color: '#64748b', fontSize: 14 }} />
                                    )}
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Modalidad:</span>
                                </div>
                                <p style={{
                                    margin: 0,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: selectedSlot.modalidad === 'zoom' ? '#1e40af' : '#065f46'
                                }}>
                                    {selectedSlot.modalidad === 'zoom' ? '💻 Zoom' : '🏢 Presencial'}
                                </p>
                            </div>

                            {/* Duración */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    <FontAwesomeIcon icon={faClock} style={{ color: '#64748b', fontSize: 14 }} />
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Duración:</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                    {selectedSlot.duracion} minutos
                                </p>
                            </div>

                            {/* NUEVA SECCIÓN: Capacidad */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 6
                                }}>
                                    <FontAwesomeIcon icon={faUsers} style={{ color: '#64748b', fontSize: 14 }} />
                                    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Capacidad:</span>
                                </div>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                    👤 {selectedMentor.maxAlumnos} {selectedMentor.maxAlumnos === 1 ? 'alumno' : 'alumnos'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedMentor(null);
                                    setSelectedSlot(null);
                                }}
                                disabled={isBooking}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: '#f8fafc',
                                    color: '#0f172a',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    cursor: isBooking ? 'not-allowed' : 'pointer',
                                    fontSize: 15,
                                    opacity: isBooking ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={e => {
                                    if (!isBooking) {
                                        e.target.style.background = '#f1f5f9';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isBooking) {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
                                Cancelar
                            </button>
                            <button
                                onClick={confirmBooking}
                                disabled={isBooking}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    cursor: isBooking ? 'not-allowed' : 'pointer',
                                    fontSize: 15,
                                    opacity: isBooking ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={e => {
                                    if (!isBooking) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isBooking) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />
                                {isBooking ? 'Agendando...' : 'Confirmar sesión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}