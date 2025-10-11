// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { downloadUserData, getUserDataSummary } from '../utils/exportUserData';
import { supabase } from '../supabase';

const TAB_STORAGE_KEY = 'kerana_settings_active_tab';

export default function Settings() {
    // Recuperar tab activo desde localStorage
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(TAB_STORAGE_KEY) || 'account';
    });
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();

    const {
        settings,
        toggleSetting,
        resetToDefault,
    } = useNotificationSettings();

    // Persistir tab activo
    useEffect(() => {
        localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    const tabs = [
        { id: 'account', label: 'Cuenta', icon: '👤' },
        { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
        { id: 'privacy', label: 'Privacidad', icon: '🔒' },
        { id: 'appearance', label: 'Apariencia', icon: '🎨' },
    ];

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const notificationTypes = [
        { key: 'nuevo_seguidor', label: 'Nuevos seguidores', icon: '👤' },
        { key: 'solicitud_aceptada', label: 'Solicitudes aceptadas', icon: '✅' },
        { key: 'nuevo_comentario', label: 'Comentarios en mis apuntes', icon: '💬' },
        { key: 'nuevo_like', label: 'Likes en mis apuntes', icon: '❤️' },
        { key: 'nueva_resenia', label: 'Nuevas reseñas', icon: '⭐' },
        { key: 'mentor_acepto', label: 'Mentores aceptaron', icon: '🎓' },
        { key: 'nuevo_apunte', label: 'Nuevos apuntes', icon: '📄' },
        { key: 'apunte_aprobado', label: 'Apuntes aprobados', icon: '✔️' },
        { key: 'mentor_aprobado', label: 'Mentor aprobado', icon: '🏆' },
        { key: 'system', label: 'Sistema', icon: '⚙️' },
        { key: 'update', label: 'Actualizaciones', icon: '🆕' },
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
                        ← Volver
                    </button>
                    <h1 style={titleStyle}>Configuración</h1>
                    <p style={subtitleStyle}>
                        Personalizá tu experiencia en Kerana
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div style={tabsContainerStyle}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                ...tabButtonStyle,
                                background: activeTab === tab.id ? '#2563eb' : '#fff',
                                color: activeTab === tab.id ? '#fff' : '#64748b',
                                borderColor: activeTab === tab.id ? '#2563eb' : '#e5e7eb',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{tab.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={contentStyle}>
                    {activeTab === 'account' && (
                        <AccountTab navigate={navigate} />
                    )}

                    {activeTab === 'notifications' && (
                        <NotificationsTab
                            settings={settings}
                            toggleSetting={toggleSetting}
                            resetToDefault={resetToDefault}
                            notificationTypes={notificationTypes}
                            saved={saved}
                            onSave={handleSave}
                        />
                    )}

                    {activeTab === 'privacy' && (
                        <PrivacyTab navigate={navigate} />
                    )}

                    {activeTab === 'appearance' && (
                        <AppearanceTab />
                    )}
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
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage('❌ Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 6) {
            setMessage('❌ La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage('✅ Contraseña actualizada correctamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setChangePasswordOpen(false);
                setMessage('');
            }, 2000);
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card title="Información de la Cuenta">
                <p style={{ color: '#64748b', marginBottom: 16, fontSize: 14 }}>
                    Administrá tu información personal y preferencias de cuenta.
                </p>
                <button
                    onClick={() => navigate('/profile')}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    👤 Ver mi perfil →
                </button>
                <button
                    onClick={() => navigate('/edit-profile')}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    ✏️ Editar perfil →
                </button>
            </Card>

            <Card title="Seguridad">
                <p style={{ color: '#64748b', marginBottom: 16, fontSize: 14 }}>
                    Protegé tu cuenta con opciones de seguridad adicionales.
                </p>

                {!changePasswordOpen ? (
                    <button
                        onClick={() => setChangePasswordOpen(true)}
                        style={linkButtonStyle}
                        onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                        🔑 Cambiar contraseña →
                    </button>
                ) : (
                    <div style={{ marginTop: 16 }}>
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
                            <p style={{ fontSize: 13, margin: '8px 0', color: message.includes('✅') ? '#10b981' : '#ef4444' }}>
                                {message}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                style={{
                                    ...primaryButtonStyle,
                                    flex: 1,
                                    opacity: loading ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => !loading && (e.target.style.background = '#1d4ed8')}
                                onMouseLeave={(e) => !loading && (e.target.style.background = '#2563eb')}
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
                                style={{
                                    ...secondaryButtonStyle,
                                    flex: 1,
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </>
    );
}

// ============================================
// TAB: NOTIFICACIONES
// ============================================
function NotificationsTab({ settings, toggleSetting, resetToDefault, notificationTypes, saved, onSave }) {
    return (
        <>
            {/* Configuraciones generales */}
            <Card title="Configuraciones Generales">
                <div style={{ display: 'grid', gap: 10 }}>
                    <SettingToggle
                        label="Sonido"
                        description="Reproducir sonido al recibir notificaciones"
                        checked={settings.sonido}
                        onChange={() => toggleSetting('sonido')}
                        icon="🔊"
                    />
                    <SettingToggle
                        label="Popups"
                        description="Mostrar notificaciones emergentes"
                        checked={settings.toasts}
                        onChange={() => toggleSetting('toasts')}
                        icon="💬"
                    />
                    <SettingToggle
                        label="Badge"
                        description="Contador en el header"
                        checked={settings.badge}
                        onChange={() => toggleSetting('badge')}
                        icon="🔔"
                    />
                </div>
            </Card>

            {/* Tipos de notificaciones */}
            <Card title="Tipos de Notificaciones">
                <div style={{ display: 'grid', gap: 10 }}>
                    {notificationTypes.map(type => (
                        <SettingToggle
                            key={type.key}
                            label={type.label}
                            checked={settings[type.key]}
                            onChange={() => toggleSetting(type.key)}
                            icon={type.icon}
                        />
                    ))}
                </div>
            </Card>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                    onClick={onSave}
                    style={primaryButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.target.style.background = '#2563eb'}
                >
                    {saved ? '✓ Guardado' : 'Guardar cambios'}
                </button>
                <button
                    onClick={resetToDefault}
                    style={secondaryButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    Restaurar
                </button>
            </div>
        </>
    );
}

// ============================================
// TAB: PRIVACIDAD
// ============================================
function PrivacyTab({ navigate }) {
    const {
        settings,
        loading,
        saving,
        togglePerfilPublico,
        toggleMostrarEmail,
        togglePermitirMensajes
    } = usePrivacySettings();

    const [saveMessage, setSaveMessage] = useState('');

    const handleToggle = async (toggleFunction, settingName) => {
        const success = await toggleFunction();
        if (success) {
            setSaveMessage(`✅ ${settingName} actualizado`);
            setTimeout(() => setSaveMessage(''), 2000);
        } else {
            setSaveMessage(`❌ Error actualizando ${settingName}`);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    if (loading) {
        return (
            <Card title="Privacidad del Perfil">
                <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>
                    Cargando configuración...
                </p>
            </Card>
        );
    }

    return (
        <>
            {saveMessage && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: 16,
                    borderRadius: 8,
                    background: saveMessage.includes('✅') ? '#d1fae5' : '#fee2e2',
                    color: saveMessage.includes('✅') ? '#065f46' : '#991b1b',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    {saveMessage}
                </div>
            )}

            <Card title="Privacidad del Perfil">
                <div style={{ display: 'grid', gap: 10 }}>
                    <SettingToggle
                        label="Perfil público"
                        description="Otros usuarios pueden ver tu perfil"
                        checked={settings.perfil_publico}
                        onChange={() => handleToggle(togglePerfilPublico, 'Perfil público')}
                        icon="👁️"
                        disabled={saving}
                    />
                    <SettingToggle
                        label="Mostrar email"
                        description="Email visible en tu perfil"
                        checked={settings.mostrar_email}
                        onChange={() => handleToggle(toggleMostrarEmail, 'Mostrar email')}
                        icon="📧"
                        disabled={saving}
                    />
                    <SettingToggle
                        label="Mensajes directos"
                        description="Permitir que te contacten"
                        checked={settings.permitir_mensajes}
                        onChange={() => handleToggle(togglePermitirMensajes, 'Mensajes directos')}
                        icon="💬"
                        disabled={saving}
                    />
                </div>
            </Card>

            <Card title="Políticas y Términos">
                <button
                    onClick={() => navigate('/privacy')}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    🔐 Política de privacidad →
                </button>
                <button
                    onClick={() => navigate('/terms')}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    📄 Términos y condiciones →
                </button>
            </Card>

            <Card title="Gestión de Datos">
                <DataManagementSection />
            </Card>
        </>
    );
}

// ============================================
// SECCIÓN: GESTIÓN DE DATOS
// ============================================
function DataManagementSection() {
    const [summary, setSummary] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState('');

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

            if (success) {
                setMessage('✅ Datos descargados correctamente');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Error al descargar los datos');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('❌ Error al descargar los datos');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <p style={{ color: '#64748b', marginBottom: 16, fontSize: 13 }}>
                Descargá una copia de todos tus datos en Kerana en formato JSON.
            </p>

            {/* Resumen de datos */}
            {summary && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    marginBottom: 16,
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                }}>
                    <DataStat label="Notificaciones" value={summary.notificaciones} />
                    <DataStat label="Apuntes" value={summary.apuntes} />
                    <DataStat label="Favoritos" value={summary.favoritos} />
                    <DataStat label="Reseñas" value={summary.reseñas} />
                </div>
            )}

            {message && (
                <div style={{
                    padding: '10px 14px',
                    marginBottom: 12,
                    borderRadius: 8,
                    background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
                    color: message.includes('✅') ? '#065f46' : '#991b1b',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    {message}
                </div>
            )}

            <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                    ...linkButtonStyle,
                    opacity: downloading ? 0.6 : 1,
                    cursor: downloading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => !downloading && (e.target.style.background = '#eff6ff')}
                onMouseLeave={(e) => e.target.style.background = '#fff'}
            >
                📥 {downloading ? 'Descargando...' : 'Descargar mis datos'} →
            </button>

            <button
                onClick={() => alert('Contactá a soporte@kerana.com para eliminar tu cuenta')}
                style={{...linkButtonStyle, color: '#ef4444', marginTop: 8}}
                onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.background = '#fff'}
            >
                🗑️ Eliminar cuenta →
            </button>
        </>
    );
}

function DataStat({ label, value }) {
    return (
        <div style={{
            padding: '8px 10px',
            background: '#fff',
            borderRadius: 6,
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#2563eb',
                marginBottom: 2,
            }}>
                {value}
            </div>
            <div style={{
                fontSize: 11,
                color: '#64748b',
                fontWeight: 600,
            }}>
                {label}
            </div>
        </div>
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
            <Card title="Tema">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <ThemeCard
                        icon="☀️"
                        label="Claro"
                        active={theme === 'light'}
                        onClick={() => setTheme('light')}
                    />
                    <ThemeCard
                        icon="🌙"
                        label="Oscuro"
                        active={theme === 'dark'}
                        onClick={() => alert('Modo oscuro próximamente')}
                        disabled
                    />
                </div>
            </Card>

            <Card title="Idioma">
                <select
                    value={idioma}
                    onChange={(e) => setIdioma(e.target.value)}
                    style={selectStyle}
                >
                    <option value="es">🇺🇾 Español</option>
                    <option value="en" disabled>🇺🇸 English (Próximamente)</option>
                    <option value="pt" disabled>🇧🇷 Português (Próximamente)</option>
                </select>
            </Card>

            <Card title="Visualización">
                <SettingToggle
                    label="Modo compacto"
                    description="Reduce el espaciado"
                    checked={compactMode}
                    onChange={() => setCompactMode(!compactMode)}
                    icon="📏"
                />
            </Card>
        </>
    );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================
function Card({ title, children }) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: 20,
            marginBottom: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
            <h2 style={{
                margin: '0 0 16px 0',
                fontSize: 16,
                fontWeight: 700,
                color: '#0f172a',
            }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

function SettingToggle({ label, description, checked, onChange, icon, disabled = false }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: checked ? '#eff6ff' : '#f8fafc',
            transition: 'background 0.2s ease',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'default',
            minHeight: 48,
        }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#0f172a',
                        lineHeight: 1.3,
                    }}>
                        {label}
                    </div>
                    {description && (
                        <div style={{
                            fontSize: 11,
                            color: '#94a3b8',
                            lineHeight: 1.3,
                            marginTop: 2,
                        }}>
                            {description}
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle switch */}
            <button
                onClick={onChange}
                disabled={disabled}
                style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: checked ? '#2563eb' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: checked ? 23 : 3,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );
}

function ThemeCard({ icon, label, active, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: 16,
                borderRadius: 10,
                border: `2px solid ${active ? '#2563eb' : '#e5e7eb'}`,
                background: active ? '#f0f9ff' : '#fff',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
                if (!disabled) e.target.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
                if (!disabled && !active) e.target.style.borderColor = '#e5e7eb';
            }}
        >
            <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
            <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: active ? '#2563eb' : '#64748b'
            }}>
                {label}
            </div>
            {disabled && (
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                    Próximamente
                </div>
            )}
        </button>
    );
}

// ============================================
// ESTILOS
// ============================================
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '30px 16px',
};

const containerStyle = {
    maxWidth: 800,
    margin: '0 auto',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: 24,
};

const backButtonStyle = {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 12,
};

const titleStyle = {
    fontSize: 28,
    fontWeight: 800,
    color: '#0b1e3a',
    margin: '0 0 6px 0',
};

const subtitleStyle = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
};

const tabsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 10,
    marginBottom: 24,
    background: '#fff',
    padding: 10,
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const tabButtonStyle = {
    padding: '10px 12px',
    border: '2px solid',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
};

const contentStyle = {
    animation: 'fadeIn 0.3s ease-out',
};

const primaryButtonStyle = {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const secondaryButtonStyle = {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const linkButtonStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#2563eb',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    marginBottom: 8,
};

const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 13,
    color: '#0f172a',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
};

const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 13,
    color: '#0f172a',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    marginBottom: 10,
    boxSizing: 'border-box',
};

// Animación
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
  `;
    document.head.appendChild(style);
}