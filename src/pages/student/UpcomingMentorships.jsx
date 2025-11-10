import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { notificationTypes } from '../../api/notificationTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faClock, faUser, faBook, faVideo, faBuilding,
    faEnvelope, faFileAlt, faDollarSign, faHome, faUniversity,
    faUsers, faTimes, faExclamationTriangle, faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';

export function UpcomingMentorships() {
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('proximas');
    const [sesiones, setSesiones] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedSesion, setSelectedSesion] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        await Promise.all([getUserData(), loadSesiones()]);
        setLoading(false);
    };

    const getUserData = async () => {
        const { data: userId } = await supabase.rpc('obtener_usuario_actual_id');
        setCurrentUserId(userId);
    };

    const loadSesiones = async () => {
        const { data: userId } = await supabase.rpc('obtener_usuario_actual_id');
        if (!userId) return;

        const now = new Date().toISOString();

        let query = supabase
            .from('mentor_sesion')
            .select(`
        *,
        mentor:id_mentor(
          id_mentor,
          id_usuario,
          direccion,
          lugar_presencial,
          usuario:id_usuario(nombre, foto)
        ),
        materia:id_materia(nombre_materia)
      `)
            .eq('id_alumno', userId)
            .order('fecha_hora', { ascending: activeTab === 'proximas' });

        if (activeTab === 'proximas') {
            // Solo sesiones confirmadas a futuro
            query = query.eq('estado', 'confirmada').gte('fecha_hora', now);
        } else {
            // Pasadas: completadas o canceladas
            query = query.in('estado', ['completada', 'cancelada']);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error loading sesiones:', error);
            return;
        }

        const sesionesConModalidad = await Promise.all(
            data.map(async (sesion) => {
                const fecha = sesion.fecha_hora.split('T')[0];
                const hora = sesion.fecha_hora.split('T')[1].substring(0, 5);
                const horaHHmm =
                    hora?.slice(0, 5) ||
                    new Date(sesion.fecha_hora).toTimeString().slice(0, 5);

                const { data: slot, error: slotError } = await supabase
                    .from('slots_disponibles')
                    .select('modalidad, locacion')
                    .eq('id_mentor', sesion.id_mentor)
                    .eq('fecha', fecha)
                    .eq('hora', horaHHmm)
                    .eq('duracion', sesion.duracion_minutos)
                    .maybeSingle();

                if (slotError) console.warn('slots_disponibles vacio o error suave:', slotError);

                return {
                    ...sesion,
                    modalidad: slot?.modalidad || 'virtual',
                    locacion: slot?.locacion || null
                };
            })
        );

        setSesiones(sesionesConModalidad);
    };

    const handleCancelClick = (sesion) => {
        setSelectedSesion(sesion);
        setShowCancelModal(true);
    };

    // 👉 Helper solo para el modal (no bloquea el botón)
    const hoursUntilSession = (fechaHora) => {
        const sesionDate = new Date(fechaHora);
        const now = new Date();
        return (sesionDate - now) / (1000 * 60 * 60);
    };

    const confirmCancel = async () => {
        if (!selectedSesion || !currentUserId) return;

        setIsCancelling(true);
        try {
            // 1) Cancelar la sesión
            const { error: cancelError } = await supabase
                .from('mentor_sesion')
                .update({
                    estado: 'cancelada',
                    cancelada_por: 'alumno'
                })
                .eq('id_sesion', selectedSesion.id_sesion);

            if (cancelError) {
                console.error('Error al cancelar sesión:', cancelError);
                alert('Error al cancelar la sesión. Intenta nuevamente.');
                setIsCancelling(false);
                return;
            }

            // 2) Liberar el slot correspondiente
            const fecha = selectedSesion.fecha_hora.split('T')[0];
            const hora = selectedSesion.fecha_hora.split('T')[1].substring(0, 5);

            const { error: slotError } = await supabase
                .from('slots_disponibles')
                .update({ disponible: true })
                .eq('id_mentor', selectedSesion.id_mentor)
                .eq('fecha', fecha)
                .eq('hora', hora)
                .eq('duracion', selectedSesion.duracion_minutos);

            if (slotError) {
                console.error('Error al liberar slot:', slotError);
            }

            // 3) Notificar al mentor (opcional, ya estaba)
            try {
                const { data: estudianteData } = await supabase
                    .from('usuario')
                    .select('nombre')
                    .eq('id_usuario', currentUserId)
                    .single();

                if (estudianteData && selectedSesion.mentor) {
                    await notificationTypes.sesionCancelada(
                        selectedSesion.mentor.id_usuario,
                        currentUserId,
                        estudianteData.nombre,
                        selectedSesion.id_sesion,
                        selectedSesion.fecha_hora,
                        selectedSesion.materia.nombre_materia
                    );
                }
            } catch (notifError) {
                console.error('Error enviando notificación:', notifError);
            }

            await loadSesiones();
            setShowCancelModal(false);
            setSelectedSesion(null);
        } catch (error) {
            console.error('Error:', error);
            alert('Error inesperado al cancelar la sesión.');
        } finally {
            setIsCancelling(false);
        }
    };

    const formatDate = (fechaHora) => {
        const date = new Date(fechaHora);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (fechaHora, duracion) => {
        const date = new Date(fechaHora);
        const startHour = date.getHours();
        const startMin = date.getMinutes();
        const endDate = new Date(date.getTime() + duracion * 60000);
        const endHour = endDate.getHours();
        const endMin = endDate.getMinutes();
        return `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    };

    const getDaysUntil = (fechaHora) => {
        const sesionDate = new Date(fechaHora);
        const now = new Date();
        sesionDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diffTime = sesionDate - now;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays === -1) return 'Ayer';
        return `En ${diffDays} días`;
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '60vh', fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 500, color: '#64748b'
            }}>
                <FontAwesomeIcon icon={faClock} spin style={{ marginRight: 12, color: '#2563eb' }} />
                Cargando sesiones...
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 'min(1200px, 92vw)',
            margin: '0 auto',
            padding: 'clamp(16px, 3vw, 24px)',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'clamp(28px, 5vw, 42px)',
                    fontWeight: 800,
                    color: '#0f172a',
                    letterSpacing: '-0.02em'
                }}>
                    <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 12, color: '#2563eb' }} />
                    Mis Mentorías
                </h1>
                <p style={{ color: '#64748b', margin: 0, fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 500 }}>
                    Gestiona tus sesiones agendadas
                </p>
            </div>

            <div style={{
                display: 'flex', gap: 12, marginBottom: 24,
                borderBottom: '2px solid #f1f5f9', paddingBottom: 12
            }}>
                <button
                    onClick={() => setActiveTab('proximas')}
                    style={{
                        background: activeTab === 'proximas' ? '#2563eb' : 'transparent',
                        color: activeTab === 'proximas' ? '#fff' : '#64748b',
                        border: 'none', padding: '12px 24px', borderRadius: 10,
                        fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease',
                        fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={e => { if (activeTab !== 'proximas') e.target.style.background = '#f1f5f9'; }}
                    onMouseLeave={e => { if (activeTab !== 'proximas') e.target.style.background = 'transparent'; }}
                >
                    <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 6, fontSize: 13 }} />
                    Próximas
                </button>
                <button
                    onClick={() => setActiveTab('pasadas')}
                    style={{
                        background: activeTab === 'pasadas' ? '#2563eb' : 'transparent',
                        color: activeTab === 'pasadas' ? '#fff' : '#64748b',
                        border: 'none', padding: '12px 24px', borderRadius: 10,
                        fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease',
                        fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={e => { if (activeTab !== 'pasadas') e.target.style.background = '#f1f5f9'; }}
                    onMouseLeave={e => { if (activeTab !== 'pasadas') e.target.style.background = 'transparent'; }}
                >
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: 6, fontSize: 13 }} />
                    Pasadas
                </button>
            </div>

            {sesiones.length === 0 ? (
                <div style={{
                    background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', border: '2px solid #f1f5f9'
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                    }}>
                        <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: 36, color: '#94a3b8' }} />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                        No hay sesiones {activeTab === 'proximas' ? 'próximas' : 'pasadas'}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                        {activeTab === 'proximas'
                            ? 'Agenda tu primera mentoría desde el calendario global'
                            : 'Aquí aparecerán tus sesiones completadas'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {sesiones.map(sesion => (
                        <div key={sesion.id_sesion} style={{
                            background: '#fff', borderRadius: 16, padding: 24, border: '2px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s ease'
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #f1f5f9'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                                            <FontAwesomeIcon icon={faBook} style={{ marginRight: 8, color: '#2563eb', fontSize: 18 }} />
                                            {sesion.materia.nombre_materia}
                                        </h3>
                                    </div>
                                    <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                                        <FontAwesomeIcon icon={faUser} style={{ marginRight: 6, fontSize: 12 }} />
                                        Mentor: {sesion.mentor.usuario.nombre}
                                    </p>
                                </div>

                                {activeTab === 'proximas' && sesion.estado === 'confirmada' && (
                                    <div style={{
                                        background: '#dbeafe', color: '#1e40af',
                                        padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700
                                    }}>
                                        {getDaysUntil(sesion.fecha_hora)}
                                    </div>
                                )}

                                {sesion.estado === 'cancelada' && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                        color: '#dc2626', padding: '8px 16px', borderRadius: 8,
                                        fontSize: 13, fontWeight: 700, border: '2px solid #fca5a5',
                                        display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 12 }} />
                                        Cancelada por {sesion.cancelada_por === 'mentor' ? 'el mentor' : 'ti'}
                                    </div>
                                )}
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
                                gap: 20, marginBottom: 20
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <FontAwesomeIcon icon={faClock} style={{ color: '#64748b', fontSize: 14 }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Fecha y hora</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                        {formatDate(sesion.fecha_hora)} • {formatTime(sesion.fecha_hora, sesion.duracion_minutos)}
                                    </p>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <FontAwesomeIcon
                                            icon={sesion.modalidad === 'virtual' ? faVideo : faBuilding}
                                            style={{ color: '#64748b', fontSize: 14 }}
                                        />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Modalidad</span>
                                    </div>
                                    <p style={{
                                        margin: 0, fontSize: 15, fontWeight: 700,
                                        color: sesion.modalidad === 'virtual' ? '#1e40af' : '#065f46'
                                    }}>
                                        <FontAwesomeIcon
                                            icon={sesion.modalidad === 'virtual' ? faVideo : faBuilding}
                                            style={{ marginRight: 6, fontSize: 13 }}
                                        />
                                        {sesion.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                                        {sesion.modalidad === 'presencial' && sesion.locacion && (
                                            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 6 }}>
                        ({sesion.locacion === 'casa' ? (
                                                <>
                                                    <FontAwesomeIcon icon={faHome} style={{ marginRight: 4 }} />
                                                    Casa del mentor
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faUniversity} style={{ marginRight: 4 }} />
                                                    Facultad
                                                </>
                                            )})
                      </span>
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <FontAwesomeIcon icon={faUsers} style={{ color: '#64748b', fontSize: 14 }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Participantes</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                        {sesion.cantidad_alumnos} {sesion.cantidad_alumnos === 1 ? 'persona' : 'personas'}
                                    </p>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <FontAwesomeIcon icon={faDollarSign} style={{ color: '#64748b', fontSize: 14 }} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Precio pagado</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                                        ${sesion.precio} UYU
                                    </p>
                                </div>
                            </div>

                            {sesion.modalidad === 'virtual' && sesion.emails_participantes?.length > 0 && (
                                <div style={{ background: '#dbeafe', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <FontAwesomeIcon icon={faEnvelope} style={{ color: '#1e40af', fontSize: 14 }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Emails de participantes</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {sesion.emails_participantes.map((email, idx) => (
                                            <div key={idx} style={{ fontSize: 13, fontWeight: 500, color: '#1e40af' }}>
                                                • {email}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sesion.modalidad === 'presencial' && sesion.locacion === 'casa' && sesion.pagado && sesion.mentor.direccion && (
                                <div style={{ background: '#d1fae5', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#065f46', fontSize: 14 }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>Dirección</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#065f46' }}>
                                        <FontAwesomeIcon icon={faHome} style={{ marginRight: 6 }} />
                                        {sesion.mentor.direccion}
                                    </p>
                                </div>
                            )}

                            {sesion.descripcion_alumno && (
                                <div style={{
                                    background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: '3px solid #2563eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <FontAwesomeIcon icon={faFileAlt} style={{ color: '#2563eb', fontSize: 14 }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Descripción</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#475569', lineHeight: 1.6 }}>
                                        {sesion.descripcion_alumno}
                                    </p>
                                </div>
                            )}

                            {/* 👇 AHORA SIEMPRE MOSTRAMOS EL BOTÓN (si está confirmada y es próxima) */}
                            {activeTab === 'proximas' && sesion.estado === 'confirmada' && (
                                <button
                                    onClick={() => handleCancelClick(sesion)}
                                    style={{
                                        width: '100%', padding: '12px', background: '#fff', color: '#ef4444',
                                        border: '2px solid #ef4444', borderRadius: 10, fontWeight: 700, fontSize: 14,
                                        cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.background = '#ef4444';
                                        e.target.style.color = '#fff';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.background = '#fff';
                                        e.target.style.color = '#ef4444';
                                        e.target.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
                                    Cancelar sesión
                                </button>
                            )}

                            {/* 🔥 Quitado el “No se puede cancelar (menos de 12h)” */}
                        </div>
                    ))}
                </div>
            )}

            {showCancelModal && selectedSesion && (() => {
                const hours = hoursUntilSession(selectedSesion.fecha_hora);
                const fullRefund = hours > 12;
                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10000, padding: 20, fontFamily: 'Inter, sans-serif'
                    }}>
                        <div style={{
                            background: '#fff', borderRadius: 20, padding: 40, maxWidth: 500, width: '100%',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)', border: '3px solid #ef4444'
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: '50%', background: '#fee2e2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                            }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 48, color: '#dc2626' }} />
                            </div>

                            <h3 style={{
                                margin: '0 0 16px 0', fontSize: 26, fontWeight: 800, color: '#0f172a', textAlign: 'center'
                            }}>
                                ¿Cancelar sesión?
                            </h3>

                            {/* ⚖️ Bloque de reembolso según la política */}
                            <div style={{
                                background: fullRefund ? '#d1fae5' : '#fee2e2',
                                border: `2px solid ${fullRefund ? '#34d399' : '#fca5a5'}`,
                                borderRadius: 12, padding: 20, marginBottom: 24
                            }}>
                                <p style={{
                                    margin: '0 0 12px 0', fontSize: 15, fontWeight: 700,
                                    color: fullRefund ? '#065f46' : '#dc2626', textAlign: 'center'
                                }}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 6 }} />
                                    {fullRefund ? 'Reembolso completo' : 'No habrá reembolso'}
                                </p>
                                <p style={{
                                    margin: 0, fontSize: 14, fontWeight: 500,
                                    color: fullRefund ? '#065f46' : '#991b1b',
                                    textAlign: 'center', lineHeight: 1.6
                                }}>
                                    {fullRefund
                                        ? `Se te devolverá el 100% (${selectedSesion.precio} UYU) del pago realizado.`
                                        : 'Al cancelar a menos de 12 horas, no recibirás reembolso.'}
                                </p>
                            </div>

                            {/* Resumen de la sesión */}
                            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                                <p style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                                    Sesión a cancelar:
                                </p>
                                <p style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                    {selectedSesion.materia.nombre_materia}
                                </p>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#64748b' }}>
                                    {formatDate(selectedSesion.fecha_hora)} • {formatTime(selectedSesion.fecha_hora, selectedSesion.duracion_minutos)}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    onClick={() => { setShowCancelModal(false); setSelectedSesion(null); }}
                                    disabled={isCancelling}
                                    style={{
                                        flex: 1, padding: '14px', background: '#f8fafc', color: '#0f172a',
                                        border: '2px solid #e2e8f0', borderRadius: 12, fontWeight: 600, fontSize: 15,
                                        cursor: isCancelling ? 'not-allowed' : 'pointer', opacity: isCancelling ? 0.5 : 1,
                                        transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isCancelling) {
                                            e.target.style.background = '#f1f5f9';
                                            e.target.style.transform = 'translateY(-1px)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isCancelling) {
                                            e.target.style.background = '#f8fafc';
                                            e.target.style.transform = 'translateY(0)';
                                        }
                                    }}
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    disabled={isCancelling}
                                    style={{
                                        flex: 1, padding: '14px', background: '#ef4444', color: '#fff',
                                        border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15,
                                        cursor: isCancelling ? 'not-allowed' : 'pointer', opacity: isCancelling ? 0.7 : 1,
                                        transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={e => {
                                        if (!isCancelling) {
                                            e.target.style.background = '#dc2626';
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isCancelling) {
                                            e.target.style.background = '#ef4444';
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = 'none';
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
                                    {isCancelling ? 'Cancelando...' : 'Sí, cancelar sesión'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}