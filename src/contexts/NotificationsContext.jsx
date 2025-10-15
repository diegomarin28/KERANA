import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../api/database';
import { notificationStorage } from '../utils/notificationStorage';
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

            const { data, error } = await notificationsAPI.getMyNotifications();

            if (error) {
                console.error('Error cargando notificaciones:', error.message || error);
                return;
            }

            // ... resto del código igual
        } catch (error) {
            console.error('Error en cargarNotificaciones:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const contarNoLeidas = useCallback(async () => {
        try {
            const { data, error } = await notificationsAPI.getUnreadCount();
            if (!error) {
                setUnreadCount(data || 0);
            }
        } catch (error) {
            console.error('Error contando no leídas:', error);
        }
    }, []);

    const marcarComoLeida = useCallback(async (notificationId) => {
        try {
            const { error } = await notificationsAPI.markAsRead(notificationId);
            if (!error) {
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
            const { error } = await notificationsAPI.markAllAsRead();
            if (!error) {
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
            setNotificaciones(prev => prev.filter(n => n.id !== notificationId));
            await contarNoLeidas();
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