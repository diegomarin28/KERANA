import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { slotsAPI } from '../api/slots';
import { sesionesAPI } from '../api/sesiones';
import { notificationTypes } from '../api/notificationTypes';
import { enviarEmailsConfirmacion } from '../utils/emailService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendar, faChevronLeft, faChevronRight, faClock,
    faUser, faBook, faCheckCircle, faTimes, faVideo,
    faBuilding, faUsers, faFilter, faXmark, faEnvelope,
    faFileAlt, faDollarSign, faHome, faUniversity, faAngleDown
} from '@fortawesome/free-solid-svg-icons';
import { SlotSelector } from '../components/SlotSelector';
import { calcularPrecioPorDuracion, formatearPrecio } from '../utils/preciosHelper';

export function GlobalCalendar() {
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
    const [validandoReserva, setValidandoReserva] = useState(false);
    const [slotSeleccionadoParaReserva, setSlotSeleccionadoParaReserva] = useState(null);

    // Estados para modales de resultado
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Estados para el filtro de materias
    const [materias, setMaterias] = useState([]);
    const [selectedMateria, setSelectedMateria] = useState(null);

    // Estados para el modal mejorado
    const [numPersonas, setNumPersonas] = useState(1);
    const [emailsParticipantes, setEmailsParticipantes] = useState(['']);
    const [descripcionSesion, setDescripcionSesion] = useState('');
    const [erroresValidacion, setErroresValidacion] = useState({});


    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

    // Configurar Supabase Realtime
    useEffect(() => {
        loadInitialData();

        const subscription = supabase
            .channel('slots-disponibles-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'slots_disponibles'
                },
                async (payload) => {
                    console.log('📄 Slot actualizado en tiempo real:', payload);
                    await loadAvailability();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Suscripción Realtime activa');
                }
            });

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [selectedMateria]);

    useEffect(() => {
        if (selectedDate) {
            loadMentorsForDate(selectedDate);
        }
    }, [selectedDate, availabilityByDate]);

    // Autocompletar email del usuario
    useEffect(() => {
        if (showConfirmModal && currentUserId && emailsParticipantes.length === 1 && !emailsParticipantes[0]) {
            const fetchUserEmail = async () => {
                const { data } = await supabase
                    .from('usuario')
                    .select('correo')
                    .eq('id_usuario', currentUserId)
                    .single();

                if (data?.correo && slotSeleccionadoParaReserva?.modalidad === 'virtual') {
                    // Solo autocompletar si es email institucional
                    if (data.correo.endsWith('@correo.um.edu.uy')) {
                        setEmailsParticipantes([data.correo]);
                    }
                }
            };
            fetchUserEmail();
        }
    }, [showConfirmModal, currentUserId, slotSeleccionadoParaReserva]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([
            getUserData(),
            loadMentorMaterias(),
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

    const loadMentorMaterias = async () => {
        try {
            const { data: allMentorMaterias } = await supabase
                .from('mentor_materia')
                .select(`
                id_materia,
                materia:id_materia (
                    id_materia,
                    nombre_materia
                )
            `);

            const uniqueMaterias = {};
            allMentorMaterias?.forEach(mm => {
                if (mm.materia && !uniqueMaterias[mm.materia.id_materia]) {
                    uniqueMaterias[mm.materia.id_materia] = {
                        id_materia: mm.materia.id_materia,
                        nombre_materia: mm.materia.nombre_materia
                    };
                }
            });

            setMaterias(Object.values(uniqueMaterias));
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    };

    // Mantener para backward compatibility (grupos)
    const calcularPrecioGrupo = (cantidad, modalidad) => {
        const preciosBase = {
            virtual: { 1: 430, 2: 760, 3: 990 },
            presencial: { 1: 630, 2: 1160, 3: 1590 }
        };
        return preciosBase[modalidad]?.[cantidad] || 0;
    };

// Nueva función que usa duración O grupo
    const calcularPrecio = (numPersonas, modalidad, duracion = null) => {
        // Si se especifica duración, usar cálculo por duración
        if (duracion && duracion !== 60) {
            return calcularPrecioPorDuracion(duracion, modalidad);
        }
        // Sino, usar el cálculo por grupo (backward compatibility)
        return calcularPrecioGrupo(numPersonas, modalidad);
    };

    const validarEmailInstitucional = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@correo\.um\.edu\.uy$/;
        return regex.test(email.trim());
    };

    const validarEmailGenerico = (email) => {
        // validación básica de email
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email.trim());
    };


    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };


    const minutesToTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const validarFormulario = () => {
        const errores = {};
        const esVirtual = selectedSlot?.modalidad === 'virtual';

        emailsParticipantes.forEach((email, index) => {
            if (!email.trim()) {
                errores[`email_${index}`] = 'El email es obligatorio';
            } else {
                const ok = esVirtual ? validarEmailInstitucional(email) : validarEmailGenerico(email);
                if (!ok) {
                    errores[`email_${index}`] = esVirtual
                        ? 'Debe ser un email @correo.um.edu.uy'
                        : 'Email inválido';
                }
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
        setSelectedMentor(null);
        setSelectedSlot(null);
    };

    /**
     * Verifica que todo el rango horario esté disponible
     */
    const verificarDisponibilidadRango = async (slotId, horaInicio, horaFin) => {
        try {
            const { data: slot } = await supabase
                .from('slots_disponibles')
                .select('*')
                .eq('id_slot', slotId)
                .eq('disponible', true)
                .single();

            if (!slot) return false;

            // Verificar que el rango solicitado esté dentro del slot disponible
            const slotInicioMin = timeToMinutes(slot.hora);
            const slotFinMin = timeToMinutes(slot.hora_fin);
            const reservaInicioMin = timeToMinutes(horaInicio);
            const reservaFinMin = timeToMinutes(horaFin);

            return (
                reservaInicioMin >= slotInicioMin &&
                reservaFinMin <= slotFinMin
            );
        } catch (error) {
            console.error('Error verificando disponibilidad:', error);
            return false;
        }
    };

    /**
     * Valida que haya tiempo suficiente entre slots presenciales
     * en ubicaciones diferentes (V3)
     */
    const validarUbicacionPresencialUsuario = async (mentorId, fecha, horaInicio, locacion) => {
        if (!locacion) return { valido: true };

        try {
            // Buscar slots ocupados anteriores en el mismo día
            const { data: slotsAnteriores } = await supabase
                .from('slots_disponibles')
                .select('*')
                .eq('id_mentor', mentorId)
                .eq('fecha', fecha)
                .eq('disponible', false)
                .eq('modalidad', 'presencial')
                .lt('hora_fin', horaInicio);

            if (!slotsAnteriores || slotsAnteriores.length === 0) {
                return { valido: true };
            }

            // Verificar el slot anterior más cercano
            const slotAnterior = slotsAnteriores
                .sort((a, b) => timeToMinutes(b.hora_fin) - timeToMinutes(a.hora_fin))[0];

            const finAnterior = timeToMinutes(slotAnterior.hora_fin);
            const inicioNuevo = timeToMinutes(horaInicio);
            const diferencia = inicioNuevo - finAnterior;

            // Si son ubicaciones diferentes y hay menos de 30 min
            if (slotAnterior.locacion !== locacion && diferencia < 30) {
                const ubicacionAnterior = slotAnterior.locacion === 'casa' ? 'Casa del mentor' : 'Facultad';
                const ubicacionNueva = locacion === 'casa' ? 'Casa del mentor' : 'Facultad';

                return {
                    valido: false,
                    mensaje: `No se puede reservar sesión presencial en ${ubicacionNueva} debido a una sesión anterior en ${ubicacionAnterior}. Tiempo mínimo requerido: 30 minutos.`
                };
            }

            return { valido: true };
        } catch (error) {
            console.error('Error validando ubicación:', error);
            return {
                valido: false,
                mensaje: 'Error validando disponibilidad. Intenta nuevamente.'
            };
        }
    };

    /**
     * Divide el slot disponible y crea la reserva
     * Elimina fragmentos < 60 min (V2)
     */
    const dividirYReservarSlot = async (slotOriginal, horaInicio, horaFin, duracion, userId) => {
        const inicioSlot = timeToMinutes(slotOriginal.hora);
        const finSlot = timeToMinutes(slotOriginal.hora_fin);
        const inicioReserva = timeToMinutes(horaInicio);
        const finReserva = timeToMinutes(horaFin);

        console.log('🔪 Dividiendo slot:', {
            slotOriginal: `${slotOriginal.hora}-${slotOriginal.hora_fin}`,
            reserva: `${horaInicio}-${horaFin}`,
            userId
        });

        // PASO 1: Calcular fragmentos
        const fragmentoInicial = inicioReserva - inicioSlot;
        const fragmentoFinal = finSlot - finReserva;

        console.log('📊 Fragmentos:', {
            inicial: fragmentoInicial,
            final: fragmentoFinal
        });

        // PASO 2: Eliminar slot original
        const { error: errorDelete } = await supabase
            .from('slots_disponibles')
            .delete()
            .eq('id_slot', slotOriginal.id_slot);

        if (errorDelete) {
            console.error('❌ Error eliminando slot original:', errorDelete);
            throw new Error('No se pudo eliminar el slot original');
        }

        console.log('✅ Slot original eliminado');

        // PASO 3: Crear fragmento inicial solo si >= 60 min
        if (fragmentoInicial >= 60) {
            const { error: errorInicial } = await supabase
                .from('slots_disponibles')
                .insert({
                    id_mentor: slotOriginal.id_mentor,
                    fecha: slotOriginal.fecha,
                    hora: slotOriginal.hora,
                    hora_fin: horaInicio,
                    duracion: fragmentoInicial,
                    modalidad: slotOriginal.modalidad,
                    locacion: slotOriginal.locacion,
                    max_alumnos: slotOriginal.max_alumnos,
                    disponible: true
                });

            if (errorInicial) {
                console.error('❌ Error creando fragmento inicial:', errorInicial);
            } else {
                console.log(`✅ Fragmento inicial creado: ${slotOriginal.hora}-${horaInicio} (${fragmentoInicial}min)`);
            }
        } else {
            console.log(`⏭️ Fragmento inicial descartado (${fragmentoInicial}min < 60min)`);
        }

        // PASO 4: Crear registro de reserva
        const { data: reserva, error: errorReserva } = await supabase
            .from('slots_disponibles')
            .insert({
                id_mentor: slotOriginal.id_mentor,
                fecha: slotOriginal.fecha,
                hora: horaInicio,
                hora_fin: horaFin,
                duracion: duracion,
                modalidad: slotOriginal.modalidad,
                locacion: slotOriginal.locacion,
                max_alumnos: slotOriginal.max_alumnos,
                disponible: false,
                reservado_por: userId
            })
            .select()
            .single();

        if (errorReserva) {
            console.error('❌ Error creando reserva:', errorReserva);
            throw new Error('No se pudo crear la reserva');
        }

        console.log(`✅ Reserva creada: ${horaInicio}-${horaFin}`);

        // PASO 5: Crear fragmento final solo si >= 60 min
        if (fragmentoFinal >= 60) {
            const { error: errorFinal } = await supabase
                .from('slots_disponibles')
                .insert({
                    id_mentor: slotOriginal.id_mentor,
                    fecha: slotOriginal.fecha,
                    hora: horaFin,
                    hora_fin: slotOriginal.hora_fin,
                    duracion: fragmentoFinal,
                    modalidad: slotOriginal.modalidad,
                    locacion: slotOriginal.locacion,
                    max_alumnos: slotOriginal.max_alumnos,
                    disponible: true
                });

            if (errorFinal) {
                console.error('❌ Error creando fragmento final:', errorFinal);
            } else {
                console.log(`✅ Fragmento final creado: ${horaFin}-${slotOriginal.hora_fin} (${fragmentoFinal}min)`);
            }
        } else {
            console.log(`⏭️ Fragmento final descartado (${fragmentoFinal}min < 60min)`);
        }

        return reserva;
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

            // Obtener materias de cada mentor
            const mentorIds = [...new Set(slotsData?.map(s => s.id_mentor))];
            const mentorMateriasMap = {};

            for (const mentorId of mentorIds) {
                const { data: mentorMaterias } = await supabase
                    .from('mentor_materia')
                    .select(`
                    id_materia,
                    materia:id_materia (
                        id_materia,
                        nombre_materia
                    )
                `)
                    .eq('id_mentor', mentorId);

                mentorMateriasMap[mentorId] = mentorMaterias?.map(mm => ({
                    id_materia: mm.materia.id_materia,
                    nombre_materia: mm.materia.nombre_materia
                })) || [];
            }

            const availability = {};

            // Para cada slot, crear múltiples entradas (una por cada materia del mentor)
            slotsData?.forEach(slot => {
                if (!slot.disponible) return;

                const mentorMaterias = mentorMateriasMap[slot.id_mentor] || [];

                mentorMaterias.forEach(materia => {
                    // Filtrar por materia seleccionada si existe
                    if (selectedMateria && materia.id_materia !== selectedMateria) {
                        return;
                    }

                    if (!availability[slot.fecha]) {
                        availability[slot.fecha] = {
                            mentors: new Set(),
                            slots: []
                        };
                    }

                    availability[slot.fecha].mentors.add(`${slot.id_mentor}_${materia.id_materia}`);
                    availability[slot.fecha].slots.push({
                        ...slot,
                        materia_id: materia.id_materia,
                        materia_nombre: materia.nombre_materia,
                        slot_materia_id: `${slot.id_slot}_${materia.id_materia}`
                    });
                });
            });

            Object.keys(availability).forEach(date => {
                availability[date].mentors = Array.from(availability[date].mentors);
            });

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

        const mentorMateriaMap = {};

        dayData.slots.forEach(slot => {
            const key = `${slot.id_mentor}_${slot.materia_id}`;

            if (!mentorMateriaMap[key]) {
                mentorMateriaMap[key] = {
                    mentorId: slot.id_mentor,
                    mentorName: slot.mentor.usuario.nombre,
                    materia: slot.materia_nombre,
                    materiaId: slot.materia_id,
                    maxAlumnos: slot.mentor.max_alumnos,
                    slots: []
                };
            }

            mentorMateriaMap[key].slots.push({
                id_slot: slot.id_slot,
                slot_materia_id: slot.slot_materia_id,
                hora: slot.hora,
                duracion: slot.duracion,
                modalidad: slot.modalidad,
                disponible: slot.disponible,
                max_alumnos: slot.max_alumnos,
                locacion: slot.locacion
            });
        });

        Object.values(mentorMateriaMap).forEach(mentor => {
            mentor.slots.sort((a, b) => a.hora.localeCompare(b.hora));
        });

        setMentorsForDate(Object.values(mentorMateriaMap));
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
            setErrorMessage('Debes iniciar sesión para agendar una sesión');
            setShowErrorModal(true);
            return;
        }
        setSelectedMentor(mentor);
        setSelectedSlot(slot);
        setSlotSeleccionadoParaReserva(slot); // ✅ AGREGAR ESTA LÍNEA
        setShowConfirmModal(true);
    };

    const handleBooking = async (datosReserva) => {
        if (!selectedMentor || !slotSeleccionadoParaReserva || !currentEstudianteId) {
            setErrorMessage('Datos de reserva incompletos');
            setShowErrorModal(true);
            return;
        }

        if (!validarFormulario()) {
            setErrorMessage('Por favor corrige los errores en los emails');
            setShowErrorModal(true);
            return;
        }

        setIsBooking(true);
        setValidandoReserva(true);

        try {
            console.log('🎯 Iniciando reserva:', datosReserva);

            // VALIDACIÓN 1: Verificar disponibilidad del rango completo
            const rangoDisponible = await verificarDisponibilidadRango(
                slotSeleccionadoParaReserva.id_slot,
                datosReserva.horaInicio,
                datosReserva.horaFin
            );

            if (!rangoDisponible) {
                setErrorMessage('El horario seleccionado ya no está disponible. Por favor, elige otro horario.');
                setShowErrorModal(true);
                return;
            }

            console.log('✅ Rango disponible verificado');

            // VALIDACIÓN 2: Ubicación presencial (si aplica)
            if (slotSeleccionadoParaReserva.modalidad === 'presencial') {
                const validacion = await validarUbicacionPresencialUsuario(
                    slotSeleccionadoParaReserva.id_mentor,
                    formatDateKey(selectedDate),
                    datosReserva.horaInicio,
                    slotSeleccionadoParaReserva.locacion
                );

                if (!validacion.valido) {
                    setErrorMessage(validacion.mensaje);
                    setShowErrorModal(true);
                    return;
                }

                console.log('✅ Validación de ubicación presencial OK');
            }

            // DIVISIÓN Y RESERVA DEL SLOT
            const reservaCreada = await dividirYReservarSlot(
                slotSeleccionadoParaReserva,
                datosReserva.horaInicio,
                datosReserva.horaFin,
                datosReserva.duracion,
                currentEstudianteId
            );

            console.log('✅ Slot dividido y reservado:', reservaCreada);

            // TODO: INTEGRAR MERCADO PAGO AQUÍ
            const pagoExitoso = true; // ⚠️ CAMBIAR cuando integres MP

            if (!pagoExitoso) {
                setErrorMessage('El pago no pudo ser procesado');
                setShowErrorModal(true);
                return;
            }

            // CREAR SESIÓN
            const fechaHora = `${formatDateKey(selectedDate)}T${datosReserva.horaInicio}`;

            const { data: nuevaSesion, error: errorSesion } = await supabase
                .from('mentor_sesion')
                .insert({
                    id_mentor: slotSeleccionadoParaReserva.id_mentor,
                    id_alumno: currentEstudianteId,
                    id_materia: selectedMentor.materiaId,
                    fecha_hora: fechaHora,
                    duracion_minutos: datosReserva.duracion,
                    estado: 'confirmada',
                    pagado: true,
                    precio: datosReserva.precio,
                    cantidad_alumnos: numPersonas,
                    emails_participantes: emailsParticipantes,
                    descripcion_alumno: descripcionSesion.trim() || null
                })
                .select()
                .single();

            if (errorSesion) {
                console.error('❌ Error creando sesión:', errorSesion);
                throw errorSesion;
            }

            console.log('✅ Sesión creada:', nuevaSesion);

            // NOTIFICACIÓN AL MENTOR
            try {
                const { data: mentorUser } = await supabase
                    .from('mentor')
                    .select('id_usuario')
                    .eq('id_mentor', slotSeleccionadoParaReserva.id_mentor)
                    .single();

                const { data: estudianteData } = await supabase
                    .from('usuario')
                    .select('nombre')
                    .eq('id_usuario', currentEstudianteId)
                    .single();

                if (mentorUser && estudianteData) {
                    await notificationTypes.nuevaClaseAgendada(
                        mentorUser.id_usuario,
                        currentEstudianteId,
                        estudianteData.nombre,
                        nuevaSesion.id_sesion,
                        fechaHora,
                        selectedMentor.materia
                    );
                }
            } catch (notifError) {
                console.error('Error enviando notificación:', notifError);
            }

            // EMAILS DE CONFIRMACIÓN
            console.log('📧 Enviando emails de confirmación...');
            try {
                const { data: mentorData } = await supabase
                    .from('mentor')
                    .select('id_usuario, usuario:id_usuario(nombre, correo)')
                    .eq('id_mentor', slotSeleccionadoParaReserva.id_mentor)
                    .single();

                const { data: alumnoData } = await supabase
                    .from('usuario')
                    .select('nombre, correo')
                    .eq('id_usuario', currentEstudianteId)
                    .single();

                if (mentorData?.usuario && alumnoData) {
                    const fechaFormateada = new Date(fechaHora).toLocaleDateString('es-UY', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });

                    await enviarEmailsConfirmacion({
                        mentorEmail: mentorData.usuario.correo,
                        mentorNombre: mentorData.usuario.nombre,
                        alumnoEmail: alumnoData.correo,
                        alumnoNombre: alumnoData.nombre,
                        materiaNombre: selectedMentor.materia,
                        fecha: fechaFormateada,
                        hora: datosReserva.horaInicio,
                        duracion: datosReserva.duracion,
                        cantidadAlumnos: numPersonas,
                        emailsParticipantes: emailsParticipantes,
                        descripcion: descripcionSesion.trim() || null,
                        modalidad: slotSeleccionadoParaReserva.modalidad
                    });
                }
            } catch (emailError) {
                console.error('⚠️ Error enviando emails (no crítico):', emailError);
            }

            // CERRAR MODALES Y MOSTRAR ÉXITO
            setShowConfirmModal(false);
            setShowSuccessModal(true);
            resetModal();

            // RECARGAR DISPONIBILIDAD
            await loadAvailability();

        } catch (error) {
            console.error('❌ Error en reserva:', error);
            setErrorMessage(error.message || 'Error al procesar la reserva');
            setShowErrorModal(true);
        } finally {
            setIsBooking(false);
            setValidandoReserva(false);
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

            {/* Filtro de materia */}
            <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                border: '2px solid #f1f5f9',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
            }}>
                {/* Izquierda: Título */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FontAwesomeIcon icon={faFilter} style={{ color: '#2563eb', fontSize: 18 }} />
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
      Filtrar por materia
    </span>
                </div>

                {/* Derecha: Selector */}
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
                        <option value="">Todas las materias</option>
                        {materias.map(materia => (
                            <option key={materia.id_materia} value={materia.id_materia}>
                                {materia.nombre_materia}
                            </option>
                        ))}
                    </select>

                    {/* Flecha Font Awesome */}
                    <div style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#64748b'
                    }}>
                        <FontAwesomeIcon icon={faAngleDown} />
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
                         <span style={{ color: '#065f46', fontWeight: 600, fontSize: 14, display:'flex', alignItems:'center', gap:6 }}>
                              <FontAwesomeIcon icon={faBook} />
                              Filtrando por: {selectedMateriaName}
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
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                fontSize: 16
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#1e40af';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#2563eb';
                                e.target.style.transform = 'translateY(0)';
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
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                fontSize: 16
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#1e40af';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#2563eb';
                                e.target.style.transform = 'translateY(0)';
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
                                        cursor: isPast ? 'not-allowed' : 'pointer',
                                        background: isPast ? '#f9fafb' :
                                            selected ? '#2563eb' :
                                                hasAvailability ? '#d1fae5' :
                                                    today ? '#dbeafe' : '#fff',
                                        border: today && !selected ? '2px solid #2563eb' : '2px solid #f1f5f9',
                                        color: selected ? '#fff' : isPast ? '#9ca3af' : '#0f172a',
                                        opacity: isPast ? 0.5 : 1,
                                        transition: 'all 0.2s ease',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none'
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
                                    <span>{date.getDate()}</span>
                                    {hasAvailability && !isPast && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: 4,
                                            fontSize: 10,
                                            background: selected ? 'rgba(255,255,255,0.3)' : '#10b981',
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
                                background: '#d1fae5',
                                borderRadius: 4,
                                border: '2px solid #6ee7b7'
                            }} />
                            <span style={{ color: '#64748b' }}>Disponible</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                background: '#2563eb',
                                borderRadius: 4
                            }} />
                            <span style={{ color: '#64748b' }}>Seleccionado</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 16,
                                height: 16,
                                background: '#dbeafe',
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
                                background: '#f1f5f9',
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
                                <div key={`${mentor.mentorId}-${mentor.materiaId}`} style={{
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
                                                background: '#dbeafe',
                                                color: '#1e40af',
                                                padding: '6px 12px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6
                                            }}>
                                                <FontAwesomeIcon icon={faUsers} style={{ fontSize: 12 }} />
                                                Hasta {Math.max(...mentor.slots.map(s => s.max_alumnos))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* GRID de slots */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: 8
                                    }}>
                                        {mentor.slots.map((slot) => {
                                            const modalidadIcon = slot.modalidad === 'virtual' ? faVideo : faBuilding;
                                            const modalidadText = slot.modalidad === 'virtual' ? '#1e40af' : '#065f46';
                                            const locacionIcon =
                                                slot.modalidad === 'presencial' && slot.locacion
                                                    ? (slot.locacion === 'casa' ? faHome : faUniversity)
                                                    : null;

                                            return (
                                                <div key={slot.slot_materia_id || slot.id_slot} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {/* Hora */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <FontAwesomeIcon icon={faClock} style={{ fontSize: 11 }} />
                                                        {slot.hora_fin
                                                            ? `${slot.hora.slice(0, 5)} - ${slot.hora_fin.slice(0, 5)}`
                                                            : formatTimeRange(slot.hora, slot.duracion)
                                                        }
                                                    </div>

                                                    {/* Modalidad y locación */}
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
                                        color: modalidadText,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}>
                                        <FontAwesomeIcon icon={modalidadIcon} />
                                        {slot.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}

                                        {locacionIcon && (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                color: '#64748b',
                                                fontWeight: 500
                                            }}>
                                                (<FontAwesomeIcon icon={locacionIcon} />
                                                {slot.locacion === 'casa' ? 'Casa del mentor' : 'Facultad'})
                                            </span>
                                        )}
                                    </span>
                                                    </div>

                                                    {/* Botón reservar */}
                                                    <button
                                                        onClick={() => handleBookSlot(mentor, slot)}
                                                        disabled={!slot.disponible}
                                                        style={{
                                                            marginTop: 6,
                                                            padding: '8px 10px',
                                                            borderRadius: 8,
                                                            border: '2px solid #e2e8f0',
                                                            background: slot.disponible ? '#fff' : '#f1f5f9',
                                                            color: '#0f172a',
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            cursor: slot.disponible ? 'pointer' : 'not-allowed',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (slot.disponible) {
                                                                e.currentTarget.style.borderColor = '#2563eb';
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (slot.disponible) {
                                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                            }
                                                        }}
                                                    >
                                                        {slot.disponible ? 'Agendar' : 'No disponible'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 🆕 Modales FUERA del grid - al mismo nivel que el grid calendario/mentores */}


            {showConfirmModal && selectedMentor && slotSeleccionadoParaReserva && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        maxWidth: '550px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '2px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            background: '#fff',
                            zIndex: 10
                        }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'Inter, -apple-system, sans-serif',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <FontAwesomeIcon icon={faCalendar} style={{ color: '#2563eb' }} />
                                Agendar Mentoría
                            </h3>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    resetModal();
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    color: '#64748b',
                                    fontSize: '18px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.target.style.color = '#0f172a'}
                                onMouseLeave={e => e.target.style.color = '#64748b'}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Contenido */}
                        <div style={{ padding: '20px 24px' }}>

                            {/* Info del mentor y materia */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '20px',
                                padding: '14px',
                                background: '#f8fafc',
                                borderRadius: '10px',
                                border: '2px solid #e2e8f0'
                            }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    flexShrink: 0
                                }}>
                                    {selectedMentor.mentorName?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        marginBottom: '2px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {selectedMentor.mentorName}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#64748b',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        marginBottom: '2px'
                                    }}>
                                        <FontAwesomeIcon icon={faBook} style={{ fontSize: '10px' }} />
                                        {selectedMentor.materia}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#64748b',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        <FontAwesomeIcon icon={faCalendar} style={{ fontSize: '10px' }} />
                                        {selectedDate.toLocaleDateString('es-UY', {
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </div>
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '14px',
                                        background: slotSeleccionadoParaReserva.modalidad === 'virtual'
                                            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                                            : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                        border: slotSeleccionadoParaReserva.modalidad === 'virtual'
                                            ? '2px solid #93c5fd'
                                            : '2px solid #6ee7b7',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <FontAwesomeIcon
                                            icon={slotSeleccionadoParaReserva.modalidad === 'virtual' ? faVideo : faBuilding}
                                            style={{
                                                fontSize: '20px',
                                                color: slotSeleccionadoParaReserva.modalidad === 'virtual' ? '#1e40af' : '#065f46'
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontSize: '15px',
                                                fontWeight: 700,
                                                color: slotSeleccionadoParaReserva.modalidad === 'virtual' ? '#1e40af' : '#065f46',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                Modalidad: {slotSeleccionadoParaReserva.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                                            </div>
                                            {slotSeleccionadoParaReserva.modalidad === 'presencial' && slotSeleccionadoParaReserva.locacion && (
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#065f46',
                                                    fontWeight: 500,
                                                    marginTop: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <FontAwesomeIcon
                                                        icon={slotSeleccionadoParaReserva.locacion === 'casa' ? faHome : faUniversity}
                                                        style={{ fontSize: '11px' }}
                                                    />
                                                    {slotSeleccionadoParaReserva.locacion === 'casa' ? 'Casa del mentor' : 'Facultad'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SlotSelector - Compacto */}
                            <SlotSelector
                                slot={slotSeleccionadoParaReserva}
                                onSelectionChange={(datos) => {
                                    // Guardar los datos seleccionados
                                    window.slotDataSeleccionada = datos;
                                }}
                                disabled={isBooking}
                            />

                            {/* Cantidad de personas */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    marginBottom: '10px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    <FontAwesomeIcon icon={faUsers} style={{ color: '#2563eb', fontSize: '13px' }} />
                                    ¿Cuántas personas asistirán?
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {Array.from({ length: slotSeleccionadoParaReserva.max_alumnos || 3 }, (_, i) => i + 1).map(num => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumPersonasChange(num)}
                                            disabled={isBooking}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                background: numPersonas === num ? '#2563eb' : '#fff',
                                                color: numPersonas === num ? '#fff' : '#0f172a',
                                                border: numPersonas === num ? 'none' : '2px solid #e2e8f0',
                                                borderRadius: '10px',
                                                fontWeight: 700,
                                                fontSize: '15px',
                                                cursor: isBooking ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontFamily: 'Inter, -apple-system, sans-serif'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isBooking && numPersonas !== num) {
                                                    e.target.style.borderColor = '#2563eb';
                                                    e.target.style.transform = 'translateY(-1px)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isBooking && numPersonas !== num) {
                                                    e.target.style.borderColor = '#e2e8f0';
                                                    e.target.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Emails participantes (si más de 1 persona) */}
                            {numPersonas > 1 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        marginBottom: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        fontFamily: 'Inter, -apple-system, sans-serif'
                                    }}>
                                        <FontAwesomeIcon icon={faEnvelope} style={{ color: '#2563eb', fontSize: '13px' }} />
                                        Emails de participantes adicionales
                                    </label>
                                    {Array.from({ length: numPersonas - 1 }).map((_, index) => (
                                        <input
                                            key={index}
                                            type="email"
                                            placeholder={`Email participante ${index + 2}`}
                                            value={emailsParticipantes[index] || ''}
                                            onChange={(e) => {
                                                const newEmails = [...emailsParticipantes];
                                                newEmails[index] = e.target.value;
                                                setEmailsParticipantes(newEmails);
                                            }}
                                            disabled={isBooking}
                                            style={{
                                                width: '100%',
                                                padding: '11px',
                                                borderRadius: '10px',
                                                border: '2px solid #e2e8f0',
                                                fontSize: '13px',
                                                fontFamily: 'Inter, -apple-system, sans-serif',
                                                marginBottom: '8px',
                                                outline: 'none',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    ))}
                                    <p style={{
                                        margin: '6px 0 0 0',
                                        fontSize: '11px',
                                        color: '#64748b',
                                        fontFamily: 'Inter, -apple-system, sans-serif'
                                    }}>
                                        Recomendamos utilizar emails institucionales @correo.um.edu.uy
                                    </p>
                                </div>
                            )}

                            {/* Descripción opcional */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    marginBottom: '10px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    <FontAwesomeIcon icon={faFileAlt} style={{ color: '#2563eb', fontSize: '13px' }} />
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    placeholder="Ej: Quiero repasar derivadas y límites para el parcial..."
                                    value={descripcionSesion}
                                    onChange={(e) => setDescripcionSesion(e.target.value)}
                                    disabled={isBooking}
                                    style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '11px',
                                        borderRadius: '10px',
                                        border: '2px solid #e2e8f0',
                                        fontSize: '13px',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        resize: 'vertical',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                                <p style={{
                                    margin: '6px 0 0 0',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontFamily: 'Inter, -apple-system, sans-serif'
                                }}>
                                    Ayuda al mentor a prepararse mejor para la sesión
                                </p>
                            </div>

                            {/* Botones de acción */}
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                paddingTop: '14px',
                                borderTop: '2px solid #e2e8f0'
                            }}>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        resetModal();
                                    }}
                                    disabled={isBooking}
                                    style={{
                                        flex: 1,
                                        padding: '13px',
                                        background: '#fff',
                                        color: '#64748b',
                                        border: '2px solid #e2e8f0',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: isBooking ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isBooking) {
                                            e.target.style.borderColor = '#cbd5e1';
                                            e.target.style.color = '#0f172a';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isBooking) {
                                            e.target.style.borderColor = '#e2e8f0';
                                            e.target.style.color = '#64748b';
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ fontSize: '12px' }} />
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        // Combinar datos del slot con los del formulario
                                        const datosCompletos = {
                                            ...window.slotDataSeleccionada,
                                            numPersonas,
                                            emailsParticipantes,
                                            descripcionSesion
                                        };
                                        handleBooking(datosCompletos);
                                    }}
                                    disabled={isBooking || validandoReserva}
                                    style={{
                                        flex: 2,
                                        padding: '13px',
                                        background: isBooking || validandoReserva
                                            ? '#cbd5e1'
                                            : 'linear-gradient(135deg, #2563eb )',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: isBooking || validandoReserva ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, -apple-system, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        boxShadow: isBooking || validandoReserva
                                            ? 'none'
                                            : '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isBooking && !validandoReserva) {
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isBooking && !validandoReserva) {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={isBooking ? faSpinner : faCheckCircle} spin={isBooking} style={{ fontSize: '12px' }} />
                                    {isBooking ? 'Procesando...' : 'Confirmar y pagar →'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Éxito */}
            {showSuccessModal && (
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
                    zIndex: 10000,
                    padding: 20,
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        padding: 40,
                        maxWidth: 420,
                        width: '100%',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                        border: '3px solid #10b981',
                        textAlign: 'center',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: '#d1fae5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            animation: 'scaleIn 0.4s ease'
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
                            onClick={() => setShowSuccessModal(false)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={e => {
                                e.target.style.background = '#059669';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.target.style.background = '#10b981';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Error */}
            {showErrorModal && (
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
                    zIndex: 10000,
                    padding: 20,
                    animation: 'fadeIn 0.2s ease'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        padding: 40,
                        maxWidth: 420,
                        width: '100%',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                        border: '3px solid #ef4444',
                        textAlign: 'center',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: '#fee2e2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            animation: 'shake 0.5s ease'
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
                                padding: '16px',
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={e => {
                                e.target.style.background = '#dc2626';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={e => {
                                e.target.style.background = '#ef4444';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes scaleIn {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
            `}</style>
        </div>
    );
}