// src/hooks/usePrivacySettings.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function usePrivacySettings() {
    const [settings, setSettings] = useState({
        perfil_publico: true,
        mostrar_email: false,
        permitir_mensajes: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('usuario')
                .select('perfil_publico, mostrar_email, permitir_mensajes')
                .eq('auth_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setSettings({
                    perfil_publico: data.perfil_publico ?? true,
                    mostrar_email: data.mostrar_email ?? false,
                    permitir_mensajes: data.permitir_mensajes ?? true,
                });
            }
        } catch (error) {
            console.error('Error cargando configuración de privacidad:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key, value) => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { error } = await supabase
                .from('usuario')
                .update({ [key]: value })
                .eq('auth_id', user.id);

            if (error) throw error;

            setSettings(prev => ({ ...prev, [key]: value }));
            return true;
        } catch (error) {
            console.error(`Error actualizando ${key}:`, error);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const togglePerfilPublico = async () => {
        const newValue = !settings.perfil_publico;
        const success = await updateSetting('perfil_publico', newValue);
        return success;
    };

    const toggleMostrarEmail = async () => {
        const newValue = !settings.mostrar_email;
        const success = await updateSetting('mostrar_email', newValue);
        return success;
    };

    const togglePermitirMensajes = async () => {
        const newValue = !settings.permitir_mensajes;
        const success = await updateSetting('permitir_mensajes', newValue);
        return success;
    };

    return {
        settings,
        loading,
        saving,
        togglePerfilPublico,
        toggleMostrarEmail,
        togglePermitirMensajes,
        updateSetting,
        reload: loadSettings,
    };
}