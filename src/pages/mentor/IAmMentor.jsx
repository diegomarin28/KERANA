import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useMentorPayment } from '../../hooks/useMentorPayment';
import { MentorWelcomeModal } from '../../components/MentorWelcomeModal';
import { useMentorStatus } from '../../hooks/useMentorStatus';
import { SuccessModal } from '../../components/SuccessModal';

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
            console.log('🔍 Fecha/hora actual:', ahora.toISOString());
            console.log('🔍 Buscando sesiones para mentor ID:', mentorData.id_mentor);
            console.log('🔍 Verificando sesión 40 específicamente...');
            const { data: sesion40, error: error40 } = await supabase
                .from('mentor_sesion')
                .select('*')
                .eq('id_sesion', 40)
                .maybeSingle();

            console.log('📊 Sesión 40:', sesion40);
            console.log('   Estado:', sesion40?.estado);
            console.log('   Alumno:', sesion40?.id_alumno);
            console.log('   Fecha:', sesion40?.fecha_hora);

            // Ver TODAS las sesiones confirmadas
            const { data: todasSesiones } = await supabase
                .from('mentor_sesion')
                .select('id_sesion, fecha_hora, id_alumno, estado')
                .eq('id_mentor', mentorData.id_mentor)
                .eq('estado', 'confirmada')
                .order('fecha_hora', { ascending: true });

            console.log('📊 TODAS las sesiones confirmadas:', todasSesiones);

            // ✅ Mostrar cuáles son futuras y cuáles pasadas
            todasSesiones?.forEach(s => {
                const esFutura = new Date(s.fecha_hora) >= ahora;
                console.log(`   ${esFutura ? '✅' : '❌'} Sesión ${s.id_sesion}: ${s.fecha_hora} | Alumno: ${s.id_alumno} | ${esFutura ? 'FUTURA' : 'PASADA'}`);
            });

            // Obtener SOLO sesiones futuras
            const { data: sesiones, error: sesionesError } = await supabase
                .from('mentor_sesion')
                .select(`
                id_sesion,
                fecha_hora,
                duracion_minutos,
                estado,
                precio,
                notas_alumno,
                id_alumno,
                id_materia
            `)
                .eq('id_mentor', mentorData.id_mentor)
                .eq('estado', 'confirmada')
                .gte('fecha_hora', ahora.toISOString())
                .order('fecha_hora', { ascending: true });

            console.log('📊 Sesiones FUTURAS filtradas:', sesiones);

            if (sesionesError) throw sesionesError;

            if (!sesiones || sesiones.length === 0) {
                setProximasSesiones([]);
                return;
            }

            // Resto del código igual...
            const alumnoIds = [...new Set(sesiones.map(s => s.id_alumno).filter(Boolean))];
            console.log('🔍 IDs de alumnos únicos:', alumnoIds);

            const { data: alumnos, error: alumnosError } = await supabase
                .from('usuario')
                .select('id_usuario, nombre, foto')
                .in('id_usuario', alumnoIds);

            console.log('👥 Alumnos cargados:', alumnos);

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

            // Contar reservas totales por fecha/hora
            const reservasPorFechaHora = {};
            sesiones.forEach(sesion => {
                const fechaHora = new Date(sesion.fecha_hora);
                const fecha = fechaHora.toISOString().split('T')[0];
                const hora = fechaHora.toTimeString().slice(0, 5);
                const key = `${fecha}-${hora}`;
                reservasPorFechaHora[key] = (reservasPorFechaHora[key] || 0) + 1;
            });

