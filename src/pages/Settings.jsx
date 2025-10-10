// src/pages/Settings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('notifications');
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();

    const {
        settings,
        toggleSetting,
        resetToDefault,
        saveSettings
    } = useNotificationSettings();

    const tabs = [
        { id: 'notifications', label: '🔔 Notificaciones', icon: '🔔' },
        { id: 'account', label: '👤 Cuenta', icon: '👤' },
        { id: 'privacy', label: '🔒 Privacidad', icon: '🔒' },
        { id: 'appearance', label: '🎨 Apariencia', icon: '🎨' },
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
        { key: 'nuevo_apunte', label: 'Nuevos apuntes en materias', icon: '📄' },
        { key: 'apunte_aprobado', label: 'Mis apuntes aprobados', icon: '✔️' },
        { key: 'mentor_aprobado', label: 'Aplicación de mentor aprobada', icon: '🏆' },
        { key: 'system', label: 'Notificaciones del sistema', icon: '⚙️' },
        { key: 'update', label: 'Actualizaciones de Kerana', icon: '🆕' },
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
                    <h1 style={titleStyle}>⚙️ Configuración</h1>
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
                            <span style={{ fontSize: 18 }}>{tab.icon}</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>
                                {tab.label.split(' ')[1]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={contentStyle}>
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

                    {activeTab === 'account' && (
                        <AccountTab navigate={navigate} />
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
// TAB: NOTIFICACIONES
// ============================================
function NotificationsTab({ settings, toggleSetting, resetToDefault, notificationTypes, saved, onSave }) {
    return (
        <>
            {/* Configuraciones generales */}
            <Card title="Configuraciones Generales">
                <div style={{ display: 'grid', gap: 16 }}>
                    <SettingToggle
                        label="Sonido"
                        description="Reproducir sonido cuando llega una notificación"
                        checked={settings.sonido}
                        onChange={() => toggleSetting('sonido')}
                        icon="🔊"
                    />

                    <SettingToggle
                        label="Toast (Popups)"
                        description="Mostrar notificaciones emergentes en la pantalla"
                        checked={settings.toasts}
                        onChange={() => toggleSetting('toasts')}
                        icon="💬"
                    />

                    <SettingToggle
                        label="Badge en header"
                        description="Mostrar contador de notificaciones en el header"
                        checked={settings.badge}
                        onChange={() => toggleSetting('badge')}
                        icon="🔔"
                    />

                    <SettingToggle
                        label="Email (Próximamente)"
                        description="Recibir resumen diario por email"
                        checked={settings.email}
                        onChange={() => toggleSetting('email')}
                        icon="📧"
                        disabled={true}
                    />
                </div>
            </Card>

            {/* Tipos de notificaciones */}
            <Card title="Tipos de Notificaciones">
                <div style={{ display: 'grid', gap: 16 }}>
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
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
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
                    Restaurar por defecto
                </button>
            </div>
        </>
    );
}

// ============================================
// TAB: CUENTA
// ============================================
function AccountTab({ navigate }) {
    return (
        <>
            <Card title="Información de la Cuenta">
                <p style={{ color: '#64748b', marginBottom: 16 }}>
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
                <p style={{ color: '#64748b', marginBottom: 16 }}>
                    Protegé tu cuenta con opciones de seguridad adicionales.
                </p>
                <button
                    onClick={() => alert('Función próximamente')}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    🔑 Cambiar contraseña →
                </button>
            </Card>
        </>
    );
}

// ============================================
// TAB: PRIVACIDAD
// ============================================
function PrivacyTab({ navigate }) {
    const [perfilPublico, setPerfilPublico] = useState(true);
    const [mostrarEmail, setMostrarEmail] = useState(false);
    const [permitirMensajes, setPermitirMensajes] = useState(true);

    return (
        <>
            <Card title="Privacidad del Perfil">
                <div style={{ display: 'grid', gap: 16 }}>
                    <SettingToggle
                        label="Perfil público"
                        description="Permitir que otros usuarios vean tu perfil"
                        checked={perfilPublico}
                        onChange={() => setPerfilPublico(!perfilPublico)}
                        icon="👁️"
                    />

                    <SettingToggle
                        label="Mostrar email"
                        description="Tu email será visible en tu perfil público"
                        checked={mostrarEmail}
                        onChange={() => setMostrarEmail(!mostrarEmail)}
                        icon="📧"
                    />

                    <SettingToggle
                        label="Permitir mensajes directos"
                        description="Otros usuarios pueden enviarte mensajes"
                        checked={permitirMensajes}
                        onChange={() => setPermitirMensajes(!permitirMensajes)}
                        icon="💬"
                    />
                </div>
            </Card>

            <Card title="Políticas y Términos">
                <p style={{ color: '#64748b', marginBottom: 16 }}>
                    Revisá nuestras políticas de privacidad y términos de uso.
                </p>
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
                <p style={{ color: '#64748b', marginBottom: 16 }}>
                    Controlá tus datos personales.
                </p>
                <button
                    onClick={() => alert('Función próximamente')}
                    style={linkButtonStyle}
                    onMouseEnter={(e) => e.target.style.background = '#fff5f5'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    📥 Descargar mis datos →
                </button>
                <button
                    onClick={() => alert('Contactá a soporte para eliminar tu cuenta')}
                    style={{...linkButtonStyle, color: '#ef4444'}}
                    onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                    🗑️ Eliminar cuenta →
                </button>
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
            <Card title="Tema">
                <div style={{ display: 'grid', gap: 16 }}>
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
                </div>
            </Card>

            <Card title="Idioma">
                <p style={{ color: '#64748b', marginBottom: 16 }}>
                    Seleccioná tu idioma preferido.
                </p>
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
                <div style={{ display: 'grid', gap: 16 }}>
                    <SettingToggle
                        label="Modo compacto"
                        description="Reduce el espaciado para mostrar más contenido"
                        checked={compactMode}
                        onChange={() => setCompactMode(!compactMode)}
                        icon="📏"
                    />
                </div>
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
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
            <h2 style={{
                margin: '0 0 20px 0',
                fontSize: 18,
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
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: 12,
            borderRadius: 8,
            background: checked ? '#f0f9ff' : '#f8fafc',
            transition: 'background 0.2s ease',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'default',
        }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <div>
                    <div style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#0f172a',
                        marginBottom: description ? 4 : 0
                    }}>
                        {label}
                    </div>
                    {description && (
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
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
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    background: checked ? '#2563eb' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: checked ? 23 : 3,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                padding: 20,
                borderRadius: 12,
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
            <div style={{ fontSize: 40, marginBottom: 8 }}>{icon}</div>
            <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: active ? '#2563eb' : '#64748b'
            }}>
                {label}
            </div>
            {disabled && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
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
    padding: '40px 16px',
};

const containerStyle = {
    maxWidth: 900,
    margin: '0 auto',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: 32,
};

const backButtonStyle = {
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 16,
};

const titleStyle = {
    fontSize: 32,
    fontWeight: 800,
    color: '#0b1e3a',
    margin: '0 0 8px 0',
};

const subtitleStyle = {
    fontSize: 16,
    color: '#64748b',
    margin: 0,
};

const tabsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    marginBottom: 32,
    background: '#fff',
    padding: 12,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const tabButtonStyle = {
    padding: '12px 16px',
    border: '2px solid',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
};

const contentStyle = {
    animation: 'fadeIn 0.3s ease-out',
};

const primaryButtonStyle = {
    padding: '12px 32px',
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    background: '#2563eb',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const secondaryButtonStyle = {
    padding: '12px 32px',
    fontSize: 15,
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
    padding: '12px 16px',
    fontSize: 14,
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
    padding: '12px 16px',
    fontSize: 14,
    color: '#0f172a',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
};

// Agregar animación fadeIn
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