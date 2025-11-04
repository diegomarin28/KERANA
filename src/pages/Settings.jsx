import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faLock,
    faChartBar,
    faCog,
    faBell,
    faEye,
    faFileAlt,
    faPalette,
    faGlobe,
    faMobileAlt,
    faExclamationTriangle,
    faHourglass,
    faCheck,
    faArrowLeft,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { downloadUserData, getUserDataSummary } from '../utils/exportUserData';
import { supabase } from '../supabase';
import { useMentorStatus } from '../hooks/useMentorStatus';

const TAB_STORAGE_KEY = 'kerana_settings_active_tab';

export default function Settings() {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(TAB_STORAGE_KEY) || 'account';
    });
    const navigate = useNavigate();

    const { settings, toggleSetting, resetToDefault } = useNotificationSettings();

    useEffect(() => {
        localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    const tabs = [
        { id: 'account', label: 'Cuenta', icon: faUser },
        { id: 'notifications', label: 'Notificaciones', icon: faBell },
        { id: 'privacy', label: 'Privacidad', icon: faLock },
        { id: 'appearance', label: 'Apariencia', icon: faPalette },
    ];

    const { isMentor } = useMentorStatus();

    const notificationTypes = [
        { key: 'nuevo_seguidor', label: 'Nuevos seguidores', color: '#0095f6' },
        { key: 'nuevo_like', label: 'Likes a tus apuntes', color: '#ef4444' },
        { key: 'nueva_resenia', label: 'Reseñas a tus materias favoritas', color: '#f59e0b' },
        { key: 'nuevo_apunte', label: 'Nuevos apuntes de tus seguidos', color: '#3b82f6' },
        { key: 'compra_apunte', label: 'Compras de tus apuntes', color: '#10b981' },
        { key: 'mentor_nuevas_horas', label: 'Nuevas horas disponibles de mentores', color: '#0d9488' },
        ...(isMentor ? [{ key: 'nueva_clase_agendada', label: 'Clases agendadas', color: '#0d9488' }] : []),
        { key: 'system', label: 'Sistema', color: '#64748b' },
        { key: 'update', label: 'Actualizaciones', color: '#0ea5e9' },
    ];

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <button
                        onClick={() => navigate(-1)}
                        style={backButtonStyle}
                        onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
                        Volver
                    </button>
                    <h1 style={titleStyle}>Configuración</h1>
                    <p style={subtitleStyle}>
                        Personalizá tu experiencia en Kerana
                    </p>
                </div>

                {/* Tabs */}
                <div style={tabsContainerStyle}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                ...tabButtonStyle,
                                background: activeTab === tab.id
                                    ? 'linear-gradient(135deg, #0095f6 0%, #0077d4 100%)'
                                    : '#fff',
                                color: activeTab === tab.id ? '#fff' : '#64748b',
                                borderColor: activeTab === tab.id ? 'transparent' : '#e5e7eb',
                                boxShadow: activeTab === tab.id
                                    ? '0 4px 12px rgba(0, 149, 246, 0.3)'
                                    : '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== tab.id) {
                                    e.target.style.background = '#f8fafc';
                                    e.target.style.transform = 'translateY(-2px)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== tab.id) {
                                    e.target.style.background = '#fff';
                                    e.target.style.transform = 'translateY(0)';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={tab.icon} style={{ marginRight: 8, fontSize: 14 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    {activeTab === 'account' && <AccountTab navigate={navigate} />}
                    {activeTab === 'notifications' && (
                        <NotificationsTab
                            settings={settings}
                            toggleSetting={toggleSetting}
                            resetToDefault={resetToDefault}
                            notificationTypes={notificationTypes}
                        />
                    )}
                    {activeTab === 'privacy' && <PrivacyTab navigate={navigate} />}
                    {activeTab === 'appearance' && <AppearanceTab />}
                </div>
            </div>
        </div>
    );
}

// ============================================
// TAB: CUENTA
// ============================================
function AccountTab({ navigate }) {
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage('Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 6) {
            setMessage('Mínimo 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setMessage('Contraseña actualizada correctamente');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setChangePasswordOpen(false);
                setMessage('');
            }, 2000);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card title="Información de Cuenta" icon={faUser} color="#0095f6">
                <p style={descriptionStyle}>
                    Administrá tu información personal
                </p>
                <ActionButton onClick={() => navigate('/profile')} label="Mi perfil" />
                <ActionButton onClick={() => navigate('/edit-profile')} label="Editar perfil" />
            </Card>

            <Card title="Seguridad" icon={faLock} color="#ef4444">
                {!changePasswordOpen ? (
                    <ActionButton onClick={() => setChangePasswordOpen(true)} label="Cambiar contraseña" />
                ) : (
                    <div style={{ marginTop: 12 }}>
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            type="password"
                            placeholder="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={inputStyle}
                        />
                        {message && (
                            <MessageBanner
                                message={message}
                                type={message.includes('correctamente') ? 'success' : 'error'}
                            />
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                style={{ ...primaryButtonStyle, flex: 1, opacity: loading ? 0.5 : 1 }}
                            >
                                {loading ? 'Cambiando...' : 'Cambiar'}
                            </button>
                            <button
                                onClick={() => {
                                    setChangePasswordOpen(false);
                                    setMessage('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                style={{ ...secondaryButtonStyle, flex: 1 }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            <Card title="Gestión de Datos" icon={faChartBar} color="#8b5cf6">
                <DataManagementSection />
            </Card>
        </>
    );
}

// ============================================
// GESTIÓN DE DATOS
// ============================================
function DataManagementSection() {
    const [summary, setSummary] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        const data = await getUserDataSummary();
        setSummary(data);
    };

    const handleDownload = async () => {
        setDownloading(true);
        setMessage('');

        try {
            const success = await downloadUserData();
            setMessage(success ? 'Datos descargados correctamente' : 'Error al descargar datos');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error al descargar datos');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <p style={descriptionStyle}>
                Descargá todos tus datos en formato JSON
            </p>

            {summary && (
                <div style={statsGridStyle}>
                    <DataStat label="Notificaciones" value={summary.notificaciones} color="#0095f6" />
                    <DataStat label="Apuntes" value={summary.apuntes} color="#10b981" />
                    <DataStat label="Favoritos" value={summary.favoritos} color="#f59e0b" />
                    <DataStat label="Reseñas" value={summary.reseñas} color="#ef4444" />
                </div>
            )}

            {message && (
                <MessageBanner
                    message={message}
                    type={message.includes('correctamente') ? 'success' : 'error'}
                />
            )}

            <ActionButton
                onClick={handleDownload}
                disabled={downloading}
                label={downloading ? 'Descargando...' : 'Descargar mis datos'}
            />

            <ActionButton
                onClick={() => setDeleteModalOpen(true)}
                label="Eliminar cuenta"
                danger
            />

            <DeleteAccountModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
            />
        </>
    );
}

// ============================================
// MODAL DE ELIMINACIÓN DE CUENTA
// ============================================
function DeleteAccountModal({ isOpen, onClose }) {
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [deletionReason, setDeletionReason] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [isOAuthUser, setIsOAuthUser] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            detectAuthMethod();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setPassword('');
            setDeletionReason('');
            setVerificationCode('');
            setError('');
            setLoading(false);
            setCodeSent(false);
            setUserEmail('');
            setIsOAuthUser(false);
        }
    }, [isOpen]);

    const detectAuthMethod = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) throw new Error('Usuario no autenticado');

            const provider = user.app_metadata?.provider || 'email';
            setIsOAuthUser(provider === 'google' || provider === 'github');
            setUserEmail(user.email);
        } catch (err) {
            console.error('Error al detectar método de autenticación:', err);
            setError('Error al verificar usuario');
        }
    };

    const handleSendCode = async () => {
        setLoading(true);
        setError('');

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('Usuario no autenticado');

            const userId = user.id;

            const { data, error } = await supabase.rpc('generate_verification_code', {
                target_user_id: userId,
                code_purpose: 'delete_account'
            });

            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Error al generar código');

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                        email: data.email,
                        name: data.name,
                        code: data.code,
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error al enviar email');
            }

            setCodeSent(true);
            setError('');
        } catch (err) {
            console.error('Error al enviar código:', err);
            setError(err.message || 'Error al enviar código de verificación');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        setStep(3);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('Usuario no autenticado');

            const userId = user.id;

            if (isOAuthUser) {
                if (!verificationCode || verificationCode.length !== 6) {
                    setError('Ingresá el código de 6 dígitos');
                    setStep(2);
                    setLoading(false);
                    return;
                }

                const { data: verifyData, error: verifyError } = await supabase.rpc('verify_code', {
                    target_user_id: userId,
                    input_code: verificationCode,
                    code_purpose: 'delete_account'
                });

                if (verifyError) throw verifyError;
                if (!verifyData?.success) {
                    setError(verifyData?.error || 'Código inválido o expirado');
                    setStep(2);
                    setLoading(false);
                    return;
                }
            } else {
                if (!password) {
                    setError('Ingresá tu contraseña');
                    setStep(2);
                    setLoading(false);
                    return;
                }

                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: password,
                });

                if (signInError) {
                    setError('Contraseña incorrecta');
                    setStep(2);
                    setLoading(false);
                    return;
                }
            }

            const { data, error: deleteError } = await supabase.rpc(
                'delete_user_account_with_reason',
                {
                    target_user_id: userId,
                    reason: deletionReason.trim() || 'No especificado'
                }
            );

            if (deleteError) throw deleteError;
            if (!data?.success) throw new Error(data?.error || 'Error al eliminar cuenta');

            await supabase.auth.signOut();

            localStorage.setItem('account_deleted', 'true');
            window.location.href = '/';

        } catch (err) {
            console.error('Error al eliminar cuenta:', err);
            setError(err.message || 'Error al eliminar la cuenta');
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                {/* Step 1: Advertencia */}
                {step === 1 && (
                    <>
                        <div style={iconContainerStyle}>
                            <div style={dangerIconStyle}>
                                <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 48, color: '#ef4444' }} />
                            </div>
                        </div>
                        <h2 style={modalTitleStyle}>¿Eliminar tu cuenta?</h2>
                        <div style={warningBoxStyle}>
                            <p style={warningTextStyle}>
                                <strong>Esta acción es permanente e irreversible.</strong>
                            </p>
                            <p style={warningTextStyle}>Se eliminarán:</p>
                            <ul style={listStyle}>
                                <li>Todos tus apuntes subidos</li>
                                <li>Tus favoritos y guardados</li>
                                <li>Notificaciones e historial</li>
                                <li>Reseñas y comentarios</li>
                                <li>Solicitudes de mentoría</li>
                                <li>Información de perfil</li>
                                <li>Créditos y transacciones</li>
                            </ul>
                        </div>
                        <div style={buttonsContainerStyle}>
                            <button onClick={onClose} style={cancelButtonStyle}>
                                Cancelar
                            </button>
                            <button onClick={() => setStep(2)} style={dangerButtonStyle}>
                                Continuar
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: Confirmación */}
                {step === 2 && (
                    <>
                        <div style={iconContainerStyle}>
                            <div style={dangerIconStyle}>
                                <FontAwesomeIcon icon={faLock} style={{ fontSize: 48, color: '#ef4444' }} />
                            </div>
                        </div>
                        <h2 style={modalTitleStyle}>Confirmación final</h2>

                        {isOAuthUser ? (
                            <>
                                <p style={modalDescriptionStyle}>
                                    Para confirmar la eliminación, te enviamos un código de verificación a:
                                </p>
                                <div style={{
                                    background: '#f0f9ff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    textAlign: 'center',
                                    border: '2px solid #bae6fd'
                                }}>
                                    <strong style={{ color: '#0369a1', fontFamily: 'Inter, sans-serif' }}>{userEmail}</strong>
                                </div>

                                {!codeSent ? (
                                    <button
                                        onClick={handleSendCode}
                                        disabled={loading}
                                        style={{
                                            ...primaryButtonStyle,
                                            width: '100%',
                                            marginBottom: '16px',
                                            opacity: loading ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        {loading ? 'Enviando código...' : 'Enviar código'}
                                    </button>
                                ) : (
                                    <>
                                        <p style={{ ...modalDescriptionStyle, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <FontAwesomeIcon icon={faCheck} />
                                            Código enviado! Revisá tu email.
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Código de 6 dígitos"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            style={modalInputStyle}
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <p style={modalDescriptionStyle}>
                                    Para confirmar, ingresá tu contraseña:
                                </p>
                                <input
                                    type="password"
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={modalInputStyle}
                                    autoFocus
                                />
                            </>
                        )}

                        <div style={{ marginTop: 16, marginBottom: 12 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 13,
                                color: '#64748b',
                                fontWeight: 600,
                                marginBottom: 8,
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                ¿Por qué eliminás tu cuenta? (opcional)
                            </label>
                            <textarea
                                placeholder="Ej: No uso la plataforma, encontré otra alternativa, problemas técnicos..."
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                style={{
                                    ...modalInputStyle,
                                    minHeight: 80,
                                    resize: 'vertical',
                                    fontFamily: 'Inter, sans-serif',
                                    lineHeight: 1.5
                                }}
                                maxLength={500}
                            />
                            <div style={{
                                fontSize: 11,
                                color: '#94a3b8',
                                textAlign: 'right',
                                marginTop: 4,
                                fontFamily: 'Inter, sans-serif'
                            }}>
                                {deletionReason.length}/500
                            </div>
                        </div>

                        {error && <div style={errorStyle}>{error}</div>}

                        <div style={buttonsContainerStyle}>
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setError('');
                                    setPassword('');
                                    setVerificationCode('');
                                    setCodeSent(false);
                                }}
                                style={cancelButtonStyle}
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={loading || (isOAuthUser ? !codeSent || verificationCode.length !== 6 : !password)}
                                style={{
                                    ...dangerButtonStyle,
                                    opacity: (isOAuthUser ? !codeSent || verificationCode.length !== 6 : !password) ? 0.5 : 1,
                                    cursor: (isOAuthUser ? !codeSent || verificationCode.length !== 6 : !password) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading ? 'Eliminando...' : 'Eliminar cuenta'}
                            </button>
                        </div>
                    </>
                )}

                {/* Step 3: Procesando */}
                {step === 3 && (
                    <>
                        <div style={iconContainerStyle}>
                            <div style={loadingIconStyle}>
                                <FontAwesomeIcon icon={faHourglass} style={{ fontSize: 48, color: '#0095f6' }} />
                            </div>
                        </div>
                        <h2 style={modalTitleStyle}>Eliminando tu cuenta...</h2>
                        <p style={modalDescriptionStyle}>
                            Por favor esperá, estamos procesando tu solicitud.
                        </p>
                        <div style={spinnerStyle} />
                    </>
                )}
            </div>
        </div>
    );
}

function DataStat({ label, value, color }) {
    return (
        <div style={{
            padding: '12px',
            background: '#fff',
            borderRadius: 10,
            border: '2px solid #f1f5f9',
            textAlign: 'center',
            transition: 'all 0.2s ease',
        }}>
            <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: color,
                marginBottom: 4,
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Inter, sans-serif'
            }}>
                {value}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                {label}
            </div>
        </div>
    );
}

// ============================================
// TAB: NOTIFICACIONES
// ============================================
function NotificationsTab({ settings, toggleSetting, resetToDefault, notificationTypes }) {
    return (
        <>
            <Card title="Configuración General" icon={faCog} color="#0095f6">
                <div style={{ display: 'grid', gap: 10 }}>
                    <SettingToggle
                        label="Sonido"
                        description="Reproducir al recibir notificaciones"
                        checked={settings.sonido}
                        onChange={() => toggleSetting('sonido')}
                        color="#10b981"
                    />
                    <SettingToggle
                        label="Popups"
                        description="Mostrar notificaciones emergentes"
                        checked={settings.toasts}
                        onChange={() => toggleSetting('toasts')}
                        color="#0095f6"
                    />
                    <SettingToggle
                        label="Badge"
                        description="Mostrar contador en el header"
                        checked={settings.badge}
                        onChange={() => toggleSetting('badge')}
                        color="#8b5cf6"
                    />
                </div>
            </Card>

            <Card title="Tipos de Notificaciones" icon={faBell} color="#8b5cf6">
                <div style={{ display: 'grid', gap: 10 }}>
                    {notificationTypes.map(type => (
                        <SettingToggle
                            key={type.key}
                            label={type.label}
                            checked={settings[type.key]}
                            onChange={() => type.onClick ? type.onClick() : toggleSetting(type.key)}
                            color={type.color}
                        />
                    ))}
                </div>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={resetToDefault} style={resetButtonStyle}>
                    Restaurar valores predeterminados
                </button>
            </div>
        </>
    );
}

// ============================================
// TAB: PRIVACIDAD
// ============================================
function PrivacyTab({ navigate }) {
    const { settings, loading, saving, togglePerfilPublico, toggleMostrarEmail } = usePrivacySettings();
    const [saveMessage, setSaveMessage] = useState('');

    const handleToggle = async (toggleFunction, name) => {
        const success = await toggleFunction();
        setSaveMessage(success ? `${name} actualizado correctamente` : `Error al actualizar ${name}`);
        setTimeout(() => setSaveMessage(''), 2000);
    };

    if (loading) {
        return (
            <Card title="Privacidad" icon={faLock} color="#ef4444">
                <p style={{ color: '#64748b', textAlign: 'center', padding: 30, fontFamily: 'Inter, sans-serif' }}>Cargando configuración...</p>
            </Card>
        );
    }

    return (
        <>
            {saveMessage && (
                <MessageBanner
                    message={saveMessage}
                    type={saveMessage.includes('correctamente') ? 'success' : 'error'}
                />
            )}

            <Card title="Privacidad del Perfil" icon={faEye} color="#0095f6">
                <div style={{ display: 'grid', gap: 10 }}>
                    <SettingToggle
                        label="Perfil público"
                        description="Otros usuarios pueden ver tu perfil"
                        checked={settings.perfil_publico}
                        onChange={() => handleToggle(togglePerfilPublico, 'Perfil')}
                        color="#0095f6"
                        disabled={saving}
                    />
                    <SettingToggle
                        label="Mostrar email"
                        description="Tu email será visible en tu perfil"
                        checked={settings.mostrar_email}
                        onChange={() => handleToggle(toggleMostrarEmail, 'Email')}
                        color="#8b5cf6"
                        disabled={saving}
                    />
                </div>
            </Card>

            <Card title="Políticas y Términos" icon={faFileAlt} color="#64748b">
                <ActionButton onClick={() => navigate('/privacy')} label="Política de Privacidad" />
                <ActionButton onClick={() => navigate('/terms')} label="Términos y Condiciones" />
            </Card>
        </>
    );
}

// ============================================
// TAB: APARIENCIA
// ============================================
function AppearanceTab() {
    const [theme, setTheme] = useState('light');
    const [idioma, setIdioma] = useState('es');
    const [compactMode, setCompactMode] = useState(false);

    return (
        <>
            <Card title="Tema Visual" icon={faPalette} color="#f59e0b">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <ThemeCard
                        label="Modo Claro"
                        active={theme === 'light'}
                        onClick={() => setTheme('light')}
                        gradient="linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)"
                    />
                    <ThemeCard
                        label="Modo Oscuro"
                        active={theme === 'dark'}
                        onClick={() => alert('Próximamente disponible')}
                        disabled
                        gradient="linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
                    />
                </div>
            </Card>

            <Card title="Idioma" icon={faGlobe} color="#06b6d4">
                <select value={idioma} onChange={(e) => setIdioma(e.target.value)} style={selectStyle}>
                    <option value="es">Español (Uruguay)</option>
                    <option value="en" disabled>English (Coming soon)</option>
                    <option value="pt" disabled>Português (Em breve)</option>
                </select>
            </Card>

            <Card title="Visualización" icon={faMobileAlt} color="#8b5cf6">
                <SettingToggle
                    label="Modo compacto"
                    description="Reduce el espaciado de los elementos"
                    checked={compactMode}
                    onChange={() => setCompactMode(!compactMode)}
                    color="#8b5cf6"
                />
            </Card>
        </>
    );
}

// ============================================
// COMPONENTES REUTILIZABLES
// ============================================
function Card({ title, icon, color, children }) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #f1f5f9',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '2px solid #f1f5f9',
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <FontAwesomeIcon icon={icon} style={{ fontSize: 16, color: color }} />
                </div>
                <h2 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0f172a',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    {title}
                </h2>
            </div>
            {children}
        </div>
    );
}

function SettingToggle({ label, description, checked, onChange, color, disabled = false }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 10,
            background: checked ? `${color}08` : '#f8fafc',
            border: `2px solid ${checked ? `${color}30` : '#f1f5f9'}`,
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#0f172a',
                    lineHeight: 1.3,
                    marginBottom: description ? 4 : 0,
                    fontFamily: 'Inter, sans-serif'
                }}>
                    {label}
                </div>
                {description && (
                    <div style={{
                        fontSize: 12,
                        color: '#64748b',
                        lineHeight: 1.3,
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        {description}
                    </div>
                )}
            </div>

            <button
                onClick={onChange}
                disabled={disabled}
                style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    background: checked
                        ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
                        : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: checked ? `0 2px 8px ${color}40` : 'none',
                }}
            >
                <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 4,
                    left: checked ? 24 : 4,
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );
}

