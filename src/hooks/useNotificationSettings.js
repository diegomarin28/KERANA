import { useState, useEffect } from 'react';

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
    nueva_clase_agendada: true, // 🆕 Agregado
    system: true,
    update: true,

    // Configuraciones generales
    sonido: true,
    toasts: true,
    badge: true,
    email: false,
};

export function useNotificationSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

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
            console.error('❌ Error cargando configuración:', e);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = (newSettings) => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
            return true;
        } catch (e) {
            console.error('❌ Error guardando configuración:', e);
            return false;
        }
    };

    const toggleSetting = (key) => {
        const newSettings = {
            ...settings,
            [key]: !settings[key]
        };
        const success = saveSettings(newSettings);

        // 🆕 Forzar recarga de notificaciones
        if (success) {
            window.dispatchEvent(new Event('notificationSettingsChanged'));
        }
    };

    const resetToDefault = () => {
        const success = saveSettings(DEFAULT_SETTINGS);

        // 🆕 Forzar recarga de notificaciones
        if (success) {
            window.dispatchEvent(new Event('notificationSettingsChanged'));
        }
    };

    const isTypeEnabled = (type) => {
        return settings[type] !== false;
    };

    return {
        settings,
        loading,
        isTypeEnabled,
        toggleSetting,
        saveSettings,
        resetToDefault,
        shouldPlaySound: settings.sonido,
        shouldShowToast: settings.toasts,
        shouldShowBadge: settings.badge,
    };
}