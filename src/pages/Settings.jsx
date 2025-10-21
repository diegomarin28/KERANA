import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { downloadUserData, getUserDataSummary } from '../utils/exportUserData';
import { supabase } from '../supabase';

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
        { id: 'account', label: 'Cuenta' },
        { id: 'notifications', label: 'Notificaciones' },
        { id: 'privacy', label: 'Privacidad' },
        { id: 'appearance', label: 'Apariencia' },
    ];

    const notificationTypes = [
        { key: 'nuevo_seguidor', label: 'Nuevos seguidores', color: '#0095f6' },
        { key: 'solicitud_aceptada', label: 'Solicitudes aceptadas', color: '#10b981' },
        { key: 'nuevo_comentario', label: 'Comentarios', color: '#8b5cf6' },
        { key: 'nuevo_like', label: 'Likes', color: '#ef4444' },
        { key: 'nueva_resenia', label: 'Reseñas', color: '#f59e0b' },
        { key: 'mentor_acepto', label: 'Mentores', color: '#06b6d4' },
        { key: 'nuevo_apunte', label: 'Nuevos apuntes', color: '#3b82f6' },
        { key: 'apunte_aprobado', label: 'Aprobados', color: '#22c55e' },
        { key: 'mentor_aprobado', label: 'Mentor', color: '#a855f7' },
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
                        ← Volver
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
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
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
            <Card title="Información de Cuenta" icon="👤" color="#0095f6">
                <p style={descriptionStyle}>
                    Administrá tu información personal
                </p>
                <ActionButton onClick={() => navigate('/profile')} label="Mi perfil" />
                <ActionButton onClick={() => navigate('/edit-profile')} label="Editar perfil" />
            </Card>

            <Card title="Seguridad" icon="🔒" color="#ef4444">
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

            <Card title="Gestión de Datos" icon="📊" color="#8b5cf6">
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
                onClick={() => window.open('mailto:soporte@kerana.com?subject=Solicitud de eliminación de cuenta')}
                label="Eliminar cuenta"
                danger
            />
        </>
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
            }}>
                {value}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
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
            <Card title="Configuración General" icon="⚙️" color="#0095f6">
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
                    <SettingToggle
                        label="Email"
                        description="Próximamente disponible"
                        checked={settings.email}
                        onChange={() => toggleSetting('email')}
                        color="#64748b"
                        disabled
                    />
                </div>
            </Card>

            <Card title="Tipos de Notificaciones" icon="🔔" color="#8b5cf6">
                <div style={{ display: 'grid', gap: 10 }}>
                    {notificationTypes.map(type => (
                        <SettingToggle
                            key={type.key}
                            label={type.label}
                            checked={settings[type.key]}
                            onChange={() => toggleSetting(type.key)}
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
    const { settings, loading, saving, togglePerfilPublico, toggleMostrarEmail, togglePermitirMensajes } = usePrivacySettings();
    const [saveMessage, setSaveMessage] = useState('');

    const handleToggle = async (toggleFunction, name) => {
        const success = await toggleFunction();
        setSaveMessage(success ? `${name} actualizado correctamente` : `Error al actualizar ${name}`);
        setTimeout(() => setSaveMessage(''), 2000);
    };

    if (loading) {
        return (
            <Card title="Privacidad" icon="🔒" color="#ef4444">
                <p style={{ color: '#64748b', textAlign: 'center', padding: 30 }}>Cargando configuración...</p>
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

            <Card title="Privacidad del Perfil" icon="👁️" color="#0095f6">
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
                    <SettingToggle
                        label="Permitir mensajes"
                        description="Otros pueden enviarte mensajes"
                        checked={settings.permitir_mensajes}
                        onChange={() => handleToggle(togglePermitirMensajes, 'Mensajes')}
                        color="#10b981"
                        disabled={saving}
                    />
                </div>
            </Card>

            <Card title="Políticas y Términos" icon="📄" color="#64748b">
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
            <Card title="Tema Visual" icon="🎨" color="#f59e0b">
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

            <Card title="Idioma" icon="🌍" color="#06b6d4">
                <select value={idioma} onChange={(e) => setIdioma(e.target.value)} style={selectStyle}>
                    <option value="es">Español (Uruguay)</option>
                    <option value="en" disabled>English (Coming soon)</option>
                    <option value="pt" disabled>Português (Em breve)</option>
                </select>
            </Card>

            <Card title="Visualización" icon="📱" color="#8b5cf6">
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
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 16,
                }}>
                    {icon}
                </div>
                <h2 style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0f172a',
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
                }}>
                    {label}
                </div>
                {description && (
                    <div style={{
                        fontSize: 12,
                        color: '#64748b',
                        lineHeight: 1.3,
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
            }}>
                {label}
            </div>
            {disabled && (
                <div style={{
                    fontSize: 11,
                    color: '#94a3b8',
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
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                }}>
                    ✓
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
};

const titleStyle = {
    fontSize: 28,
    fontWeight: 800,
    color: '#0b1e3a',
    margin: '0 0 8px 0',
};

const subtitleStyle = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
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
};

const descriptionStyle = {
    color: '#64748b',
    marginBottom: 16,
    fontSize: 13,
    lineHeight: 1.5,
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
        
        input:focus, select:focus {
            outline: none;
            border-color: #0095f6 !important;
            box-shadow: 0 0 0 3px rgba(0, 149, 246, 0.1);
        }
    `;
    document.head.appendChild(style);
}