function ActionButton({ onClick, label, disabled, danger }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: danger ? '#ef4444' : '#0095f6',
                background: '#fff',
                border: `2px solid ${danger ? '#fee2e2' : '#e0f2fe'}`,
                borderRadius: 10,
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                marginBottom: 8,
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif'
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.target.style.background = danger ? '#fef2f2' : '#f0f9ff';
                    e.target.style.transform = 'translateX(4px)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.target.style.background = '#fff';
                    e.target.style.transform = 'translateX(0)';
                }
            }}
        >
            {label} →
        </button>
    );
}

function ThemeCard({ label, active, onClick, disabled, gradient }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: 20,
                borderRadius: 12,
                border: `3px solid ${active ? '#0095f6' : '#e5e7eb'}`,
                background: gradient,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                if (!disabled && !active) {
                    e.target.style.transform = 'scale(1.02)';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.target.style.transform = 'scale(1)';
                }
            }}
        >
            <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: active ? '#0095f6' : '#64748b',
                marginBottom: 4,
                fontFamily: 'Inter, sans-serif'
            }}>
                {label}
            </div>
            {disabled && (
                <div style={{
                    fontSize: 11,
                    color: '#94a3b8',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    Próximamente
                </div>
            )}
            {active && (
                <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#0095f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                }}>
                    <FontAwesomeIcon icon={faCheck} style={{ fontSize: 12 }} />
                </div>
            )}
        </button>
    );
}

