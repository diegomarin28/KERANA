import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendar, faChevronLeft, faChevronRight, faClock,
    faUser, faBook, faCheckCircle, faTimes, faVideo,
    faBuilding, faUsers, faEnvelope, faFileAlt, faDollarSign,
    faHome, faUniversity, faFilter
} from '@fortawesome/free-solid-svg-icons';

export default function MentorCalendarModal({
                                                open,
                                                onClose,
                                                mentorId,
                                                mentorName,
                                                supabase,
                                                slotsAPI,
                                                currentUserId
                                            }) {
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availabilityByDate, setAvailabilityByDate] = useState({});
    const [slotsForDate, setSlotsForDate] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [numPersonas, setNumPersonas] = useState(1);
    const [emailsParticipantes, setEmailsParticipantes] = useState(['']);
    const [descripcionSesion, setDescripcionSesion] = useState('');
    const [erroresValidacion, setErroresValidacion] = useState({});

    // Nuevos estados para materias
    const [mentorMaterias, setMentorMaterias] = useState([]);

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    useEffect(() => {
        if (open && mentorId) {
            loadMentorMaterias();
        }
    }, [open, mentorId]);

    useEffect(() => {
        if (mentorMaterias.length > 0) {
            loadAvailability();
        }
    }, [mentorMaterias]);

    useEffect(() => {
        if (selectedDate) {
            loadSlotsForDate(selectedDate);
        }
    }, [selectedDate, availabilityByDate]);

    useEffect(() => {
        if (showConfirmModal && currentUserId) {
            const fetchUserEmail = async () => {
                console.log('🔍 Buscando email para usuario:', currentUserId);
                const { data, error } = await supabase
                    .from('usuario')
                    .select('correo')
                    .eq('id_usuario', currentUserId)
                    .single();

                console.log('📧 Resultado búsqueda email:', { data, error });

                if (data?.correo) {
                    console.log('✅ Email encontrado:', data.correo);
                    setEmailsParticipantes([data.correo]);
                }
            };
            fetchUserEmail();
        }
    }, [showConfirmModal, currentUserId]);

    const loadMentorMaterias = async () => {
        try {
            // Obtener todas las materias del mentor desde mentor_materia
            const { data: mentorMateriasData, error } = await supabase
                .from('mentor_materia')
                .select(`
                    id,
                    id_materia,
                    materia:id_materia (
                        id_materia,
                        nombre_materia,
                        semestre
                    )
                `)
                .eq('id_mentor', mentorId);

            if (error) {
                console.error('Error cargando materias del mentor:', error);
                return;
            }

            console.log('📚 Materias del mentor:', mentorMateriasData);

            const materias = mentorMateriasData?.map(mm => ({
                id_materia: mm.materia.id_materia,
                nombre_materia: mm.materia.nombre_materia,
                semestre: mm.materia.semestre
            })) || [];

            setMentorMaterias(materias);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const loadAvailability = async () => {
        setLoading(true);
        const now = new Date();
        const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        try {
            const { data: slotsData, error } = await slotsAPI.obtenerSlotsDisponiblesGlobal(
                now.toISOString().split('T')[0],
                threeMonthsLater.toISOString().split('T')[0]
            );

            if (error) {
                console.error('Error loading slots:', error);
                setLoading(false);
                return;
            }

            // Filtrar solo los slots de este mentor
            const mentorSlots = slotsData?.filter(slot => slot.id_mentor === mentorId) || [];

            console.log('🔍 Slots del mentor:', mentorSlots);

            const availability = {};

            // Para cada slot, crear una entrada por cada materia del mentor
            mentorSlots.forEach(slot => {
                mentorMaterias.forEach(materia => {
                    if (!availability[slot.fecha]) {
                        availability[slot.fecha] = {
                            slots: []
                        };
                    }
                    availability[slot.fecha].slots.push({
                        ...slot,
                        materia_nombre: materia.nombre_materia,
                        materia_id: materia.id_materia,
                        // Crear un ID único para cada combinación slot-materia
                        id_slot_materia: `${slot.id_slot}_${materia.id_materia}`
                    });
                });
            });

            console.log('✅ Disponibilidad final:', availability);

            setAvailabilityByDate(availability);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSlotsForDate = (date) => {
        const dateKey = formatDateKey(date);
        const dayData = availabilityByDate[dateKey];

        if (!dayData) {
            setSlotsForDate([]);
            return;
        }

        let slots = dayData.slots.map(slot => ({
            id_slot: slot.id_slot,
            id_slot_materia: slot.id_slot_materia,
            hora: slot.hora,
            duracion: slot.duracion,
            modalidad: slot.modalidad,
            disponible: slot.disponible,
            max_alumnos: slot.max_alumnos,
            locacion: slot.locacion,
            materia_nombre: slot.materia_nombre,
            materia_id: slot.materia_id
        }));

        slots.sort((a, b) => a.hora.localeCompare(b.hora));
        setSlotsForDate(slots);
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

    const hasAvailability = (date) => {
        const dateKey = formatDateKey(date);
        const daySlots = availabilityByDate[dateKey]?.slots || [];
        return daySlots.length > 0;
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

    const calcularPrecio = (cantidad, modalidad) => {
        const preciosBase = {
            virtual: { 1: 430, 2: 760, 3: 990 },
            presencial: { 1: 630, 2: 1160, 3: 1590 }
        };
        return preciosBase[modalidad]?.[cantidad] || 0;
    };

    const validarEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@correo\.um\.edu\.uy$/;
        return regex.test(email.trim());
    };

    const validarFormulario = () => {
        const errores = {};
        emailsParticipantes.forEach((email, index) => {
            if (!email.trim()) {
                errores[`email_${index}`] = 'El email es obligatorio';
            } else if (!validarEmail(email)) {
                errores[`email_${index}`] = 'Debe ser un email @correo.um.edu.uy';
            }
        });
        setErroresValidacion(errores);
        return Object.keys(errores).length === 0;
    };

    const handleNumPersonasChange = (cantidad) => {
        setNumPersonas(cantidad);
        const nuevosEmails = [...emailsParticipantes];
        if (cantidad > emailsParticipantes.length) {
            while (nuevosEmails.length < cantidad) {
                nuevosEmails.push('');
            }
        } else {
            nuevosEmails.length = cantidad;
        }
        setEmailsParticipantes(nuevosEmails);
        setErroresValidacion({});
    };

    const handleEmailChange = (index, value) => {
        const nuevosEmails = [...emailsParticipantes];
        nuevosEmails[index] = value;
        setEmailsParticipantes(nuevosEmails);

        if (erroresValidacion[`email_${index}`]) {
            const nuevosErrores = { ...erroresValidacion };
            delete nuevosErrores[`email_${index}`];
            setErroresValidacion(nuevosErrores);
        }
    };

    const resetModal = () => {
        setNumPersonas(1);
        setEmailsParticipantes(['']);
        setDescripcionSesion('');
        setErroresValidacion({});
        setShowConfirmModal(false);
        setSelectedSlot(null);
    };

    const handleBookSlot = (slot) => {
        if (!currentUserId) {
            setErrorMessage('Debes iniciar sesión para agendar una sesión');
            setShowErrorModal(true);
            return;
        }
        setSelectedSlot(slot);
        setShowConfirmModal(true);
    };

    const confirmBooking = async () => {
        if (!selectedSlot || !currentUserId) return;

        if (!validarFormulario()) {
            setErrorMessage('Por favor corrige los errores en el formulario');
            return;
        }

        setIsBooking(true);

        try {
            const { data: slotActual, error: checkError } = await supabase
                .from('slots_disponibles')
                .select('disponible')
                .eq('id_slot', selectedSlot.id_slot)
                .single();

            if (checkError || !slotActual?.disponible) {
                setErrorMessage('Lo sentimos, este slot ya no está disponible. Alguien más lo reservó.');
                setShowErrorModal(true);
                resetModal();
                setIsBooking(false);
                return;
            }

            const precioTotal = calcularPrecio(numPersonas, selectedSlot.modalidad);
            const pagoExitoso = true; // Simulado

            if (!pagoExitoso) {
                setErrorMessage('El pago no pudo procesarse. Intenta nuevamente.');
                setShowErrorModal(true);
                setIsBooking(false);
                return;
            }

            const fechaHora = `${formatDateKey(selectedDate)}T${selectedSlot.hora}`;

            const { data: sesionData, error: sesionError } = await supabase
                .from('mentor_sesion')
                .insert({
                    id_mentor: mentorId,
                    id_alumno: currentUserId,
                    id_materia: selectedSlot.materia_id,
                    fecha_hora: fechaHora,
                    duracion_minutos: selectedSlot.duracion,
                    estado: 'confirmada',
                    pagado: true,
                    precio: precioTotal,
                    cantidad_alumnos: numPersonas,
                    emails_participantes: emailsParticipantes,
                    descripcion_alumno: descripcionSesion.trim() || null
                })
                .select()
                .single();

            if (sesionError) {
                console.error('Error creating session:', sesionError);
                setErrorMessage('Error al crear la sesión. Por favor, intenta nuevamente.');
                setShowErrorModal(true);
                setIsBooking(false);
                return;
            }

            const { error: slotError } = await supabase
                .rpc('marcar_slot_no_disponible', { p_id_slot: selectedSlot.id_slot });

            if (slotError) {
                console.error('Error updating slot:', slotError);
            }

            setShowSuccessModal(true);
            resetModal();
            loadAvailability();

        } catch (error) {
            console.error('Error:', error);
            setErrorMessage('Error inesperado al agendar la sesión. Por favor, intenta nuevamente.');
            setShowErrorModal(true);
        } finally {
            setIsBooking(false);
        }
    };

    if (!open) return null;

    const days = getDaysInMonth();

    return (
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
            padding: 20,
            overflowY: 'auto',
            fontFamily: 'Inter, sans-serif'
        }}
             onClick={onClose}>
            <div style={{
                background: '#fff',
                borderRadius: 20,
                width: '100%',
                maxWidth: 1200,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
                border: '3px solid #10B981',
                fontFamily: 'Inter, sans-serif'
            }}
                 onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: 24,
                    borderBottom: '2px solid #f1f5f9',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderRadius: '18px 18px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h2 style={{
                            margin: '0 0 8px 0',
                            fontSize: 28,
                            fontWeight: 800,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12
                        }}>
                            <FontAwesomeIcon icon={faCalendar} />
                            Agendar Mentoría
                        </h2>
                        <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            con {mentorName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            fontSize: 20,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {loading ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 400,
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#64748b'
                    }}>
                        <FontAwesomeIcon icon={faClock} spin style={{ marginRight: 12, color: '#10B981' }} />
                        Cargando disponibilidad...
                    </div>
                ) : (
                    <div style={{ padding: 24 }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr',
                            gap: 24
                        }}>
                            {/* Calendario */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: 16,
                                padding: 20,
                                border: '2px solid #f1f5f9'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 20
                                }}>
                                    <button
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                        style={{
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 10,
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: 16
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faChevronLeft} />
                                    </button>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: '#0f172a'
                                    }}>
                                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <button
                                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                        style={{
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 10,
                                            padding: '10px 16px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
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
                                            padding: '8px 0'
                                        }}>
                                            {day}
                                        </div>
                                    ))}

                                    {days.map((date, index) => {
                                        if (!date) return <div key={`empty-${index}`} />;

                                        const available = hasAvailability(date);
                                        const today = isToday(date);
                                        const selected = isSelectedDate(date);
                                        const isPast = isPastDate(date);

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => handleDayClick(date)}
                                                style={{
                                                    aspectRatio: '1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: 10,
                                                    cursor: isPast ? 'not-allowed' : 'pointer',
                                                    background: isPast ? '#f9fafb' :
                                                        selected ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                                                            available ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' :
                                                                today ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#fff',
                                                    border: today && !selected ? '2px solid #10B981' : '2px solid #f1f5f9',
                                                    color: selected ? '#fff' : isPast ? '#9ca3af' : '#0f172a',
                                                    opacity: isPast ? 0.5 : 1,
                                                    transition: 'all 0.2s ease',
                                                    fontSize: 14,
                                                    fontWeight: 600
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isPast && !selected) {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isPast && !selected) {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = 'none';
                                                    }
                                                }}
                                            >
                                                {date.getDate()}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Horarios disponibles */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: 16,
                                padding: 20,
                                border: '2px solid #f1f5f9',
                                maxHeight: 500,
                                overflowY: 'auto'
                            }}>
                                <h3 style={{
                                    margin: '0 0 16px 0',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    {selectedDate.getDate()} de {months[selectedDate.getMonth()]}
                                </h3>

                                {slotsForDate.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 40,
                                        color: '#6b7280'
                                    }}>
                                        <FontAwesomeIcon icon={faCalendar} style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>
                                            No hay horarios disponibles
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                        gap: 12
                                    }}>
                                        {slotsForDate.map(slot => {
                                            const modalidadColor = slot.modalidad === 'virtual'
                                                ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                                : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
                                            const modalidadText = slot.modalidad === 'virtual' ? '#1e40af' : '#065f46';
                                            const modalidadBorder = slot.modalidad === 'virtual' ? '#93c5fd' : '#6ee7b7';

                                            return (
                                                <button
                                                    key={`${slot.id_slot}_${slot.materia_id}`}
                                                    onClick={() => handleBookSlot(slot)}
                                                    disabled={!slot.disponible}
                                                    style={{
                                                        padding: 14,
                                                        background: slot.disponible ? modalidadColor : '#f1f5f9',
                                                        border: slot.disponible ? `2px solid ${modalidadBorder}` : '2px solid #e2e8f0',
                                                        borderRadius: 12,
                                                        cursor: slot.disponible ? 'pointer' : 'not-allowed',
                                                        opacity: slot.disponible ? 1 : 0.5,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 8,
                                                        transition: 'all 0.2s ease',
                                                        fontFamily: 'Inter, sans-serif'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (slot.disponible) {
                                                            e.target.style.transform = 'translateY(-2px)';
                                                            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
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
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        color: slot.disponible ? modalidadText : '#94a3b8'
                                                    }}>
                                                        <FontAwesomeIcon icon={faClock} style={{ marginRight: 6, fontSize: 12 }} />
                                                        {formatTimeRange(slot.hora, slot.duracion)}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        color: slot.disponible ? modalidadText : '#94a3b8'
                                                    }}>
                                                        {slot.modalidad === 'virtual' ? '💻 Virtual' : '🏢 Presencial'}
                                                        {slot.modalidad === 'presencial' && slot.locacion && (
                                                            <span style={{ marginLeft: 4 }}>
                                                                {slot.locacion === 'casa' ? '🏠' : '🎓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        color: slot.disponible ? modalidadText : '#94a3b8'
                                                    }}>
                                                        📚 {slot.materia_nombre}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de confirmación - RESTO DEL CÓDIGO IGUAL */}
                {showConfirmModal && selectedSlot && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: 20
                    }}
                         onClick={resetModal}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 16,
                            padding: 32,
                            maxWidth: 600,
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                             onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 24,
                                paddingBottom: 16,
                                borderBottom: '2px solid #f1f5f9'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10
                                }}>
                                    <FontAwesomeIcon icon={faCalendar} style={{ color: '#10B981' }} />
                                    Confirmar Mentoría
                                </h3>
                                <button
                                    onClick={resetModal}
                                    disabled={isBooking}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: 24,
                                        color: '#94a3b8',
                                        cursor: isBooking ? 'not-allowed' : 'pointer',
                                        padding: 4
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>

                            {/* Info de la sesión */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: 12,
                                padding: 20,
                                marginBottom: 24,
                                border: '2px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <FontAwesomeIcon icon={faUser} style={{ color: '#64748b', fontSize: 12 }} />
                                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Mentor</span>
                                        </div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                            {mentorName}
                                        </p>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <FontAwesomeIcon icon={faBook} style={{ color: '#64748b', fontSize: 12 }} />
                                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Materia</span>
                                        </div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                                            {selectedSlot.materia_nombre}
                                        </p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                <FontAwesomeIcon icon={faCalendar} style={{ color: '#64748b', fontSize: 12 }} />
                                                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Fecha</span>
                                            </div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                                                {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                                            </p>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                <FontAwesomeIcon icon={faClock} style={{ color: '#64748b', fontSize: 12 }} />
                                                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Hora</span>
                                            </div>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#10B981' }}>
                                                {formatTimeRange(selectedSlot.hora, selectedSlot.duracion)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <FontAwesomeIcon
                                                icon={selectedSlot.modalidad === 'virtual' ? faVideo : faBuilding}
                                                style={{ color: '#64748b', fontSize: 12 }}
                                            />
                                            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Modalidad</span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: selectedSlot.modalidad === 'virtual' ? '#1e40af' : '#065f46',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}>
                                            {selectedSlot.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                                            {selectedSlot.modalidad === 'presencial' && selectedSlot.locacion && (
                                                <span style={{ fontSize: 12 }}>
                                                    <FontAwesomeIcon
                                                        icon={selectedSlot.locacion === 'casa' ? faHome : faUniversity}
                                                        style={{ marginRight: 4 }}
                                                    />
                                                    {selectedSlot.locacion === 'casa' ? 'Casa del mentor' : 'Facultad'}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cantidad de personas */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 12,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    <FontAwesomeIcon icon={faUsers} style={{ color: '#10B981' }} />
                                    ¿Cuántas personas asistirán?
                                </label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {[1, 2, 3].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumPersonasChange(num)}
                                            disabled={isBooking || num > selectedSlot.max_alumnos}
                                            style={{
                                                flex: 1,
                                                padding: 14,
                                                background: numPersonas === num
                                                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                                    : '#fff',
                                                color: numPersonas === num ? '#fff' : '#0f172a',
                                                border: numPersonas === num ? 'none' : '2px solid #e2e8f0',
                                                borderRadius: 10,
                                                fontWeight: 700,
                                                fontSize: 16,
                                                cursor: (isBooking || num > selectedSlot.max_alumnos) ? 'not-allowed' : 'pointer',
                                                opacity: num > selectedSlot.max_alumnos ? 0.5 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Precio */}
                            <div style={{
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                border: '2px solid #93c5fd',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FontAwesomeIcon icon={faDollarSign} style={{ color: '#1e40af', fontSize: 18 }} />
                                    <span style={{ color: '#1e40af', fontSize: 14, fontWeight: 600 }}>Precio total:</span>
                                </div>
                                <span style={{ color: '#1e40af', fontSize: 24, fontWeight: 800 }}>
                                    ${calcularPrecio(numPersonas, selectedSlot.modalidad)} UYU
                                </span>
                            </div>

                            {/* Emails */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 12,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    <FontAwesomeIcon icon={faEnvelope} style={{ color: '#10B981' }} />
                                    Email{numPersonas > 1 ? 's' : ''} institucional{numPersonas > 1 ? 'es' : ''}
                                    <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {emailsParticipantes.map((email, index) => (
                                        <div key={index}>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => handleEmailChange(index, e.target.value)}
                                                    placeholder={index === 0 ? 'tu@correo.um.edu.uy' : `email${index + 1}@correo.um.edu.uy`}
                                                    disabled={isBooking}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 14px 12px 40px',
                                                        border: erroresValidacion[`email_${index}`] ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                        borderRadius: 10,
                                                        fontSize: 14,
                                                        fontWeight: 500,
                                                        outline: 'none',
                                                        transition: 'all 0.2s ease',
                                                        background: isBooking ? '#f9fafb' : '#fff'
                                                    }}
                                                />
                                                <FontAwesomeIcon
                                                    icon={faEnvelope}
                                                    style={{
                                                        position: 'absolute',
                                                        left: 14,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        color: erroresValidacion[`email_${index}`] ? '#ef4444' : '#94a3b8',
                                                        fontSize: 14
                                                    }}
                                                />
                                            </div>
                                            {erroresValidacion[`email_${index}`] && (
                                                <p style={{
                                                    margin: '6px 0 0 0',
                                                    fontSize: 12,
                                                    color: '#ef4444',
                                                    fontWeight: 600
                                                }}>
                                                    {erroresValidacion[`email_${index}`]}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p style={{
                                    margin: '8px 0 0 0',
                                    fontSize: 12,
                                    color: '#64748b',
                                    fontWeight: 500
                                }}>
                                    Solo se aceptan emails institucionales @correo.um.edu.uy
                                </p>
                            </div>

                            {/* Descripción */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 12,
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#0f172a'
                                }}>
                                    <FontAwesomeIcon icon={faFileAlt} style={{ color: '#10B981' }} />
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={descripcionSesion}
                                    onChange={(e) => setDescripcionSesion(e.target.value)}
                                    placeholder="Ej: Quiero repasar derivadas y límites para el parcial..."
                                    disabled={isBooking}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: 10,
                                        fontSize: 14,
                                        fontWeight: 500,
                                        outline: 'none',
                                        resize: 'vertical',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif',
                                        background: isBooking ? '#f9fafb' : '#fff'
                                    }}
                                />
                                <p style={{
                                    margin: '6px 0 0 0',
                                    fontSize: 12,
                                    color: '#64748b',
                                    fontWeight: 500
                                }}>
                                    Ayuda al mentor a prepararse mejor para la sesión
                                </p>
                            </div>

                            {/* Botones */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={resetModal}
                                    disabled={isBooking}
                                    style={{
                                        flex: 1,
                                        padding: 14,
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        cursor: isBooking ? 'not-allowed' : 'pointer',
                                        fontSize: 15,
                                        opacity: isBooking ? 0.5 : 1,
                                        transition: 'all 0.2s ease'
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
                                        padding: 14,
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        cursor: isBooking ? 'not-allowed' : 'pointer',
                                        fontSize: 15,
                                        opacity: isBooking ? 0.7 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />
                                    {isBooking ? 'Procesando...' : 'Confirmar y pagar →'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de éxito */}
                {showSuccessModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: 40,
                            maxWidth: 420,
                            width: '100%',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                            border: '3px solid #10b981',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: 48, color: '#059669' }} />
                            </div>
                            <h3 style={{
                                margin: '0 0 12px 0',
                                fontSize: 26,
                                fontWeight: 800,
                                color: '#0f172a'
                            }}>
                                ¡Sesión agendada!
                            </h3>
                            <p style={{
                                color: '#64748b',
                                margin: '0 0 32px 0',
                                fontSize: 15,
                                lineHeight: 1.6,
                                fontWeight: 500
                            }}>
                                Tu sesión ha sido confirmada exitosamente. Recibirás más detalles por correo.
                            </p>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    onClose();
                                }}
                                style={{
                                    width: '100%',
                                    padding: 16,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal de error */}
                {showErrorModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: 40,
                            maxWidth: 420,
                            width: '100%',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                            border: '3px solid #ef4444',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <FontAwesomeIcon icon={faTimes} style={{ fontSize: 48, color: '#dc2626' }} />
                            </div>
                            <h3 style={{
                                margin: '0 0 12px 0',
                                fontSize: 26,
                                fontWeight: 800,
                                color: '#0f172a'
                            }}>
                                Algo salió mal
                            </h3>
                            <p style={{
                                color: '#64748b',
                                margin: '0 0 32px 0',
                                fontSize: 15,
                                lineHeight: 1.6,
                                fontWeight: 500
                            }}>
                                {errorMessage}
                            </p>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                style={{
                                    width: '100%',
                                    padding: 16,
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 12,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}