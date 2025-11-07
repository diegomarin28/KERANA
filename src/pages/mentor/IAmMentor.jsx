import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useMentorPayment } from '../../hooks/useMentorPayment';
import { MentorWelcomeModal } from '../../components/MentorWelcomeModal';
import { useMentorStatus } from '../../hooks/useMentorStatus';
import { SuccessModal } from '../../components/SuccessModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBook,
    faCalendar,
    faClock,
    faUsers,
    faFileAlt,
    faEnvelope,
    faComment,
    faBuilding,
    faPlus,
    faEdit,
    faTrash,
    faTimes,
    faCheck,
    faCheckCircle,
    faExclamationCircle,
    faCog,
    faCreditCard,
    faFileContract,
    faChevronDown,
    faVideo,
    faGraduationCap,
    faHome,
    faUniversity,
    faUser,
    faDollarSign,
    faCalendarAlt,
    faCalendarCheck
} from '@fortawesome/free-solid-svg-icons';

const LOCALIDADES = {
    montevideo: [
        'Pocitos', 'Buceo', 'Carrasco', 'Punta Gorda', 'Prado', 'Tres Cruces',
        'Parque Batlle', 'Centro', 'Cordón', 'Parque Rodó', 'Malvín',
        'Punta Carretas', 'Ciudad Vieja', 'Palermo', 'Brazo Oriental',
        'La Blanqueada', 'Villa Dolores', 'Unión', 'Maroñas', 'Sayago',
        'Bella Vista', 'Jacinto Vera', 'Aguada', 'Reducto', 'Capurro',
        'La Teja', 'Villa Muñoz', 'Paso Molino', 'Belvedere', 'Atahualpa',
        'Peñarol', 'La Comercial'
    ],
    canelones: [
        'Ciudad de la Costa', 'Pando', 'Las Piedras', 'La Paz', 'Progreso',
        'Canelones', 'Santa Lucía', 'Atlántida', 'Parque del Plata',
        'Solymar', 'Lagomar', 'El Pinar', 'Shangrilá', 'Salinas'
    ]
};