function MessageBanner({ message, type }) {
    return (
        <div style={{
            padding: '10px 14px',
            marginBottom: 12,
            borderRadius: 10,
            background: type === 'success' ? '#d1fae5' : '#fee2e2',
            color: type === 'success' ? '#065f46' : '#991b1b',
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'center',
            border: `2px solid ${type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            fontFamily: 'Inter, sans-serif'
        }}>
            {message}
        </div>
    );
}

// ============================================
// ESTILOS
// ============================================
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '30px 16px',
    fontFamily: 'Inter, sans-serif'
};

const containerStyle = {
    maxWidth: 800,
    margin: '0 auto',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: 28,
};

const backButtonStyle = {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
    marginBottom: 16,
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
};

const titleStyle = {
    fontSize: 28,
    fontWeight: 800,
    color: '#0b1e3a',
    margin: '0 0 8px 0',
    fontFamily: 'Inter, sans-serif'
};

const subtitleStyle = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    fontFamily: 'Inter, sans-serif'
};

const tabsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 10,
    marginBottom: 28,
    background: '#fff',
    padding: 10,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
};

const tabButtonStyle = {
    padding: '12px 14px',
    border: '2px solid',
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const contentStyle = {
    animation: 'fadeIn 0.3s ease-out',
};

const primaryButtonStyle = {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #0095f6 0%, #0077d4 100%)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const secondaryButtonStyle = {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const resetButtonStyle = {
    padding: '10px 24px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const selectStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 13,
    color: '#0f172a',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 13,
    color: '#0f172a',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    marginBottom: 10,
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const descriptionStyle = {
    color: '#64748b',
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 1.5,
    fontFamily: 'Inter, sans-serif'
};

const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
    marginBottom: 16,
    padding: 12,
    background: '#f8fafc',
    borderRadius: 10,
    border: '2px solid #f1f5f9',
};

// ============================================
// ESTILOS DEL MODAL
// ============================================
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 9999,
    padding: 16,
    animation: 'fadeIn 0.2s ease',
};

const modalStyle = {
    background: '#fff',
    borderRadius: 16,
    padding: 32,
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: 'Inter, sans-serif'
};

const iconContainerStyle = {
    textAlign: 'center',
    marginBottom: 20,
};

const dangerIconStyle = {
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
};

const loadingIconStyle = {
    display: 'inline-block',
    animation: 'spin 2s linear infinite',
};

const modalTitleStyle = {
    fontSize: 24,
    fontWeight: 800,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter, sans-serif'
};

const modalDescriptionStyle = {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.5,
    fontFamily: 'Inter, sans-serif'
};

const warningBoxStyle = {
    background: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
};

const warningTextStyle = {
    fontSize: 13,
    color: '#991b1b',
    marginBottom: 8,
    lineHeight: 1.5,
    fontFamily: 'Inter, sans-serif'
};

const listStyle = {
    fontSize: 13,
    color: '#991b1b',
    paddingLeft: 20,
    margin: '8px 0 0 0',
    fontFamily: 'Inter, sans-serif'
};

const modalInputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    fontWeight: 500,
    color: '#0f172a',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    marginBottom: 12,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const errorStyle = {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 12,
    textAlign: 'center',
    border: '2px solid #fca5a5',
    fontFamily: 'Inter, sans-serif'
};

const buttonsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 24,
};

const cancelButtonStyle = {
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const dangerButtonStyle = {
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    fontFamily: 'Inter, sans-serif'
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '4px solid #f1f5f9',
    borderTop: '4px solid #ef4444',
    borderRadius: '50%',
    margin: '20px auto',
    animation: 'spin 1s linear infinite',
};

// Animaciones
if (typeof document !== 'undefined' && !document.getElementById('settings-animations')) {
    const style = document.createElement('style');
    style.id = 'settings-animations';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #0095f6 !important;
            box-shadow: 0 0 0 3px rgba(0, 149, 246, 0.1);
        }
    `;
    document.head.appendChild(style);
}