import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

const SETTINGS_KEY = 'kerana_notification_settings';

const DEFAULT_SETTINGS = {
    // Tipos de notificaciones
    nuevo_seguidor: true,
    solicitud_aceptada: true,
    nuevo_comentario: true,
    nuevo_like: true,
    nueva_resenia: true,
    mentor_acepto: true,
    nuevo_apunte: true,
    apunte_aprobado: true,
    mentor_aprobado: true,
    system: true,
    update: true,

    // Configuraciones generales
    sonido: true,
    toasts: true,
    badge: true,
};

export default function NotificationSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Error cargando configuración:', e);
        }
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error('Error guardando configuración:', e);
        }
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const notificationTypes = [
        { key: 'nuevo_seguidor', label: 'Nuevos seguidores', icon: '👤' },
        { key: 'solicitud_aceptada', label: 'Solicitudes aceptadas', icon: '✅' },
        { key: 'nuevo_comentario', label: 'Comentarios en mis apuntes', icon: '💬' },
        { key: 'nuevo_like', label: 'Likes en mis apuntes', icon: '❤️' },
        { key: 'nueva_resenia', label: 'Nuevas reseñas', icon: '⭐' },
        { key: 'mentor_acepto', label: 'Mentores aceptaron', icon: '🎓' },
        { key: 'nuevo_apunte', label: 'Nuevos apuntes en materias', icon: '📝' },
        { key: 'apunte_aprobado', label: 'Mis apuntes aprobados', icon: '✔️' },
        { key: 'mentor_aprobado', label: 'Aplicación de mentor aprobada', icon: '🏆' },
        { key: 'system', label: 'Notificaciones del sistema', icon: '⚙️' },
        { key: 'update', label: 'Actualizaciones de Kerana', icon: '🆕' },
    ];

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                {/* Header */}
                <div style={headerStyle}>
                    <h1 style={titleStyle}>⚙️ Configuración de Notificaciones</h1>
                    <p style={subtitleStyle}>
                        Personalizá qué notificaciones querés recibir
                    </p>
                </div>

                {/* Configuraciones generales */}
                <Card style={{ marginBottom: 20, padding: 24 }}>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>
                        Configuraciones Generales
                    </h2>

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
                <Card style={{ marginBottom: 20, padding: 24 }}>
                    <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>
                        Tipos de Notificaciones
                    </h2>

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
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Button onClick={saveSettings} size="large">
                        {saved ? '✓ Guardado' : 'Guardar cambios'}
                    </Button>

                    <Button
                        onClick={() => {
                            setSettings(DEFAULT_SETTINGS);
                            setSaved(false);
                        }}
                        variant="outline"
                        size="large"
                    >
                        Restaurar por defecto
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Componente de toggle individual
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

// Estilos
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 16px',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '32px',
};

const titleStyle = {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0b1e3a',
    margin: '0 0 8px 0',
};

const subtitleStyle = {
    fontSize: '16px',
    color: '#64748b',
    margin: '0 0 16px 0',
};

// ============================================
// HOOK PARA USAR LAS CONFIGURACIONES
// ============================================

// src/hooks/useNotificationSettings.js
export function useNotificationSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Error cargando configuración:', e);
        }
    };

    const isTypeEnabled = (type) => {
        return settings[type] !== false;
    };

    return {
        settings,
        isTypeEnabled,
        shouldPlaySound: settings.sonido,
        shouldShowToast: settings.toasts,
        shouldShowBadge: settings.badge,
    };
}