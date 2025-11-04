import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../api/notifications';
import { notificationStorage } from '../utils/NotificationStorage';
import { fetchUserProfile } from '../utils/authHelpers';

const NotificationsContext = createContext();

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotificationsContext debe usarse dentro de NotificationsProvider');
    }
    return context;
}

export function NotificationsProvider({ children }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [newSinceLastVisit, setNewSinceLastVisit] = useState(0);
    const [newSinceLastVisitMessage, setNewSinceLastVisitMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // 🆕 Función para obtener settings desde localStorage
    const getNotificationSettings = useCallback(() => {
        try {
            const stored = localStorage.getItem('kerana_notification_settings');
            if (stored) {
                return JSON.parse(stored);
            }
            return {}; // Si no hay settings, mostrar todas
        } catch (e) {
            console.error('Error leyendo settings:', e);
            return {};
        }
    }, []);

    // 🆕 Función para filtrar notificaciones según preferencias
    const filtrarNotificaciones = useCallback((notifs) => {
        const settings = getNotificationSettings();

        return notifs.filter(notif => {
            // Si el tipo no está en settings o está en true, mostrar
            return settings[notif.tipo] !== false;
        });
    }, [getNotificationSettings]);

    const cargarNotificaciones = useCallback(async () => {
        try {
            setLoading(true);

            // ✅ PRIMERO: Verificar que el perfil exista
            const { data: perfil } = await fetchUserProfile();
            if (!perfil) {
                console.log('[Notifications] Perfil no existe aún, saltando carga');
                setNotificaciones([]);
                setLoading(false);
                return;
            }

            const { data, error } = await notificationsAPI.obtenerMisNotificaciones();

            if (error) {
                console.error('Error cargando notificaciones:', error);
                setNotificaciones([]);
                return;
            }

            // 🆕 Filtrar notificaciones según preferencias
            const notifsOriginales = data || [];
            const notifsFiltradas = filtrarNotificaciones(notifsOriginales);

            setNotificaciones(notifsFiltradas);

            // Calcular cuántas son nuevas desde última visita (de las filtradas)
            const newCount = notificationStorage.countNewSinceLastVisit(notifsFiltradas);
            setNewSinceLastVisit(newCount);

            if (newCount > 0) {
                const message = newCount === 1
                    ? '1 nueva desde tu última visita'
                    : `${newCount} nuevas desde tu última visita`;
                setNewSinceLastVisitMessage(message);
            }
        } catch (error) {
            console.error('Error en cargarNotificaciones:', error);
            setNotificaciones([]);
        } finally {
            setLoading(false);
        }
    }, [filtrarNotificaciones]);

    const contarNoLeidas = useCallback(async () => {
        try {
            // 🆕 Obtener todas las notifs y filtrar para contar correctamente
            const { data } = await notificationsAPI.obtenerMisNotificaciones();
            const notifsFiltradas = filtrarNotificaciones(data || []);
            const unreadFiltered = notifsFiltradas.filter(n => !n.leida).length;

            setUnreadCount(unreadFiltered);
        } catch (error) {
            console.error('Error contando no leídas:', error);
            setUnreadCount(0);
        }
    }, [filtrarNotificaciones]);

    const marcarComoLeida = useCallback(async (notificationId) => {
        try {
            const { success } = await notificationsAPI.marcarComoLeida(notificationId);
            if (success) {
                setNotificaciones(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, leida: true } : n)
                );
                await contarNoLeidas();

                // ✅ Marcar como vista en storage
                notificationStorage.markAsSeen(notificationId);
            }
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    }, [contarNoLeidas]);

    const marcarTodasLeidas = useCallback(async () => {
        try {
            const { success } = await notificationsAPI.marcarTodasLeidas();
            if (success) {
                setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
                setUnreadCount(0);
                setNewSinceLastVisit(0);
                setNewSinceLastVisitMessage('');

                // ✅ Marcar todas como vistas en storage
                notificaciones.forEach(n => notificationStorage.markAsSeen(n.id));
            }
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    }, [notificaciones]);

    const eliminarNotificacion = useCallback(async (notificationId) => {
        try {
            const { success } = await notificationsAPI.eliminarNotificacion(notificationId);
            if (success) {
                setNotificaciones(prev => prev.filter(n => n.id !== notificationId));
                await contarNoLeidas();
            }
        } catch (error) {
            console.error('Error eliminando notificación:', error);
        }
    }, [contarNoLeidas]);

    // ✅ Marcar visita cuando se abre la página de notificaciones
    const marcarVisita = useCallback(() => {
        notificationStorage.saveLastVisit();
        setNewSinceLastVisit(0);
        setNewSinceLastVisitMessage('');
    }, []);

    // ✅ Incrementar contador cuando llega notificación nueva (llamar desde Realtime)
    const onNuevaNotificacion = useCallback(() => {
        setNewSinceLastVisit(prev => prev + 1);
        // Actualizar mensaje
        const newCount = newSinceLastVisit + 1;
        const message = newCount === 1
            ? '1 nueva desde tu última visita'
            : `${newCount} nuevas desde tu última visita`;
        setNewSinceLastVisitMessage(message);
    }, [newSinceLastVisit]);

    // 🆕 Recargar cuando cambien los settings
    useEffect(() => {
        const handleSettingsChange = () => {
            console.log('⚙️ Settings cambiaron, recargando notificaciones...');
            cargarNotificaciones();
            contarNoLeidas();
        };

        window.addEventListener('notificationSettingsChanged', handleSettingsChange);
        return () => window.removeEventListener('notificationSettingsChanged', handleSettingsChange);
    }, [cargarNotificaciones, contarNoLeidas]);

    useEffect(() => {
        cargarNotificaciones();
        contarNoLeidas();
    }, [cargarNotificaciones, contarNoLeidas]);

    const value = {
        notificaciones,
        unreadCount,
        newSinceLastVisit,
        newSinceLastVisitMessage,
        loading,
        cargarNotificaciones,
        contarNoLeidas,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
        marcarVisita,
        onNuevaNotificacion,
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}