// Combinar toda la información
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

            console.log('✅ Sesiones completas FINAL:', sesionesCompletas);
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

    const formatFecha = (fechaStr) => {
        const fecha = new Date(fechaStr);
        const opciones = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return fecha.toLocaleDateString('es-UY', opciones);
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
                        <span style={{ fontSize: 20 }}>⚠️</span>
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

                <div style={tabsContainerStyle}>
                    <button
                        onClick={() => setActiveTab('materias')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'materias' ? '#10B981' : 'transparent',
                            color: activeTab === 'materias' ? 'white' : '#6B7280'
                        }}
                    >
                        📚 Materias
                    </button>
                    <button
                        onClick={() => setActiveTab('proximas')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'proximas' ? '#10B981' : 'transparent',
                            color: activeTab === 'proximas' ? 'white' : '#6B7280'
                        }}
                    >
                        📅 Próximas Mentorías
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'config' ? '#10B981' : 'transparent',
                            color: activeTab === 'config' ? 'white' : '#6B7280'
                        }}
                    >
                        ⚙️ Configuración
                    </button>
                    <button
                        onClick={() => setActiveTab('pago')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'pago' ? '#10B981' : 'transparent',
                            color: activeTab === 'pago' ? 'white' : '#6B7280'
                        }}
                    >
                        💳 Método de Pago
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
                        📄 Términos
                    </button>
                </div>

                <div style={{ marginTop: 24 }}>
                    {activeTab === 'materias' && (
                        <div>
                            <h2 style={sectionTitleStyle}>Mis Materias</h2>
                            <p style={sectionSubtitleStyle}>Materias en las que sos mentor actualmente</p>

                            {mentorships.length === 0 ? (
                                <Card style={{ padding: 40, textAlign: 'center', marginTop: 20 }}>
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
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
                                    <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                                    <h3 style={{ margin: '0 0 12px 0' }}>No tenés mentorías programadas</h3>
                                    <p style={{ color: '#6b7280', margin: 0 }}>
                                        Cuando los alumnos agenden clases, aparecerán aquí
                                    </p>
                                </Card>
                            ) : (
                                <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                                    {proximasSesiones.map(sesion => {
                                        const alumnosActuales = sesion.slot_info?.reservas_actuales || 1;
                                        const maxAlumnos = sesion.slot_info?.max_alumnos || 1;
                                        const nombreAlumno = sesion.alumno?.nombre || 'Sin nombre';

                                        // ✅ Calcular hora de fin usando la duración del SLOT
                                        const fechaInicio = new Date(sesion.fecha_hora);
                                        const duracionMinutos = sesion.slot_info?.duracion || sesion.duracion_minutos || 60;
                                        const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);
                                        const horaInicio = fechaInicio.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
                                        const horaFin = fechaFin.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <Card key={sesion.id_sesion} style={{
                                                padding: 20,
                                                maxWidth: 700
                                            }}>
                                                {/* Header: Fecha y Estado */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 16
                                                }}>
                                                    <div style={{
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: '#374151',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8
                                                    }}>
                                                        📅 {fechaInicio.toLocaleDateString('es-UY', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                    </div>

                                                    <span style={{
                                                        padding: '4px 12px',
                                                        background: sesion.estado === 'confirmada' ? '#D1FAE5' : '#FEF3C7',
                                                        color: sesion.estado === 'confirmada' ? '#065F46' : '#92400E',
                                                        borderRadius: 8,
                                                        fontSize: 12,
                                                        fontWeight: 700
                                                    }}>
                    {sesion.estado === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
                </span>
                                                </div>

                                                {/* Hora destacada */}
                                                <div style={{
                                                    fontSize: 24,
                                                    fontWeight: 700,
                                                    color: '#1F2937',
                                                    marginBottom: 16,
                                                    letterSpacing: '-0.5px'
                                                }}>
                                                    🕐 {horaInicio} - {horaFin}
                                                </div>

                                                {/* Modalidad y Botón de cancelar en la misma línea */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',  // ✅ Esto centra verticalmente
                                                    marginBottom: 16
                                                }}>
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: sesion.modalidad === 'virtual'
            ? '#EFF6FF'
            : '#ECFDF5',
        border: `2px solid ${sesion.modalidad === 'virtual' ? '#BFDBFE' : '#A7F3D0'}`,
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 14,
        color: sesion.modalidad === 'virtual' ? '#1E40AF' : '#065F46'
    }}>
        {sesion.modalidad === 'virtual' ? '💻' : '🏢'}
        {sesion.modalidad === 'virtual' ? 'Virtual' :
            sesion.locacion === 'casa' ? 'Presencial - Casa' : 'Presencial - Facultad'}
    </span>

                                                    {/* Botón de cancelar - Centrado verticalmente */}
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('¿Estás seguro que querés cancelar esta sesión?')) {
                                                                // TODO: Implementar cancelación
                                                                console.log('Cancelar sesión:', sesion.id_sesion);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: '#FEF2F2',
                                                            color: '#DC2626',
                                                            border: '2px solid #FECACA',
                                                            borderRadius: 8,
                                                            fontSize: 13,
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.target.style.background = '#FEE2E2';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.target.style.background = '#FEF2F2';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        ❌ Cancelar
                                                    </button>
                                                </div>

                                                {/* Info secundaria */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 16,
                                                    flexWrap: 'wrap',
                                                    paddingTop: 12,
                                                    borderTop: '2px solid #F3F4F6',
                                                    fontSize: 14
                                                }}>
                <span style={{ fontWeight: 600, color: '#6B7280' }}>
                    👤 {nombreAlumno}
                </span>

                                                    <span style={{ color: '#D1D5DB' }}>•</span>

                                                    <span style={{ fontWeight: 600, color: '#6B7280' }}>
                    📚 {sesion.materia?.nombre_materia || 'Materia'}
                </span>

                                                    <span style={{ color: '#D1D5DB' }}>•</span>

                                                    <span style={{ fontWeight: 600, color: '#6B7280' }}>
                    👥 {alumnosActuales}/{maxAlumnos}
                </span>
                                                </div>

                                                {/* Notas */}
                                                {sesion.notas_alumno && (
                                                    <div style={{
                                                        marginTop: 12,
                                                        padding: 12,
                                                        background: '#F9FAFB',
                                                        borderLeft: '3px solid #6366F1',
                                                        borderRadius: 6,
                                                        fontSize: 13,
                                                        color: '#374151'
                                                    }}>
                                                        <strong>💬 Nota:</strong> {sesion.notas_alumno}
                                                    </div>
                                                )}
                                            </Card>
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
                                    <span style={{ fontSize: 20 }}>✅</span>
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
                                            ⚠️ <strong>Importante:</strong> Asegurate de tener una cuenta activa en Mercado Pago.
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
                                        <h3 style={subtitleTermsStyle}>📅 Política de Cancelaciones</h3>
                                        <ul style={listTermsStyle}>
                                            <li><strong>Cancelación del estudiante:</strong>
                                                <ul style={{ marginTop: 8 }}>
                                                    <li>✅ Más de 12 horas antes: Reembolso completo</li>
                                                    <li>⚠️ Menos de 12 horas: Se te acredita 25%</li>
                                                </ul>
                                            </li>
                                            <li><strong>Cancelación tuya:</strong>
                                                <ul style={{ marginTop: 8 }}>
                                                    <li>✅ Más de 36 horas antes: Sin penalización</li>
                                                    <li>❌ Menos de 36 horas: 1 strike</li>
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