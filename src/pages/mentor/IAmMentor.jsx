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

    const { isMentor, mentorData: mentorStatusData, loading: mentorLoading } = useMentorStatus();
    const { paymentData, hasPaymentConfigured, savePaymentData } = useMentorPayment();

    const mentorData = mentorStatusData?.[0] || null;

    const [configForm, setConfigForm] = useState({
        maxAlumnos: null,
        localidad: '',
        aceptaZoom: false,
        aceptaPresencial: false,
        lugarPresencial: null,
        direccion: ''
    });

    const [pagoForm, setPagoForm] = useState({
        mpEmail: ''
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
        if (paymentData?.mp_email) {
            setPagoForm({ mpEmail: paymentData.mp_email });
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

            const { data: alumnos, error: alumnosError } = await supabase
                .from('usuario')
                .select('id_usuario, nombre, foto')
                .in('id_usuario', alumnoIds);

            if (alumnosError) {
                console.error('Error cargando alumnos:', alumnosError);
            }

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

                const slot = slots?.find(s =>
                    s.fecha === fecha &&
                    s.hora.slice(0, 5) === hora
                );

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

            setProximasSesiones(sesionesCompletas);
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
        if (!confirm(`¿Estás seguro que querés dejar de ser mentor de ${materiaName}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('mentor_materia')
                .delete()
                .eq('id', mentorshipId);

            if (error) throw error;

            setMentorships(prev => prev.filter(m => m.id !== mentorshipId));
            setSuccessModal({ open: true, message: 'Te diste de baja exitosamente' });

        } catch (err) {
            console.error('Error eliminando mentoría:', err);
            alert('Error al darte de baja');
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
            alert('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePago = async () => {
        if (!pagoForm.mpEmail.trim()) {
            alert('Ingresá tu email de Mercado Pago');
            return;
        }

        try {
            setSaving(true);

            const result = await savePaymentData({ mpEmail: pagoForm.mpEmail });

            if (result.success) {
                setSuccessModal({ open: true, message: 'Método de pago configurado. ¡Ya podés recibir solicitudes de clases!' });
            } else {
                alert('Error al guardar método de pago: ' + result.error);
            }

        } catch (err) {
            console.error('Error guardando pago:', err);
            alert('Error al guardar método de pago');
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

    if (mentorLoading || loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#6B7280' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!isMentor || !mentorData) {
        return (
            <div style={pageStyle}>
                <div style={containerStyle}>
                    <Card style={{ padding: 40, textAlign: 'center' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                        <h3 style={{ margin: '0 0 12px 0' }}>No sos mentor aún</h3>
                        <p style={{ color: '#6b7280', margin: 0 }}>
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
                <div style={headerContainerStyle}>
                    <div>
                        <h1 style={titleStyle}>Panel de Mentor</h1>
                        <p style={subtitleStyle}>Administrá tus mentorías y configuración</p>
                    </div>
                </div>

                {!hasPaymentConfigured && (
                    <div style={warningBannerStyle}>
                        <span style={{ fontSize: 20, color: '#f59e0b' }}>
                            <FontAwesomeIcon icon={faExclamationCircle} />
                        </span>
                        <div>
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
                        fontSize: 14
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
                            background: activeTab === 'materias' ? '#10B981' : 'transparent',
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
                            background: activeTab === 'proximas' ? '#10B981' : 'transparent',
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
                            background: activeTab === 'config' ? '#10B981' : 'transparent',
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
                            background: activeTab === 'pago' ? '#10B981' : 'transparent',
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
                            background: activeTab === 'terminos' ? '#10B981' : 'transparent',
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
                            <h2 style={sectionTitleStyle}>Mis Materias</h2>
                            <p style={sectionSubtitleStyle}>Materias en las que sos mentor actualmente</p>

                            {mentorships.length === 0 ? (
                                <Card style={{ padding: 40, textAlign: 'center', marginTop: 20 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16, color: '#0b7a72' }}>
                                        <FontAwesomeIcon icon={faBook} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px 0' }}>No tenés materias asignadas</h3>
                                    <p style={{ color: '#6b7280', margin: 0 }}>
                                        Contactá a soporte para agregar materias
                                    </p>
                                </Card>
                            ) : (
                                <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                                    {mentorships.map(mentorship => (
                                        <Card key={mentorship.id} style={{ padding: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 600 }}>
                                                        {mentorship.materia.nombre_materia}
                                                    </h3>
                                                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                                                        Semestre: {mentorship.materia.semestre}
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() => handleRemoveMentorship(
                                                        mentorship.id,
                                                        mentorship.materia.nombre_materia
                                                    )}
                                                    style={{
                                                        background: '#dc2626',
                                                        color: '#fff',
                                                        border: 'none'
                                                    }}
                                                >
                                                    Darme de baja
                                                </Button>
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

                                                {/* Descripción del alumno */}
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
                                                    <div
                                                        style={{
                                                            background: '#fff',
                                                            borderRadius: 12,
                                                            padding: 16,
                                                            marginBottom: 16,
                                                            border: '2px solid #6ee7d8'
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 8,
                                                                marginBottom: 8
                                                            }}
                                                        >
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
                                                                        background: '#ccfbf1',
                                                                        borderRadius: 8,
                                                                        border: '1px solid #99f6e4'
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
                                                    <div
                                                        style={{
                                                            background: '#f8fafc',
                                                            borderRadius: 12,
                                                            padding: 16,
                                                            marginBottom: 16,
                                                            borderLeft: '3px solid #0d9488'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                            <FontAwesomeIcon icon={faFileAlt} style={{ color: '#0d9488', fontSize: 14 }} />
                                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
        Descripción del alumno
      </span>
                                                        </div>
                                                        <p
                                                            style={{
                                                                margin: 0,
                                                                fontSize: 14,
                                                                fontWeight: 500,
                                                                color: '#475569',
                                                                lineHeight: 1.6
                                                            }}
                                                        >
                                                            {sesion.descripcion_alumno}
                                                        </p>
                                                    </div>
                                                )}


                                                {/* Botón cancelar (único) */}
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <button
                                                        style={{
                                                            flex: 1,
                                                            padding: '12px',
                                                            background: '#fff',
                                                            color: '#0d9488',
                                                            border: '2px solid #0d9488',
                                                            borderRadius: 10,
                                                            fontWeight: 700,
                                                            fontSize: 14,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            fontFamily: 'Inter, sans-serif'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.background = '#0d9488';
                                                            e.target.style.color = '#fff';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.background = '#fff';
                                                            e.target.style.color = '#0d9488';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />
                                                        Marcar como completada
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const fechaSesion = new Date(sesion.fecha_hora);
                                                            const ahora = new Date();
                                                            const horasRestantes = (fechaSesion - ahora) / (1000 * 60 * 60);

                                                            const fecha = fechaSesion.toISOString().split('T')[0];
                                                            const hora = fechaSesion.toTimeString().slice(0, 5);

                                                            setConfirmCancelSession({
                                                                id: sesion.id_sesion,
                                                                esMasDe36Horas: horasRestantes > 36,
                                                                fecha: fechaSesion,
                                                                materia: sesion.materia?.nombre_materia,
                                                                dateKey: fecha,
                                                                hora: hora
                                                            });
                                                        }}
                                                        style={{
                                                            flex: 1,
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
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div>
                            <h2 style={sectionTitleStyle}>Configuración de Mentorías</h2>
                            <p style={sectionSubtitleStyle}>Configurá cómo querés dar tus clases</p>

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
                                                        background: configForm.maxAlumnos === num ? '#10B981' : 'white',
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
                                            Virtual - $400 UYU
                                        </label>
                                        <label style={checkboxLabelStyle}>
                                            <input
                                                type="checkbox"
                                                checked={configForm.aceptaPresencial}
                                                onChange={(e) => setConfigForm({ ...configForm, aceptaPresencial: e.target.checked })}
                                            />
                                            Presencial - $600 UYU
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
                                                    <small style={{ fontSize: 13, color: '#6B7280' }}>
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
                            <h2 style={sectionTitleStyle}>Método de Pago</h2>
                            <p style={sectionSubtitleStyle}>Configurá cómo querés recibir tus pagos</p>

                            {hasPaymentConfigured && (
                                <div style={successBannerStyle}>
                                    <span style={{ fontSize: 20, color: '#10b981' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                    </span>
                                    <div>
                                        <strong>Método de pago configurado</strong>
                                        <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                                            Ya podés recibir solicitudes de clases
                                        </p>
                                    </div>
                                </div>
                            )}

                            <Card style={{ padding: 24, marginTop: 20 }}>
                                <div style={formStyle}>
                                    <div style={infoBoxStyle}>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
                                            💰 Cómo funcionan los pagos
                                        </h3>
                                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.8, color: '#4B5563' }}>
                                            <li>El usuario paga a través de Mercado Pago</li>
                                            <li>Retenemos el pago hasta 24 horas después de la clase</li>
                                            <li>Si no hay inconvenientes, transferimos a tu cuenta de MP</li>
                                            <li>Mercado Pago cobra ~6% de comisión por transacción</li>
                                            <li>Tus datos no se comparten con los usuarios</li>
                                        </ul>
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Email de Mercado Pago</label>
                                        <input
                                            type="email"
                                            placeholder="tu@email.com"
                                            value={pagoForm.mpEmail}
                                            onChange={(e) => setPagoForm({ ...pagoForm, mpEmail: e.target.value })}
                                            style={inputStyle}
                                        />
                                        <small style={{ fontSize: 13, color: '#6B7280' }}>
                                            Ingresá el email asociado a tu cuenta de Mercado Pago
                                        </small>
                                    </div>

                                    <div style={{ padding: 16, background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 12 }}>
                                        <p style={{ margin: 0, fontSize: 14, color: '#92400E' }}>
                                            <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: 6, color: '#f59e0b' }} />
                                            <strong>Importante:</strong> Asegurate de tener una cuenta activa en Mercado Pago.
                                            Si no tenés una, podés crearla en <a href="https://www.mercadopago.com.uy" target="_blank" style={{ color: '#10B981', fontWeight: 600 }}>mercadopago.com.uy</a>
                                        </p>
                                    </div>

                                    <button onClick={handleSavePago} disabled={saving} style={saveButtonStyle}>
                                        {saving ? 'Guardando...' : 'Guardar Método de Pago'}
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'terminos' && (
                        <div>
                            <h2 style={sectionTitleStyle}>Términos y Condiciones</h2>
                            <p style={sectionSubtitleStyle}>Condiciones para ser mentor en Kerana</p>

                            <Card style={{ padding: 24, marginTop: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={infoBoxStyle}>
                                        <h3 style={subtitleTermsStyle}>💰 Precios y Pagos</h3>
                                        <ul style={listTermsStyle}>
                                            <li><strong>Clases virtuales (Zoom):</strong> $400 UYU por sesión</li>
                                            <li><strong>Clases presenciales:</strong> $600 UYU por sesión</li>
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
                                                    <li><span style={{ color: '#10b981' }}>✓</span> Más de 12 horas antes: Reembolso completo al estudiante</li>
                                                    <li><span style={{ color: '#f59e0b' }}>!</span> Menos de 12 horas: Se te acredita 50%</li>
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
                                        <p style={{ margin: 0, fontSize: 14, color: '#1E40AF' }}>
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

            {/* Modal de confirmación de cancelación */}
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
                    animation: 'fadeIn 0.2s ease-out'
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
                            color: '#DC2626'
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
                            fontWeight: 500
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
                                    fontWeight: 600
                                }}>
                                    <strong>Recordá:</strong>
                                </p>
                                <ul style={{
                                    margin: 0,
                                    paddingLeft: 20,
                                    fontSize: 13,
                                    color: '#991b1b',
                                    lineHeight: 1.6
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

                                    const sessionId = confirmCancelSession.id;
                                    const mentorId = mentorData.id_mentor;
                                    const fecha = confirmCancelSession.dateKey; // Formato: 'YYYY-MM-DD'
                                    const hora = confirmCancelSession.hora + ':00'; // Formato: 'HH:MM:00'

                                    console.log('🔴 CANCELANDO:', { sessionId, mentorId, fecha, hora });

                                    try {
                                        // PASO 1: Eliminar sesión de mentor_sesion
                                        const { data: deletedSession, error: sessionError } = await supabase
                                            .from('mentor_sesion')
                                            .delete()
                                            .eq('id_sesion', sessionId)
                                            .select();

                                        console.log('📋 DELETE mentor_sesion:', { deletedSession, sessionError });

                                        if (sessionError) {
                                            console.error('❌ Error borrando sesión:', sessionError);
                                            throw new Error(`Error al eliminar sesión: ${sessionError.message}`);
                                        }

                                        if (!deletedSession || deletedSession.length === 0) {
                                            console.warn('⚠️ No se encontró la sesión para eliminar');
                                        } else {
                                            console.log('✅ Sesión eliminada:', deletedSession[0]);
                                        }

                                        // PASO 2: Eliminar slot de slots_disponibles
                                        const { data: deletedSlot, error: slotError } = await supabase
                                            .from('slots_disponibles')
                                            .delete()
                                            .eq('id_mentor', mentorId)
                                            .eq('fecha', fecha)
                                            .eq('hora', hora)
                                            .select();

                                        console.log('📋 DELETE slots_disponibles:', { deletedSlot, slotError });

                                        if (slotError) {
                                            console.error('❌ Error borrando slot:', slotError);
                                            // No lanzamos error aquí porque la sesión ya se eliminó
                                        }

                                        if (!deletedSlot || deletedSlot.length === 0) {
                                            console.warn('⚠️ No se encontró el slot para eliminar (puede que ya no exista)');
                                        } else {
                                            console.log('✅ Slot eliminado:', deletedSlot[0]);
                                        }

                                        // PASO 3: Actualizar UI local
                                        setProximasSesiones(prev =>
                                            prev.filter(s => s.id_sesion !== sessionId)
                                        );

                                        // PASO 4: Notificar a MyCalendar
                                        window.dispatchEvent(new CustomEvent('slotCanceled', {
                                            detail: { fecha, hora: hora.slice(0, 5) }
                                        }));

                                        console.log('✅ CANCELACIÓN COMPLETADA');

                                        setCancelSuccess(true);
                                        setTimeout(() => setCancelSuccess(false), 3000);

                                    } catch (error) {
                                        console.error('🔥 ERROR TOTAL:', error);
                                        alert(`Error al cancelar: ${error.message}\n\nRevisa la consola para más detalles.`);
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

            {/* Modal de detalle de sesión */}
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
                    padding: 20
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
                        {/* Header del modal */}
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

                        {/* Contenido del modal */}
                        <div style={{ padding: 24 }}>
                            {/* Info del alumno */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                marginBottom: 24,
                                padding: 16,
                                background: '#f8fafc',
                                borderRadius: 12,
                                border: '2px solid #e2e8f0'
                            }}>
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 12,
                                    background: selectedSession.alumno?.foto
                                        ? `url(${selectedSession.alumno.foto}) center/cover`
                                        : '#0d9488',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: 28,
                                    fontWeight: 700,
                                    flexShrink: 0
                                }}>
                                    {!selectedSession.alumno?.foto && (selectedSession.alumno?.nombre?.[0] || '?')}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        marginBottom: 4,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        {selectedSession.alumno?.nombre || 'Sin nombre'}
                                    </div>
                                    {selectedSession.alumno?.username && (
                                        <div style={{
                                            fontSize: 14,
                                            color: '#64748b',
                                            fontFamily: 'Inter, sans-serif',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}>
                                            <FontAwesomeIcon icon={faUser} style={{ fontSize: 12 }} />
                                            @{selectedSession.alumno.username}
                                        </div>
                                    )}
                                </div>
                                <span style={{
                                    padding: '6px 12px',
                                    background: selectedSession.estado === 'confirmada' ? '#d1fae5' : '#fef3c7',
                                    color: selectedSession.estado === 'confirmada' ? '#065f46' : '#92400e',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {selectedSession.estado === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
                                </span>
                            </div>

                            {/* Detalles de la sesión */}
                            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
                                {/* Materia */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        background: '#0d9488',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: 16
                                    }}>
                                        <FontAwesomeIcon icon={faBook} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            marginBottom: 2,
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Materia
                                        </div>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            {selectedSession.materia?.nombre_materia || 'No especificada'}
                                        </div>
                                    </div>
                                </div>

                                {/* Fecha y hora */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        background: '#2563eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: 16
                                    }}>
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            marginBottom: 2,
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Fecha y hora
                                        </div>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            {new Date(selectedSession.fecha_hora).toLocaleDateString('es-UY', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })} a las {new Date(selectedSession.fecha_hora).toLocaleTimeString('es-UY', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        </div>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            marginTop: 2,
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Duración: {selectedSession.duracion_minutos || 60} minutos
                                        </div>
                                    </div>
                                </div>

                                {/* Ubicación */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        background: selectedSession.modalidad === 'virtual' ? '#8b5cf6' : '#10b981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: 16
                                    }}>
                                        <FontAwesomeIcon icon={selectedSession.modalidad === 'virtual' ? faUniversity : faHome} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            marginBottom: 2,
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Modalidad
                                        </div>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            {selectedSession.modalidad === 'virtual' ? 'Virtual (Teams)' : 'Presencial'}
                                            {selectedSession.modalidad === 'presencial' && selectedSession.locacion && (
                                                <span style={{ color: '#64748b', fontWeight: 500 }}>
                                                    {' '}- {selectedSession.locacion === 'casa' ? 'Casa' : 'Facultad'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cantidad de participantes */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        background: '#0d9488',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: 16
                                    }}>
                                        <FontAwesomeIcon icon={faUsers} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 12,
                                            color: '#64748b',
                                            marginBottom: 2,
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            Participantes
                                        </div>
                                        <div style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            fontFamily: 'Inter, sans-serif'
                                        }}>
                                            {selectedSession.cantidad_alumnos || 1} {selectedSession.cantidad_alumnos === 1 ? 'persona' : 'personas'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Emails de participantes */}
                            {selectedSession.emails_participantes && selectedSession.emails_participantes.length > 0 && (
                                <div style={{
                                    marginBottom: 24,
                                    padding: 16,
                                    background: '#f0f9ff',
                                    borderRadius: 12,
                                    border: '2px solid #bae6fd'
                                }}>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: 12,
                                        fontFamily: 'Inter, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <FontAwesomeIcon icon={faEnvelope} style={{ color: '#0284c7' }} />
                                        Emails de participantes:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {selectedSession.emails_participantes.map((email, idx) => (
                                            <div key={idx} style={{
                                                fontSize: 13,
                                                color: '#0c4a6e',
                                                fontFamily: 'Inter, sans-serif',
                                                padding: '8px 12px',
                                                background: '#e0f2fe',
                                                borderRadius: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8
                                            }}>
                                                <span style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 6,
                                                    background: '#0284c7',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 11,
                                                    fontWeight: 700
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                {email}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Descripción del alumno */}
                            {selectedSession.descripcion_alumno && (
                                <div style={{
                                    marginBottom: 24,
                                    padding: 16,
                                    background: '#f0fdf4',
                                    borderLeft: '4px solid #0d9488',
                                    borderRadius: 8
                                }}>
                                    <div style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#0f172a',
                                        marginBottom: 8,
                                        fontFamily: 'Inter, sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <FontAwesomeIcon icon={faComment} style={{ color: '#0d9488' }} />
                                        Descripción de la sesión:
                                    </div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 14,
                                        color: '#065f46',
                                        lineHeight: 1.6,
                                        fontFamily: 'Inter, sans-serif'
                                    }}>
                                        "{selectedSession.descripcion_alumno}"
                                    </p>
                                </div>
                            )}

                            {/* Botón cancelar */}
                            <button
                                onClick={() => {
                                    const fechaSesion = new Date(selectedSession.fecha_hora);
                                    const ahora = new Date();
                                    const horasRestantes = (fechaSesion - ahora) / (1000 * 60 * 60);

                                    setConfirmCancelSession({
                                        id: selectedSession.id_sesion,
                                        esMasDe36Horas: horasRestantes > 36,
                                        fecha: fechaSesion,
                                        materia: selectedSession.materia?.nombre_materia
                                    });
                                    setShowSessionModal(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    border: '2px solid #fecaca',
                                    borderRadius: 10,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                                onMouseEnter={e => {
                                    e.target.style.background = '#fee2e2';
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
                                }}
                                onMouseLeave={e => {
                                    e.target.style.background = '#fef2f2';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} />
                                Cancelar mentoría
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Estilos
const pageStyle = {
    minHeight: '100vh',
    background: '#F9FAFB',
    paddingBottom: 40
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
    borderTop: '3px solid #10B981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

const headerContainerStyle = {
    marginBottom: 24
};

const titleStyle = {
    margin: '0 0 8px 0',
    fontSize: 28,
    fontWeight: 700,
    color: '#111827'
};

const subtitleStyle = {
    margin: 0,
    fontSize: 15,
    color: '#6B7280'
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
    whiteSpace: 'nowrap'
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
    marginBottom: 20
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
    position: 'relative'
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

const sectionTitleStyle = {
    margin: '0 0 8px 0',
    fontSize: 22,
    fontWeight: 700,
    color: '#111827'
};

const sectionSubtitleStyle = {
    margin: 0,
    fontSize: 14,
    color: '#6B7280'
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
    color: '#111827'
};

const inputStyle = {
    padding: '10px 14px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    color: '#111827'
};

const optionButtonStyle = {
    padding: '10px 20px',
    border: '2px solid #D1D5DB',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14
};

const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    border: '2px solid #E5E7EB',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14
};

const saveButtonStyle = {
    padding: '12px 24px',
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    alignSelf: 'flex-start'
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
    color: '#111827'
};

const listTermsStyle = {
    margin: 0,
    paddingLeft: 20,
    fontSize: 14,
    lineHeight: 1.8,
    color: '#4B5563'
};