import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationsAPI } from '../api/notifications';

const NotificationsContext = createContext(null);

export function useNotificationsContext() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error('useNotificationsContext debe usarse dentro de NotificationsProvider');
    }
    return context;
}

export function NotificationsProvider({ children }) {
    const [notificaciones, setNotificaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Cargar notificaciones
    const cargarNotificaciones = useCallback(async (limit = 50) => {
        try {
            setLoading(true);
            setError(null);

            const result = await notificationsAPI.obtenerMisNotificaciones(limit);

            if (result.error) {
                setError(result.error);
                return { data: [], error: result.error };
            }

            setNotificaciones(result.data);

            // Calcular no leídas
            const noLeidas = result.data.filter(n => !n.leida).length;
            setUnreadCount(noLeidas);

            return { data: result.data, error: null };
        } catch (e) {
            const errorMsg = e.message || 'Error cargando notificaciones';
            setError(errorMsg);
            return { data: [], error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Contar no leídas
    const contarNoLeidas = useCallback(async () => {
        try {
            const result = await notificationsAPI.contarNoLeidas();
            setUnreadCount(result.count);
            return result.count;
        } catch (e) {
            console.error('[NotificationsContext] Error contando:', e);
            return 0;
        }
    }, []);

    // Marcar como leída
    const marcarComoLeida = useCallback(async (notifId) => {
        try {
            const result = await notificationsAPI.marcarComoLeida(notifId);

            if (result.success) {
                // Actualizar estado local
                setNotificaciones(prev =>
                    prev.map(n => n.id === notifId ? { ...n, leida: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            return result;
        } catch (e) {
            console.error('[NotificationsContext] Error marcando:', e);
            return { success: false, error: e.message };
        }
    }, []);

    // Marcar todas como leídas
    const marcarTodasLeidas = useCallback(async () => {
        try {
            const result = await notificationsAPI.marcarTodasLeidas();

            if (result.success) {
                // Actualizar estado local
                setNotificaciones(prev =>
                    prev.map(n => ({ ...n, leida: true }))
                );
                setUnreadCount(0);
            }

            return result;
        } catch (e) {
            console.error('[NotificationsContext] Error marcando todas:', e);
            return { success: false, error: e.message };
        }
    }, []);

    // Eliminar notificación
    const eliminarNotificacion = useCallback(async (notifId) => {
        try {
            const result = await notificationsAPI.eliminarNotificacion(notifId);

            if (result.success) {
                // Si no estaba leída, restar del contador
                const notif = notificaciones.find(n => n.id === notifId);
                if (notif && !notif.leida) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }

                // Actualizar estado local
                setNotificaciones(prev => prev.filter(n => n.id !== notifId));
            }

            return result;
        } catch (e) {
            console.error('[NotificationsContext] Error eliminando:', e);
            return { success: false, error: e.message };
        }
    }, [notificaciones]);

    // Auto-cargar al montar
    useEffect(() => {
        cargarNotificaciones();
        contarNoLeidas();
    }, [cargarNotificaciones, contarNoLeidas]);

    const value = {
        // Estado
        notificaciones,
        loading,
        error,
        unreadCount,

        // Acciones
        cargarNotificaciones,
        contarNoLeidas,
        marcarComoLeida,
        marcarTodasLeidas,
        eliminarNotificacion,
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}