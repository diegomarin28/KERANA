import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { mentorAPI } from '../../api/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useMentorPayment } from '../../hooks/useMentorPayment';
import { MentorWelcomeModal } from '../../components/MentorWelcomeModal';
import { useMentorStatus } from '../../hooks/useMentorStatus';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    const { isMentor, mentorData: mentorStatusData, loading: mentorLoading, refetch } = useMentorStatus();
    const { paymentData, hasPaymentConfigured, savePaymentData } = useMentorPayment();

    const mentorData = mentorStatusData?.[0] || null;
    const mentorships = mentorData?.mentor_materia || [];

    const [configForm, setConfigForm] = useState({
        maxAlumnos: null,
        localidad: '',
        aceptaZoom: false,
        aceptaPresencial: false,
        lugarPresencial: null,
        direccion: ''
    });

    const [perfilForm, setPerfilForm] = useState({
        linkedin: '',
        bio: ''
    });

    const [pagoForm, setPagoForm] = useState({
        mpEmail: ''
    });

    // Sistema de notificaciones
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3500);
    };

    useEffect(() => {
        if (mentorData?.id_mentor) {
            fetchMentorDetails();
        }
    }, [mentorData?.id_mentor]);

    const fetchMentorDetails = async () => {
        if (!mentorData?.id_mentor) return;

        try {
            const { data: fullMentor, error: fullMentorError } = await supabase
                .from('mentor')
                .select('*')
                .eq('id_mentor', mentorData.id_mentor)
                .single();

            if (fullMentorError) {
                console.error('Error cargando datos completos del mentor:', fullMentorError);
                return;
            }

            if (fullMentor) {
                setConfigForm({
                    maxAlumnos: fullMentor.max_alumnos,
                    localidad: fullMentor.localidad || '',
                    aceptaZoom: fullMentor.acepta_zoom || false,
                    aceptaPresencial: fullMentor.acepta_presencial || false,
                    lugarPresencial: fullMentor.lugar_presencial,
                    direccion: fullMentor.direccion || ''
                });

                setPerfilForm({
                    linkedin: fullMentor.linkedin || '',
                    bio: fullMentor.bio || ''
                });

                if (!fullMentor.onboarding_bienvenida_vista) {
                    setShowWelcome(true);
                }
            }
        } catch (err) {
            console.error('Error cargando detalles del mentor:', err);
        }
    };

    const handleRemoveMentorship = (mentorshipId, materiaName) => {
        setConfirmDelete({ id: mentorshipId, name: materiaName });
    };

    const confirmRemoveMentorship = async () => {
        if (!confirmDelete) return;

        try {
            const { error } = await supabase
                .from('mentor_materia')
                .delete()
                .eq('id', confirmDelete.id);

            if (error) throw error;

            const materiaName = confirmDelete.name;
            setConfirmDelete(null);

            showNotification(`Te diste de baja exitosamente de ${materiaName}`, 'success');

            setTimeout(async () => {
                await refetch();
            }, 1000);

        } catch (err) {
            console.error('Error eliminando mentoría:', err);
            showNotification('Error al darte de baja. Intentá de nuevo.', 'error');
            setConfirmDelete(null);
        }
    };

    const handleSaveConfig = async () => {
        if (!mentorData?.id_mentor) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from('mentor')
                .update({
                    max_alumnos: configForm.maxAlumnos,
                    localidad: configForm.localidad,
                    acepta_zoom: configForm.aceptaZoom,
                    acepta_presencial: configForm.aceptaPresencial,
                    lugar_presencial: configForm.lugarPresencial,
                    direccion: configForm.direccion
                })
                .eq('id_mentor', mentorData.id_mentor);

            if (error) throw error;

            showNotification('Configuración guardada exitosamente', 'success');

        } catch (err) {
            console.error('Error guardando config:', err);
            showNotification('Error al guardar configuración', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePerfil = async () => {
        if (!mentorData?.id_mentor) return;

        try {
            setSaving(true);

            const { error } = await supabase
                .from('mentor')
                .update({
                    linkedin: perfilForm.linkedin,
                    bio: perfilForm.bio
                })
                .eq('id_mentor', mentorData.id_mentor);

            if (error) throw error;

            showNotification('Perfil actualizado exitosamente', 'success');

        } catch (err) {
            console.error('Error guardando perfil:', err);
            showNotification('Error al guardar perfil', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePago = async () => {
        if (!pagoForm.mpEmail.trim()) {
            showNotification('Ingresá tu email de Mercado Pago', 'error');
            return;
        }

        try {
            setSaving(true);

            const result = await savePaymentData({ mpEmail: pagoForm.mpEmail });

            if (result.success) {
                showNotification('Método de pago configurado. ¡Ya podés recibir solicitudes!', 'success');
            } else {
                showNotification('Error al guardar método de pago', 'error');
            }

        } catch (err) {
            console.error('Error guardando pago:', err);
            showNotification('Error al guardar método de pago', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseWelcome = async () => {
        setShowWelcome(false);

        if (mentorData?.id_mentor) {
            await supabase
                .from('mentor')
                .update({ onboarding_bienvenida_vista: true })
                .eq('id_mentor', mentorData.id_mentor);
        }
    };

    if (mentorLoading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#6B7280' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!mentorData) {
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
            {/* Sistema de notificaciones */}
            {notification && (
                <div style={{
                    ...notificationStyle,
                    background: notification.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                    borderColor: notification.type === 'success' ? '#10B981' : '#EF4444'
                }}>
                    <span style={{ fontSize: 20 }}>
                        {notification.type === 'success' ? '✅' : '❌'}
                    </span>
                    <span style={{
                        flex: 1,
                        color: notification.type === 'success' ? '#065F46' : '#991B1B',
                        fontWeight: 600
                    }}>
                        {notification.message}
                    </span>
                </div>
            )}

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
                        onClick={() => setActiveTab('perfil')}
                        style={{
                            ...tabButtonStyle,
                            background: activeTab === 'perfil' ? '#10B981' : 'transparent',
                            color: activeTab === 'perfil' ? 'white' : '#6B7280'
                        }}
                    >
                        👤 Perfil Público
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div>
                                    <h2 style={sectionTitleStyle}>Mis Materias</h2>
                                    <p style={sectionSubtitleStyle}>Materias en las que sos mentor actualmente</p>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/mentores/postular'}
                                    style={{
                                        background: '#10B981',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#059669'}
                                    onMouseLeave={(e) => e.target.style.background = '#10B981'}
                                >
                                    + Agregar Materia
                                </button>
                            </div>

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
                                                        {mentorship.materia?.nombre_materia || 'Sin nombre'}
                                                    </h3>
                                                    <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                                                        Semestre: {mentorship.materia?.semestre || 'N/A'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMentorship(
                                                        mentorship.id,
                                                        mentorship.materia?.nombre_materia || 'esta materia'
                                                    )}
                                                    style={{
                                                        background: '#dc2626',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#991b1b'}
                                                    onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                                                >
                                                    Darme de baja
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
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
                                                checked={configForm.aceptaZoom}
                                                onChange={(e) => setConfigForm({ ...configForm, aceptaZoom: e.target.checked })}
                                            />
                                            Zoom (virtual) - $400 UYU
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

                    {activeTab === 'perfil' && (
                        <div>
                            <h2 style={sectionTitleStyle}>Perfil Público</h2>
                            <p style={sectionSubtitleStyle}>Esta información aparece en tu perfil de mentor</p>

                            <Card style={{ padding: 24, marginTop: 20 }}>
                                <div style={formStyle}>
                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>LinkedIn (opcional)</label>
                                        <input
                                            type="url"
                                            placeholder="https://linkedin.com/in/tu-perfil"
                                            value={perfilForm.linkedin}
                                            onChange={(e) => setPerfilForm({ ...perfilForm, linkedin: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={fieldStyle}>
                                        <label style={labelStyle}>Biografía</label>
                                        <textarea
                                            placeholder="Contá un poco sobre vos, tu experiencia y por qué te gusta enseñar..."
                                            value={perfilForm.bio}
                                            onChange={(e) => setPerfilForm({ ...perfilForm, bio: e.target.value })}
                                            rows={5}
                                            maxLength={500}
                                            style={{ ...inputStyle, resize: 'vertical' }}
                                        />
                                        <small style={{ fontSize: 13, color: '#6B7280' }}>
                                            {perfilForm.bio.length}/500 caracteres
                                        </small>
                                    </div>

                                    <button onClick={handleSavePerfil} disabled={saving} style={saveButtonStyle}>
                                        {saving ? 'Guardando...' : 'Guardar Perfil'}
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
                                            Si no tenés una, podés crearla en <a href="https://www.mercadopago.com.uy" target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 600 }}>mercadopago.com.uy</a>
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

            {/* Modal de confirmación */}
            {confirmDelete && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                            <h2 style={{ margin: '0 0 12px 0', fontSize: 20, fontWeight: 700, color: '#111827' }}>
                                ¿Estás seguro?
                            </h2>
                            <p style={{ margin: 0, fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>
                                Vas a dejar de ser mentor de <strong>{confirmDelete.name}</strong>.
                                <br />
                                Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                style={cancelButtonStyle}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRemoveMentorship}
                                style={confirmButtonStyle}
                                onMouseEnter={(e) => e.target.style.background = '#991b1b'}
                                onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                            >
                                Sí, darme de baja
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

const notificationStyle = {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderRadius: 12,
    border: '2px solid',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    minWidth: 320,
    maxWidth: 500,
    animation: 'slideIn 0.3s ease-out'
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

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 16
};

const modalContentStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 32,
    maxWidth: 440,
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

const cancelButtonStyle = {
    padding: '12px 24px',
    background: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

const confirmButtonStyle = {
    padding: '12px 24px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};