export default function IAmMentor() {
    const [activeTab, setActiveTab] = useState('materias');
    const [mentorships, setMentorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [proximasSesiones, setProximasSesiones] = useState([]);
    const [loadingSesiones, setLoadingSesiones] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [errorModal, setErrorModal] = useState({ open: false, message: '' });

    const { isMentor, mentorData: mentorStatusData, loading: mentorLoading } = useMentorStatus();
    const { paymentData, hasPaymentConfigured, savePaymentData } = useMentorPayment();

    const mentorData = mentorStatusData?.[0] || null;
    const [confirmRemoveMentorship, setConfirmRemoveMentorship] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const [configForm, setConfigForm] = useState({
        maxAlumnos: null,
        localidad: '',
        aceptaZoom: false,
        aceptaPresencial: false,
        lugarPresencial: null,
        direccion: ''
    });

    const [pagoForm, setPagoForm] = useState({
        mpEmail: '',
        mpCvu: '',
        mpAlias: ''
    });

    const [saving, setSaving] = useState(false);
    const [successModal, setSuccessModal] = useState({ open: false, message: '' });
    const [confirmCancelSession, setConfirmCancelSession] = useState(null);
    const [isCanceling, setIsCanceling] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);

    useEffect(() => {
        if (mentorData) {
            fetchMentorDetails();
        }
    }, [mentorData]);

    useEffect(() => {
        if (paymentData) {
            setPagoForm({
                mpEmail: paymentData.mpEmail || '',
                mpCvu: paymentData.mpCvu || '',
                mpAlias: paymentData.mpAlias || ''
            });
        }
    }, [paymentData]);

    const fetchMentorDetails = async () => {
        if (!mentorData?.id_mentor) return;

        try {
            setLoading(true);

            const { data: fullMentor, error: fullMentorError } = await supabase
                .from('mentor')
                .select('*')
                .eq('id_mentor', mentorData.id_mentor)
                .single();

            if (fullMentorError) {
                console.error('Error cargando datos completos del mentor:', fullMentorError);
                setLoading(false);
                return;
            }

            if (fullMentor) {
                setConfigForm({
                    maxAlumnos: fullMentor.max_alumnos,
                    localidad: fullMentor.localidad || '',
                    aceptaVirtual: fullMentor.acepta_virtual || false,
                    aceptaPresencial: fullMentor.acepta_presencial || false,
                    lugarPresencial: fullMentor.lugar_presencial,
                    direccion: fullMentor.direccion || ''
                });

                if (!fullMentor.onboarding_bienvenida_vista) {
                    setShowWelcome(true);
                }
            }

            setMentorships(mentorData.mentor_materia || []);

        } catch (err) {
            console.error('Error cargando detalles del mentor:', err);
            setError('Error al cargar tus datos de mentor');
        } finally {
            setLoading(false);
        }
    };

    const fetchProximasSesiones = async () => {
        if (!mentorData?.id_mentor) return;

        try {
            setLoadingSesiones(true);

            const ahora = new Date();

            const { data: sesiones, error: sesionesError } = await supabase
                .from('mentor_sesion')
                .select(`
        id_sesion,
        id_mentor,
        id_alumno,
        id_materia,
        fecha_hora,
        duracion_minutos,
        estado,
        precio,
        pagado,
        notas_alumno,
        notas_mentor,
        cantidad_alumnos,
        emails_participantes,
        descripcion_alumno
      `)
                .eq('id_mentor', mentorData.id_mentor)
                .eq('estado', 'confirmada')
                .gte('fecha_hora', ahora.toISOString())
                .order('fecha_hora', { ascending: true });

            if (sesionesError) throw sesionesError;

            if (!sesiones || sesiones.length === 0) {
                setProximasSesiones([]);
                return;
            }

            const alumnoIds = [...new Set(sesiones.map(s => s.id_alumno).filter(Boolean))];
            const { data: alumnos } = await supabase
                .from('usuario')
                .select('id_usuario, nombre, foto')
                .in('id_usuario', alumnoIds);

            const materiaIds = [...new Set(sesiones.map(s => s.id_materia).filter(Boolean))];
            const { data: materias } = await supabase
                .from('materia')
                .select('id_materia, nombre_materia')
                .in('id_materia', materiaIds);

            const { data: slots } = await supabase
                .from('slots_disponibles')
                .select('id_slot, fecha, hora, max_alumnos, modalidad, locacion, duracion')
                .eq('id_mentor', mentorData.id_mentor);

            const reservasPorFechaHora = {};
            sesiones.forEach(sesion => {
                const fechaHora = new Date(sesion.fecha_hora);
                const fecha = fechaHora.toISOString().split('T')[0];
                const hora = fechaHora.toTimeString().slice(0, 5);
                const key = `${fecha}-${hora}`;
                reservasPorFechaHora[key] = (reservasPorFechaHora[key] || 0) + 1;
            });

            const sesionesCompletas = sesiones.map(sesion => {
                const fechaHora = new Date(sesion.fecha_hora);
                const fecha = fechaHora.toISOString().split('T')[0];
                const hora = fechaHora.toTimeString().slice(0, 5);

                const slot = slots?.find(s => s.fecha === fecha && s.hora.slice(0, 5) === hora);
                const key = `${fecha}-${hora}`;
                const maxAlumnos = slot?.max_alumnos || 1;

                const reservasActuales = maxAlumnos === 1 ? 1 : (reservasPorFechaHora[key] || 1);
                const alumnoEncontrado = alumnos?.find(a => a.id_usuario === sesion.id_alumno);

                return {
                    ...sesion,
                    alumno: alumnoEncontrado,
                    materia: materias?.find(m => m.id_materia === sesion.id_materia),
                    slot_info: {
                        max_alumnos: maxAlumnos,
                        reservas_actuales: reservasActuales,
                        modalidad: slot?.modalidad || 'virtual',
                        locacion: slot?.locacion,
                        duracion: slot?.duracion || 60
                    },
                    modalidad: slot?.modalidad || 'virtual',
                    locacion: slot?.locacion
                };
            });

            const ahora2 = new Date();
            const aCompletar = [];
            const futuras = [];

            for (const s of sesionesCompletas) {
                const inicio = new Date(s.fecha_hora);
                const durMin = s.slot_info?.duracion || s.duracion_minutos || 60;
                const fin = new Date(inicio.getTime() + durMin * 60 * 1000);

                if (s.estado === 'confirmada' && fin <= ahora2) {
                    aCompletar.push(s.id_sesion);
                } else {
                    futuras.push(s);
                }
            }

            if (aCompletar.length > 0) {
                try {
                    await supabase
                        .from('mentor_sesion')
                        .update({ estado: 'completada' })
                        .in('id_sesion', aCompletar);
                } catch (e) {
                    console.error('No se pudo autocompletar sesiones:', e);
                }
            }

            setProximasSesiones(futuras);
        } catch (err) {
            console.error('Error cargando sesiones:', err);
        } finally {
            setLoadingSesiones(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'proximas' && mentorData?.id_mentor) {
            fetchProximasSesiones();
        }
    }, [activeTab, mentorData]);

    const handleRemoveMentorship = async (mentorshipId, materiaName) => {
        try {
            setIsRemoving(true);

            // 1. Verificar si tiene mentorías programadas en esta materia
            const { data: sesionesActivas, error: sesionesError } = await supabase
                .from('mentor_sesion')
                .select('id_sesion')
                .eq('id_mentor', mentorData.id_mentor)
                .eq('id_materia', confirmRemoveMentorship.materiaId)
                .eq('estado', 'confirmada')
                .gte('fecha_hora', new Date().toISOString());

            if (sesionesError) throw sesionesError;

            if (sesionesActivas && sesionesActivas.length > 0) {
                setErrorModal({
                    open: true,
                    message: `No podés darte de baja de ${materiaName} porque tenés ${sesionesActivas.length} mentoría(s) programada(s). Cancelá las sesiones primero.`
                });
                setConfirmRemoveMentorship(null);
                setIsRemoving(false);
                return;
            }

            // 2. Eliminar la relación mentor_materia
            const { error: deleteError } = await supabase
                .from('mentor_materia')
                .delete()
                .eq('id', mentorshipId);

            if (deleteError) throw deleteError;

            // 3. Verificar si le quedan más materias
            const { data: materiasRestantes, error: materiasError } = await supabase
                .from('mentor_materia')
                .select('id')
                .eq('id_mentor', mentorData.id_mentor);

            if (materiasError) throw materiasError;

            // 4. Si no le quedan materias, eliminar de la tabla mentor
            if (!materiasRestantes || materiasRestantes.length === 0) {
                const { error: mentorDeleteError } = await supabase
                    .from('mentor')
                    .delete()
                    .eq('id_mentor', mentorData.id_mentor);

                if (mentorDeleteError) throw mentorDeleteError;

                // Redirigir a home o página de mentores
                setSuccessModal({
                    open: true,
                    message: 'Te diste de baja exitosamente. Ya no sos mentor.'
                });

                // Esperar 2 segundos y redirigir
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                // Solo actualizar la lista de materias
                setMentorships(prev => prev.filter(m => m.id !== mentorshipId));
                setSuccessModal({ open: true, message: 'Te diste de baja exitosamente' });
            }

            setConfirmRemoveMentorship(null);

        } catch (err) {
            console.error('Error eliminando mentoría:', err);
            setErrorModal({ open: true, message: 'Error al darte de baja de la materia' });
        } finally {
            setIsRemoving(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from('mentor')
                .update({
                    max_alumnos: configForm.maxAlumnos,
                    localidad: configForm.localidad,
                    acepta_virtual: configForm.aceptaVirtual,
                    acepta_presencial: configForm.aceptaPresencial,
                    lugar_presencial: configForm.lugarPresencial,
                    direccion: configForm.direccion
                })
                .eq('id_mentor', mentorData.id_mentor);

            if (error) throw error;

            setSuccessModal({ open: true, message: 'Configuración guardada exitosamente' });

        } catch (err) {
            console.error('Error guardando config:', err);
            setErrorModal({ open: true, message: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    const handleSavePago = async () => {

        // Validaciones
        if (!pagoForm.mpEmail.trim()) {
            setErrorModal({
                open: true,
                message: 'Ingresá tu email de Mercado Pago'
            });
            return;
        }

        if (!pagoForm.mpCvu || pagoForm.mpCvu.length !== 13) {
            setErrorModal({
                open: true,
                message: 'El número de cuenta debe tener exactamente 13 dígitos'
            });
            return;
        }

        if (!pagoForm.mpAlias.trim()) {
            setErrorModal({
                open: true,
                message: 'Ingresá tu alias de Mercado Pago'
            });
            return;
        }

        try {
            setSaving(true);

            const result = await savePaymentData({
                mpEmail: pagoForm.mpEmail,
                mpCvu: pagoForm.mpCvu,
                mpAlias: pagoForm.mpAlias
            });

            if (result.success) {
                setSuccessModal({
                    open: true,
                    message: '¡Configuración de pago guardada! Ya podés recibir solicitudes de mentorías.'
                });
            } else {
                setErrorModal({
                    open: true,
                    message: result.error || 'Error al guardar la configuración'
                });
            }

        } catch (err) {
            console.error('Error guardando pago:', err);
            setErrorModal({
                open: true,
                message: 'Error al guardar configuración de pago. Intentá nuevamente.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCloseWelcome = async () => {
        setShowWelcome(false);

        if (mentorData) {
            try {
                const { error } = await supabase
                    .from('mentor')
                    .update({ onboarding_bienvenida_vista: true })
                    .eq('id_mentor', mentorData.id_mentor);

                if (error) {
                    console.error('Error marcando bienvenida como vista:', error);
                }
            } catch (err) {
                console.error('Error en handleCloseWelcome:', err);
            }
        }
    };

    const isFormValid = () => {
        return pagoForm.mpEmail.trim() &&
            pagoForm.mpCvu &&
            pagoForm.mpCvu.length === 13 &&
            pagoForm.mpAlias.trim();
    };

    if (mentorLoading || loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isMentor || !mentorData) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <Card style={{ padding: 40, textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>
                            <FontAwesomeIcon icon={faBook} style={{ color: '#0d9488' }} />
                        </div>
                        <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Inter, sans-serif' }}>No sos mentor aún</h3>
                        <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                            Postulate para ser mentor de alguna materia
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header estilo Kerana */}
                <header style={{
                    marginBottom: 20,
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: 16,
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#0d9488',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: 18, color: '#fff' }} />
                        </div>
                        <h1 style={{
                            margin: 0,
                            fontSize: 26,
                            fontWeight: 700,
                            color: '#0d9488',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            Panel de Mentor
                        </h1>
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#64748b',
                        paddingLeft: 56,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        Administrá tus mentorías y configuración
                    </p>
                </header>

                {!hasPaymentConfigured && (
                    <div style={warningBannerStyle}>
                        <span style={{ fontSize: 20, color: '#f59e0b' }}>
                            <FontAwesomeIcon icon={faExclamationCircle} />
                        </span>
                        <div style={{ fontFamily: 'Inter, sans-serif' }}>
                            <strong>Configurá tu método de pago</strong>
                            <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                                No podés recibir solicitudes hasta que configures cómo recibir pagos
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveTab('pago')}
                            style={warningButtonStyle}
                        >
                            Configurar ahora
                        </button>
                    </div>
                )}

                {error && (
                    <Card style={errorCardStyle}>
                        {error}
                    </Card>
                )}

                {cancelSuccess && (
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
                        fontSize: 14,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        <span style={{ fontSize: 20, color: '#10b981' }}>
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </span>
                        Sesión cancelada exitosamente
                    </div>
                )}

                <div style={tabsContainerStyle}>
                    <button
                        onClick={() => setActiveTab('materias')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'materias' ? '#0d9488' : 'transparent',
                            color: activeTab === 'materias' ? 'white' : '#6B7280'
                        }}
                    >
                        <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: 8 }} />
                        Materias
                    </button>
                    <button
                        onClick={() => setActiveTab('proximas')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'proximas' ? '#0d9488' : 'transparent',
                            color: activeTab === 'proximas' ? 'white' : '#6B7280'
                        }}
                    >
                        <FontAwesomeIcon icon={faCalendarCheck} style={{ marginRight: 8 }} />
                        Próximas Mentorías
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'config' ? '#0d9488' : 'transparent',
                            color: activeTab === 'config' ? 'white' : '#6B7280'
                        }}
                    >
                        <FontAwesomeIcon icon={faCog} style={{ marginRight: 8 }} />
                        Configuración
                    </button>
                    <button
                        onClick={() => setActiveTab('pago')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'pago' ? '#0d9488' : 'transparent',
                            color: activeTab === 'pago' ? 'white' : '#6B7280'
                        }}
                    >
                        <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: 8 }} />
                        Método de Pago
                        {!hasPaymentConfigured && <span style={badgeStyle}>!</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('terminos')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'terminos' ? '#0d9488' : 'transparent',
                            color: activeTab === 'terminos' ? 'white' : '#6B7280'
                        }}
                    >
                        <FontAwesomeIcon icon={faFileContract} style={{ marginRight: 8 }} />
                        Términos
                    </button>
                </div>

                <div style={{ marginTop: 24 }}>
                    {activeTab === 'materias' && (
                        <div>
                            {/* Título mejorado con botón */}
                            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{
                                        margin: '0 0 6px 0',
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: '#0d9488',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Mis Materias
                                    </h2>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: '#64748b',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        Materias en las que sos mentor actualmente
                                    </p>
                                </div>

                                <button
                                    onClick={() => window.location.href = '/mentores/postular'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '10px 18px',
                                        background: '#0d9488',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 10,
                                        fontWeight: 700,
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif',
                                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.2)',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#14b8a6';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#0d9488';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 8px rgba(13, 148, 136, 0.2)';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} />
                                    Agregar Materia
                                </button>
                            </div>

                            {mentorships.length === 0 ? (
                                <Card style={{ padding: 40, textAlign: 'center', marginTop: 20 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16, color: '#0d9488' }}>
                                        <FontAwesomeIcon icon={faBook} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px 0', fontFamily: 'Inter, sans-serif' }}>No tenés materias asignadas</h3>
                                    <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                                        Contactá a soporte para agregar materias
                                    </p>
                                </Card>
                            ) : (
                                <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                                    {mentorships.map(mentorship => (
                                        <Card key={mentorship.id} style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                                    <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 600 }}>
                                                        {mentorship.materia.nombre_materia}
                                                    </h3>
                                                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                                                        Semestre: {mentorship.materia.semestre}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMentorship(
                                                        mentorship.id,
                                                        mentorship.materia.nombre_materia
                                                    )}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '8px 16px',
                                                        background: '#fff',
                                                        color: '#ef4444',
                                                        border: '2px solid #ef4444',
                                                        borderRadius: 8,
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        fontFamily: 'Inter, sans-serif'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#ef4444';
                                                        e.target.style.color = '#fff';
                                                        e.target.style.transform = 'translateY(-1px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#fff';
                                                        e.target.style.color = '#ef4444';
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: 12 }} />
                                                    Darme de baja
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'proximas' && (
                        <div>
                            <h2 style={sectionTitleStyle}>Próximas Mentorías</h2>
                            <p style={sectionSubtitleStyle}>Sesiones confirmadas y pendientes</p>

                            {loadingSesiones ? (
                                <div style={centerStyle}>
                                    <div style={spinnerStyle}></div>
                                </div>
                            ) : proximasSesiones.length === 0 ? (
                                <Card style={{ padding: 40, textAlign: 'center', marginTop: 20 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16, color: '#0d9488' }}>
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px 0' }}>No tenés mentorías programadas</h3>
                                    <p style={{ color: '#6b7280', margin: 0 }}>
                                        Cuando los alumnos agenden clases, aparecerán aquí
                                    </p>
                                </Card>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                                    {proximasSesiones.map((sesion) => {
                                        const fecha = new Date(sesion.fecha_hora);
                                        const inicio = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
                                        const fechaLocal = fecha.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' });

                                        return (
                                            <div
                                                key={sesion.id_sesion}
                                                style={{
                                                    background: '#fff',
                                                    borderRadius: 16,
                                                    padding: 24,
                                                    border: '2px solid #f1f5f9',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.borderColor = '#0d9488';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,148,136,0.15)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = '#f1f5f9';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                {/* Header */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    borderBottom: '2px solid #f1f5f9',
                                                    paddingBottom: 12,
                                                    marginBottom: 16
                                                }}>
                                                    <div>
                                                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                                            <FontAwesomeIcon icon={faBook} style={{ marginRight: 8, color: '#0d9488' }} />
                                                            {sesion.materia?.nombre_materia || 'Materia sin nombre'}
                                                        </h3>
                                                        <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>
                                                            <FontAwesomeIcon icon={faUser} style={{ marginRight: 6, fontSize: 12 }} />
                                                            Alumno: {sesion.alumno?.nombre || 'Sin nombre'}
                                                        </p>
                                                    </div>
                                                    <div style={{
                                                        background: '#ccfbf1',
                                                        color: '#0d9488',
                                                        padding: '8px 16px',
                                                        borderRadius: 8,
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                    }}>
                                                        {fechaLocal} • {inicio}
                                                    </div>
                                                </div>

                                                {/* Grid info */}
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
                                                    gap: 16,
                                                    marginBottom: 16
                                                }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                            <FontAwesomeIcon icon={faClock} style={{ color: '#64748b', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Duración</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                                            {sesion.duracion_minutos || 60} minutos
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                            <FontAwesomeIcon
                                                                icon={sesion.modalidad === 'virtual' ? faVideo : faBuilding}
                                                                style={{ color: '#64748b', fontSize: 14 }}
                                                            />
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Modalidad</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0d9488' }}>
                                                            {sesion.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                                                            {sesion.locacion && (
                                                                <span style={{ fontWeight: 500, marginLeft: 6, fontSize: 13, color: '#64748b' }}>
                                                ({sesion.locacion === 'casa' ? 'Casa del mentor' : 'Facultad'})
                                            </span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                            <FontAwesomeIcon icon={faUsers} style={{ color: '#64748b', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Participantes</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                                            {sesion.slot_info?.reservas_actuales || 1} alumno(s)
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                            <FontAwesomeIcon icon={faDollarSign} style={{ color: '#64748b', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Pago</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                                                            ${sesion.precio || 400} UYU
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Notas del alumno */}
                                                {sesion.notas_alumno && (
                                                    <div style={{
                                                        background: '#f8fafc',
                                                        borderRadius: 12,
                                                        padding: 16,
                                                        marginBottom: 16,
                                                        borderLeft: '3px solid #0d9488'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                            <FontAwesomeIcon icon={faComment} style={{ color: '#0d9488', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notas del alumno</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#475569', lineHeight: 1.6 }}>
                                                            {sesion.notas_alumno}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Emails de participantes */}
                                                {sesion.emails_participantes && sesion.emails_participantes.length > 0 && (
                                                    <div style={{
                                                        background: '#f8fafc',
                                                        borderRadius: 12,
                                                        padding: 16,
                                                        marginBottom: 16,
                                                        border: '2px solid #f8fafc'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            marginBottom: 8
                                                        }}>
                                                            <FontAwesomeIcon icon={faEnvelope} style={{ color: '#0d9488', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0d9488' }}>
                                            Emails de participantes
                                        </span>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            {sesion.emails_participantes.map((email, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    style={{
                                                                        fontSize: 13,
                                                                        fontWeight: 500,
                                                                        color: '#0f172a',
                                                                        padding: '6px 10px',
                                                                        background: '#fff',
                                                                        borderRadius: 8,
                                                                        border: '1px solid #0d9488'
                                                                    }}
                                                                >
                                                                    • {email}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Descripción del alumno */}
                                                {sesion.descripcion_alumno && (
                                                    <div style={{
                                                        background: '#f8fafc',
                                                        borderRadius: 12,
                                                        padding: 16,
                                                        marginBottom: 16,
                                                        borderLeft: '3px solid #0d9488'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                            <FontAwesomeIcon icon={faFileAlt} style={{ color: '#0d9488', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                            Descripción del alumno
                                        </span>
                                                        </div>
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: '#475569',
                                                            lineHeight: 1.6
                                                        }}>
                                                            {sesion.descripcion_alumno}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Botón cancelar (único) */}
                                                <button
                                                    onClick={() => {
                                                        const fechaSesion = new Date(sesion.fecha_hora);
                                                        const ahora = new Date();
                                                        const horasRestantes = (fechaSesion - ahora) / (1000 * 60 * 60);

                                                        setConfirmCancelSession({
                                                            id: sesion.id_sesion,
                                                            esMasDe36Horas: horasRestantes > 36,
                                                            fecha: fechaSesion,
                                                            materia: sesion.materia?.nombre_materia,
                                                        });
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        background: '#fff',
                                                        color: '#ef4444',
                                                        border: '2px solid #ef4444',
                                                        borderRadius: 10,
                                                        fontWeight: 700,
                                                        fontSize: 14,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        fontFamily: 'Inter, sans-serif'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.background = '#ef4444';
                                                        e.target.style.color = '#fff';
                                                        e.target.style.transform = 'translateY(-1px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.background = '#fff';
                                                        e.target.style.color = '#ef4444';
                                                        e.target.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} style={{ marginRight: 8 }} />
                                                    Cancelar mentoría
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div>
                            {/* Título mejorado */}
                            <div style={{ marginBottom: 20 }}>
                                <h2 style={{
                                    margin: '0 0 6px 0',
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: '#0d9488',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    Configuración de Mentorías
                                </h2>
                                <p style={{
                                    margin: 0,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#64748b',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    Configurá cómo querés dar tus clases
                                </p>
                            </div>

                            <Card style={{ padding: 24, marginTop: 20 }}>
                                <div style={formStyle}>
                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Cantidad máxima de alumnos por clase</label>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            {[1, 2, 3].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => setConfigForm({ ...configForm, maxAlumnos: num })}
                                                    style={{
                                                        ...optionButtonStyle,
                                                        background: configForm.maxAlumnos === num ? '#0d9488' : 'white',
                                                        color: configForm.maxAlumnos === num ? 'white' : '#374151'
                                                    }}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Localidad</label>
                                        <select
                                            value={configForm.localidad}
                                            onChange={(e) => setConfigForm({ ...configForm, localidad: e.target.value })}
                                            style={inputStyle}
                                        >
                                            <option value="">-- Seleccioná --</option>
                                            <optgroup label="Montevideo">
                                                {LOCALIDADES.montevideo.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Canelones">
                                                {LOCALIDADES.canelones.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Tipo de clases</label>
                                        <label style={checkboxLabelStyle}>
                                            <input
                                                type="checkbox"
                                                checked={configForm.aceptaVirtual}
                                                onChange={(e) => setConfigForm({ ...configForm, aceptaVirtual: e.target.checked })}
                                            />
                                            Virtual - $430 UYU
                                        </label>
                                        <label style={checkboxLabelStyle}>
                                            <input
                                                type="checkbox"
                                                checked={configForm.aceptaPresencial}
                                                onChange={(e) => setConfigForm({ ...configForm, aceptaPresencial: e.target.checked })}
                                            />
                                            Presencial - $630 UYU
                                        </label>
                                    </div>

                                    {configForm.aceptaPresencial && (
                                        <>
                                            <div style={fieldStyle}>
                                                <label style={labelStyle}>¿Dónde das clases presenciales?</label>
                                                {['casa_mentor', 'facultad', 'ambas'].map(lugar => (
                                                    <label key={lugar} style={radioLabelStyle}>
                                                        <input
                                                            type="radio"
                                                            name="lugarPresencial"
                                                            value={lugar}
                                                            checked={configForm.lugarPresencial === lugar}
                                                            onChange={(e) => setConfigForm({ ...configForm, lugarPresencial: e.target.value })}
                                                        />
                                                        {lugar === 'casa_mentor' ? 'En mi casa' : lugar === 'facultad' ? 'En la facultad' : 'Ambas opciones'}
                                                    </label>
                                                ))}
                                            </div>

                                            {(configForm.lugarPresencial === 'casa_mentor' || configForm.lugarPresencial === 'ambas') && (
                                                <div style={fieldStyle}>
                                                    <label style={labelStyle}>Tu dirección (privada)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ej: Bulevar Artigas 1234, apto 302"
                                                        value={configForm.direccion}
                                                        onChange={(e) => setConfigForm({ ...configForm, direccion: e.target.value })}
                                                        style={inputStyle}
                                                    />
                                                    <small style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                                                        Solo se comparte cuando el usuario paga y elige clase en tu casa
                                                    </small>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <button onClick={handleSaveConfig} disabled={saving} style={saveButtonStyle}>
                                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'pago' && (
                        <div>
                            {/* Título */}
                            <div style={{ marginBottom: 24 }}>
                                <h2 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: 28,
                                    fontWeight: 800,
                                    color: '#13346b',
                                    fontFamily: 'Inter, sans-serif',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12
                                }}>
                                    <FontAwesomeIcon icon={faCreditCard} style={{ color: '#2563eb' }} />
                                    Configuración de Cobros
                                </h2>
                                <p style={{
                                    margin: 0,
                                    fontSize: 15,
                                    fontWeight: 500,
                                    color: '#64748b',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    Configurá cómo querés recibir tus pagos por las mentorías
                                </p>
                            </div>

                            {/* Banner de éxito si ya está configurado */}
                            {hasPaymentConfigured && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: 20,
                                    background: '#d1fae5',
                                    border: '2px solid #10b981',
                                    borderRadius: 12,
                                    marginBottom: 24
                                }}>
                                    <FontAwesomeIcon
                                        icon={faCheckCircle}
                                        style={{ fontSize: 24, color: '#10b981' }}
                                    />
                                    <div style={{ fontFamily: 'Inter, sans-serif' }}>
                                        <strong style={{ fontSize: 15, color: '#065f46' }}>
                                            Método de pago configurado correctamente
                                        </strong>
                                        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#047857' }}>
                                            Ya podés recibir solicitudes de mentorías
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Card style={{ padding: 32, marginTop: 20 }}>
                                <div style={formStyle}>
                                    {/* Información sobre pagos */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                        border: '2px solid #bfdbfe',
                                        borderRadius: 16,
                                        padding: 24
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            marginBottom: 16
                                        }}>
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                background: '#2563eb',
                                                borderRadius: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FontAwesomeIcon
                                                    icon={faDollarSign}
                                                    style={{ fontSize: 20, color: '#fff' }}
                                                />
                                            </div>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: 18,
                                                fontWeight: 700,
                                                color: '#1e40af',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                ¿Cómo funcionan los pagos?
                                            </h3>
                                        </div>
                                        <ul style={{
                                            margin: 0,
                                            paddingLeft: 24,
                                            fontSize: 14,
                                            lineHeight: 2,
                                            color: '#1e40af',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500
                                        }}>
                                            <li>Los alumnos pagan a través de Mercado Pago</li>
                                            <li>Retenemos el pago hasta 24 horas después de la mentoría</li>
                                            <li>Si todo sale bien, te transferimos a tu cuenta de Mercado Pago</li>
                                            <li>Mercado Pago cobra aproximadamente 6% de comisión</li>
                                            <li>Tus datos bancarios nunca se comparten con los alumnos</li>
                                        </ul>
                                    </div>

                                    {/* Separador */}
                                    <div style={{
                                        height: 1,
                                        background: 'linear-gradient(to right, transparent, #e5e7eb, transparent)',
                                        margin: '8px 0'
                                    }}></div>

                                    {/* Título de sección */}
                                    <div>
                                        <h4 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Datos de tu cuenta de Mercado Pago
                                        </h4>
                                        <p style={{
                                            margin: 0,
                                            fontSize: 13,
                                            color: '#64748b',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500
                                        }}>
                                            Necesitamos estos datos para transferirte los pagos
                                        </p>
                                    </div>

                                    {/* Email de Mercado Pago */}
                                    <div style={fieldStyle}>
                                        <label style={{
                                            ...labelStyle,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <FontAwesomeIcon
                                                icon={faEnvelope}
                                                style={{ fontSize: 14, color: '#2563eb' }}
                                            />
                                            Email de Mercado Pago *
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="tu@email.com"
                                            value={pagoForm.mpEmail}
                                            onChange={(e) => setPagoForm({ ...pagoForm, mpEmail: e.target.value })}
                                            style={{
                                                ...inputStyle,
                                                borderColor: pagoForm.mpEmail ? '#10b981' : '#d1d5db'
                                            }}
                                        />
                                        <small style={{
                                            fontSize: 13,
                                            color: '#64748b',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500
                                        }}>
                                            El email con el que te registraste en Mercado Pago
                                        </small>
                                    </div>

                                    {/* CVU */}
                                    <div style={fieldStyle}>
                                        <label style={{
                                            ...labelStyle,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <FontAwesomeIcon
                                                icon={faCreditCard}
                                                style={{ fontSize: 14, color: '#2563eb' }}
                                            />
                                             Número de cuenta *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="1031001458901"
                                            value={pagoForm.mpCvu || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                                                setPagoForm({ ...pagoForm, mpCvu: value });
                                            }}
                                            maxLength={13}
                                            style={{
                                                ...inputStyle,
                                                borderColor: pagoForm.mpCvu?.length === 13 ? '#10b981' : '#d1d5db',
                                                fontFamily: 'monospace',
                                                fontSize: 15
                                            }}
                                        />
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <small style={{
                                                fontSize: 13,
                                                color: '#64748b',
                                                fontFamily: 'Inter, sans-serif',
                                                fontWeight: 500
                                            }}>
                                                13 dígitos - Lo encontrás en tu app de Mercado Pago
                                            </small>
                                            {pagoForm.mpCvu && (
                                                <small style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: pagoForm.mpCvu.length === 13 ? '#10b981' : '#f59e0b',
                                                    fontFamily: 'Inter, sans-serif'
                                                }}>
                                                    {pagoForm.mpCvu.length}/13
                                                </small>
                                            )}
                                        </div>
                                    </div>

                                    {/* Alias */}
                                    <div style={fieldStyle}>
                                        <label style={{
                                            ...labelStyle,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <FontAwesomeIcon
                                                icon={faUser}
                                                style={{ fontSize: 14, color: '#2563eb' }}
                                            />
                                            Nombre completo de Mercado Pago *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="tucuenta.alias.mp"
                                            value={pagoForm.mpAlias || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.slice(0, 100);
                                                setPagoForm({ ...pagoForm, mpAlias: value });
                                            }}
                                            maxLength={100}
                                            style={{
                                                ...inputStyle,
                                                borderColor: pagoForm.mpAlias ? '#10b981' : '#d1d5db'
                                            }}
                                        />
                                        <small style={{
                                            fontSize: 13,
                                            color: '#64748b',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500
                                        }}>
                                            Tu nombre completo
                                        </small>
                                    </div>

                                    {/* Banner de ayuda */}
                                    <div style={{
                                        padding: 16,
                                        background: '#fef3c7',
                                        border: '2px solid #fbbf24',
                                        borderRadius: 12,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 12
                                        }}>
                                            <FontAwesomeIcon
                                                icon={faExclamationCircle}
                                                style={{ fontSize: 18, color: '#f59e0b', marginTop: 2 }}
                                            />
                                            <div>
                                                <p style={{
                                                    margin: '0 0 8px 0',
                                                    fontSize: 14,
                                                    color: '#92400e',
                                                    fontWeight: 600
                                                }}>
                                                    <strong>¿Dónde encuentro mi número de cuenta?</strong>
                                                </p>
                                                <ol style={{
                                                    margin: 0,
                                                    paddingLeft: 20,
                                                    fontSize: 13,
                                                    color: '#92400e',
                                                    lineHeight: 1.8,
                                                    fontWeight: 500
                                                }}>
                                                    <li>Abrí la app de Mercado Pago</li>
                                                    <li>Andá a "Tu dinero" y luego "Ingresar"</li>
                                                    <li>Ahí encontrás tu número de cuenta (13 dígitos) y tu Nombre completo</li>
                                                </ol>
                                                <p style={{
                                                    margin: '12px 0 0 0',
                                                    fontSize: 13,
                                                    color: '#92400e',
                                                    fontWeight: 500
                                                }}>
                                                    Si no tenés cuenta de Mercado Pago, creá una en{' '}
                                                    <a
                                                        href="https://www.mercadopago.com.uy"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#2563eb',
                                                            fontWeight: 700,
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        mercadopago.com.uy
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón guardar */}
                                    <button
                                        onClick={handleSavePago}
                                        disabled={saving || !isFormValid()}
                                        style={{
                                            padding: '14px 32px',
                                            background: !isFormValid()
                                                ? '#cbd5e1'  // Gris permanente cuando está deshabilitado
                                                : '#2563eb',  // Azul cuando está habilitado
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 12,
                                            fontWeight: 700,
                                            fontSize: 15,
                                            cursor: !isFormValid() ? 'not-allowed' : 'pointer',
                                            transition: 'background 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
                                            alignSelf: 'flex-start',
                                            fontFamily: 'Inter, sans-serif',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            opacity: 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isFormValid() && !saving) {
                                                e.currentTarget.style.background = '#1e40af';  // Azul oscuro al hover
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.3)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (isFormValid() && !saving) {
                                                e.currentTarget.style.background = '#2563eb';  // Vuelve a azul normal
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon icon={saving ? faClock : faCheck} />
                                        {saving ? 'Guardando...' : 'Guardar Configuración de Pago'}
                                    </button>

                                    {/* Texto requerido */}
                                    <small style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        fontFamily: 'Inter, sans-serif',
                                        fontWeight: 500,
                                        fontStyle: 'italic'
                                    }}>
                                        * Todos los campos son obligatorios
                                    </small>
                                </div>
                            </Card>
                            {/* Modal de Error */}
                            {errorModal.open && (
                                <div style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000,
                                    backdropFilter: 'blur(4px)'
                                }} onClick={() => setErrorModal({ open: false, message: '' })}>
                                    <div style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        padding: 32,
                                        maxWidth: 500,
                                        width: '90%',
                                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                                    }} onClick={(e) => e.stopPropagation()}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            marginBottom: 20
                                        }}>
                                            <div style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 12,
                                                background: '#fee2e2',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FontAwesomeIcon icon={faExclamationCircle} style={{ fontSize: 24, color: '#ef4444' }} />
                                            </div>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                fontFamily: 'Inter, sans-serif'
                                            }}>
                                                Error
                                            </h3>
                                        </div>
                                        <p style={{
                                            margin: '0 0 24px 0',
                                            fontSize: 15,
                                            color: '#64748b',
                                            fontFamily: 'Inter, sans-serif',
                                            lineHeight: 1.6
                                        }}>
                                            {errorModal.message}
                                        </p>
                                        <button
                                            onClick={() => setErrorModal({ open: false, message: '' })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 24px',
                                                background: '#ef4444',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 10,
                                                fontSize: 15,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontFamily: 'Inter, sans-serif'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#dc2626';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#ef4444';
                                            }}
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'terminos' && (
                        <div>
                            {/* Título mejorado */}
                            <div style={{ marginBottom: 20 }}>
                                <h2 style={{
                                    margin: '0 0 6px 0',
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: '#0d9488',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    Términos y Condiciones
                                </h2>
                                <p style={{
                                    margin: 0,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#64748b',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    Condiciones para ser mentor en Kerana
                                </p>
                            </div>

                            <Card style={{ padding: 24, marginTop: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'Inter, sans-serif' }}>
                                    <div style={infoBoxStyle}>
                                        <h3 style={subtitleTermsStyle}>💰 Precios y Pagos</h3>
                                        <ul style={listTermsStyle}>
                                            <li><strong>Clases virtuales (Zoom):</strong> $430 UYU por sesión</li>
                                            <li><strong>Clases presenciales:</strong> $630 UYU por sesión</li>
                                            <li>Retenemos el pago 24 horas después de la clase</li>
                                            <li>Si no hay inconvenientes, transferimos a tu cuenta</li>
                                        </ul>
                                    </div>

                                    <div style={infoBoxStyle}>
                                        <h3 style={subtitleTermsStyle}>
                                            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 8, color: '#0d9488' }} />
                                            Política de Cancelaciones
                                        </h3>
                                        <ul style={listTermsStyle}>
                                            <li><strong>Cancelación del estudiante:</strong>
                                                <ul style={{ marginTop: 8 }}>
                                                    <li><span style={{ color: '#10b981' }}>✓</span> Más de 12 horas antes: Reembolso completo</li>
                                                    <li><span style={{ color: '#f59e0b' }}>!</span> Menos de 12 horas: Se te acredita 25%</li>
                                                </ul>
                                            </li>
                                            <li><strong>Cancelación tuya:</strong>
                                                <ul style={{ marginTop: 8 }}>
                                                    <li><span style={{ color: '#10b981' }}>✓</span> Más de 36 horas antes: Sin penalización</li>
                                                    <li><span style={{ color: '#ef4444' }}>✕</span> Menos de 36 horas: 1 strike</li>
                                                    <li>⛔ 3 strikes = Baneo de 1 año</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </div>

                                    <div style={infoBoxStyle}>
                                        <h3 style={subtitleTermsStyle}>⚡ Responsabilidades</h3>
                                        <ul style={listTermsStyle}>
                                            <li>Responder solicitudes en tiempo y forma</li>
                                            <li>Cumplir con los horarios acordados</li>
                                            <li>Mantener respeto y profesionalismo</li>
                                            <li>Reportar inconvenientes a: <strong>kerana.soporte@gmail.com</strong></li>
                                        </ul>
                                    </div>

                                    <div style={{ padding: 16, background: '#EFF6FF', border: '2px solid #BFDBFE', borderRadius: 12, textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: 14, color: '#1E40AF', fontFamily: 'Inter, sans-serif' }}>
                                            📧 ¿Dudas o consultas? Escribinos a <strong>kerana.soporte@gmail.com</strong>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            <MentorWelcomeModal open={showWelcome} onClose={handleCloseWelcome} />
            <SuccessModal
                open={successModal.open}
                onClose={() => setSuccessModal({ open: false, message: '' })}
                message={successModal.message}
            />
            <SuccessModal
                open={errorModal.open}
                onClose={() => setErrorModal({ open: false, message: '' })}
                message={errorModal.message}
                isError={true}
            />

            {confirmCancelSession && (
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
                    animation: 'fadeIn 0.2s ease-out',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <style>
                        {`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes slideUp {
                                from {
                                    opacity: 0;
                                    transform: translateY(20px);
                                }
                                to {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                            }
                        `}
                    </style>
                    <div style={{
                        background: confirmCancelSession.esMasDe36Horas
                            ? 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)'
                            : 'linear-gradient(135deg, #fff 0%, #fee2e2 100%)',
                        padding: 28,
                        borderRadius: 16,
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: 450,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        border: confirmCancelSession.esMasDe36Horas
                            ? '3px solid #fecaca'
                            : '3px solid #dc2626',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: confirmCancelSession.esMasDe36Horas
                                ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                                : 'linear-gradient(135deg, #fecaca 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}>
                            <span style={{ fontSize: 32, color: '#dc2626' }}>
                                <FontAwesomeIcon icon={confirmCancelSession.esMasDe36Horas ? faExclamationCircle : faTimes} />
                            </span>
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#DC2626',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {confirmCancelSession.esMasDe36Horas
                                ? '¿Estás seguro de cancelar esta clase?'
                                : 'Estás incumpliendo la política de cancelación'}
                        </h3>
                        <p style={{
                            color: '#991b1b',
                            marginBottom: 24,
                            fontSize: 14,
                            lineHeight: 1.6,
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {confirmCancelSession.esMasDe36Horas
                                ? 'Esta acción cancelará la sesión confirmada. El alumno recibirá una notificación y un reembolso completo.'
                                : 'Lo estás haciendo con menos de 36 horas de anticipación. Esta acción te generará 1 strike. Si acumulás 3 serás baneado por 1 año.'}
                        </p>

                        {!confirmCancelSession.esMasDe36Horas && (
                            <div style={{
                                background: '#fef2f2',
                                border: '2px solid #dc2626',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 24,
                                textAlign: 'left'
                            }}>
                                <p style={{
                                    margin: '0 0 12px 0',
                                    fontSize: 13,
                                    color: '#7f1d1d',
                                    fontWeight: 600,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    <strong>Recordá:</strong>
                                </p>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 20,
                                    fontSize: 13,
                                    color: '#991b1b',
                                    lineHeight: 1.6,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    <li>Podés cancelar sin penalización hasta 36hs antes</li>
                                    <li>3 strikes = Baneo de 1 año como mentor</li>
                                    <li>El alumno recibirá un reembolso completo</li>
                                </ul>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setConfirmCancelSession(null)}
                                disabled={isCanceling}
                                style={{
                                    flex: 1,
                                    background: '#f8fafc',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: 10,
                                    padding: '12px 20px',
                                    cursor: isCanceling ? 'not-allowed' : 'pointer',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: '#0f172a',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif',
                                    opacity: isCanceling ? 0.5 : 1
                                }}
                                onMouseEnter={e => {
                                    if (!isCanceling) {
                                        e.target.style.background = '#f1f5f9';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isCanceling) {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {confirmCancelSession.esMasDe36Horas ? 'No, mantener clase' : 'No cancelar'}
                            </button>
                            <button
                                onClick={async () => {
                                    setIsCanceling(true);
                                    try {
                                        console.log('Cancelar sesión:', confirmCancelSession);
                                        await new Promise(resolve => setTimeout(resolve, 1000));

                                        setProximasSesiones(prev =>
                                            prev.filter(s => s.id_sesion !== confirmCancelSession.id)
                                        );

                                        setCancelSuccess(true);
                                        setTimeout(() => setCancelSuccess(false), 3000);

                                    } catch (error) {
                                        console.error('Error cancelando sesión:', error);
                                        setErrorModal({ open: true, message: 'Error al cancelar la sesión' });
                                    } finally {
                                        setIsCanceling(false);
                                        setConfirmCancelSession(null);
                                    }
                                }}
                                disabled={isCanceling}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '12px 20px',
                                    cursor: isCanceling ? 'not-allowed' : 'pointer',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    opacity: isCanceling ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif',
                                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                                }}
                                onMouseEnter={e => {
                                    if (!isCanceling) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isCanceling) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                                    }
                                }}
                            >
                                {isCanceling ? 'Cancelando...' : (confirmCancelSession.esMasDe36Horas ? 'Sí, cancelar' : 'Entiendo, cancelar igual')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSessionModal && selectedSession && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20,
                    fontFamily: 'Inter, sans-serif'
                }} onClick={() => setShowSessionModal(false)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 600,
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '24px 24px 20px',
                            borderBottom: '2px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <h2 style={{
                                margin: 0,
                                fontSize: 22,
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                Detalle de Mentoría
                            </h2>
                            <button
                                onClick={() => setShowSessionModal(false)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    fontSize: 16
                                }}
                                onMouseEnter={e => {
                                    e.target.style.background = '#e2e8f0';
                                    e.target.style.color = '#0f172a';
                                }}
                                onMouseLeave={e => {
                                    e.target.style.background = '#f1f5f9';
                                    e.target.style.color = '#64748b';
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div style={{ padding: 24 }}>
                            <p style={{ fontFamily: 'Inter, sans-serif' }}>Modal de sesión detallada aquí...</p>
                        </div>
                        {/* Modal de confirmación para dar de baja */}
                        {confirmRemoveMentorship && (
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
                                animation: 'fadeIn 0.2s ease-out',
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                <div style={{
                                    background: 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)',
                                    padding: 28,
                                    borderRadius: 16,
                                    textAlign: 'center',
                                    width: '100%',
                                    maxWidth: 450,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    border: '3px solid #fecaca',
                                    animation: 'slideUp 0.3s ease-out'
                                }}>
                                    <div style={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}>
                <span style={{ fontSize: 32, color: '#ef4444' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} />
                </span>
                                    </div>
                                    <h3 style={{
                                        margin: '0 0 12px 0',
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: '#ef4444',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        ¿Estás seguro?
                                    </h3>
                                    <p style={{
                                        color: '#991b1b',
                                        marginBottom: 24,
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        fontWeight: 500,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        ¿Querés dejar de ser mentor de <strong>{confirmRemoveMentorship.materia}</strong>?
                                        <br />
                                        Esta acción no se puede deshacer.
                                    </p>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={() => setConfirmRemoveMentorship({
                                                id: mentorship.id,
                                                materia: mentorship.materia.nombre_materia,
                                                materiaId: mentorship.materia.id_materia
                                            })}
                                            disabled={isRemoving}
                                            style={{
                                                flex: 1,
                                                background: '#f8fafc',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: 10,
                                                padding: '12px 20px',
                                                cursor: isRemoving ? 'not-allowed' : 'pointer',
                                                fontWeight: 600,
                                                fontSize: 14,
                                                color: '#0f172a',
                                                transition: 'all 0.2s ease',
                                                fontFamily: 'Inter, sans-serif',
                                                opacity: isRemoving ? 0.5 : 1
                                            }}
                                            onMouseEnter={e => {
                                                if (!isRemoving) {
                                                    e.target.style.background = '#f1f5f9';
                                                    e.target.style.transform = 'translateY(-1px)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isRemoving) {
                                                    e.target.style.background = '#f8fafc';
                                                    e.target.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => handleRemoveMentorship(
                                                confirmRemoveMentorship.id,
                                                confirmRemoveMentorship.materia
                                            )}
                                            disabled={isRemoving}
                                            style={{
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 10,
                                                padding: '12px 20px',
                                                cursor: isRemoving ? 'not-allowed' : 'pointer',
                                                fontWeight: 700,
                                                fontSize: 14,
                                                opacity: isRemoving ? 0.7 : 1,
                                                transition: 'all 0.2s ease',
                                                fontFamily: 'Inter, sans-serif',
                                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isRemoving) {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isRemoving) {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                                }
                                            }}
                                        >
                                            {isRemoving ? 'Eliminando...' : 'Sí, darme de baja'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const pageStyle = {
    minHeight: '100vh',
    background: '#F9FAFB',
    paddingBottom: 40,
    fontFamily: 'Inter, sans-serif'
};

const containerStyle = {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '24px 16px'
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh'
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #0d9488',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

const warningBannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: '#FEF3C7',
    border: '2px solid #F59E0B',
    borderRadius: 12,
    marginBottom: 24
};

const warningButtonStyle = {
    padding: '8px 16px',
    background: '#F59E0B',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'Inter, sans-serif'
};

const successBannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: '#D1FAE5',
    border: '2px solid #10B981',
    borderRadius: 12,
    marginBottom: 24
};

const errorCardStyle = {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: 16,
    marginBottom: 20,
    fontFamily: 'Inter, sans-serif'
};

const tabsContainerStyle = {
    display: 'flex',
    gap: 8,
    background: 'white',
    padding: 8,
    borderRadius: 12,
    border: '1px solid #E5E7EB',
    overflowX: 'auto'
};

const tabButtonStyle = {
    padding: '10px 16px',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    fontFamily: 'Inter, sans-serif'
};

const badgeStyle = {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    background: '#EF4444',
    borderRadius: '50%',
    border: '2px solid white'
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
};

const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
};

const labelStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const inputStyle = {
    padding: '10px 14px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const optionButtonStyle = {
    padding: '10px 20px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif'
};

const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    border: '2px solid #E5E7EB',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif'
};

const saveButtonStyle = {
    padding: '12px 24px',
    background: '#0d9488',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    alignSelf: 'flex-start',
    fontFamily: 'Inter, sans-serif'
};

const infoBoxStyle = {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 20
};

const subtitleTermsStyle = {
    margin: '0 0 12px 0',
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    fontFamily: 'Inter, sans-serif'
};

const listTermsStyle = {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#4B5563',
    fontFamily: 'Inter, sans-serif'
};
const sectionTitleStyle = {
    margin: '0 0 6px 0',
    fontSize: 22,
    fontWeight: 700,
    color: '#0d9488',
    fontFamily: 'Inter, sans-serif'
};

const sectionSubtitleStyle = {
    margin: 0,
    fontSize: 14,
    fontWeight: 500,
    color: '#64748b',
    fontFamily: 'Inter, sans-serif'
};