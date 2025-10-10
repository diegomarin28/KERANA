const LAST_VISIT_KEY = 'kerana_last_notification_visit';
const SEEN_NOTIFICATIONS_KEY = 'kerana_seen_notifications';

export const notificationStorage = {
    /**
     * Guardar timestamp de última visita
     */
    saveLastVisit() {
        try {
            localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
        } catch (e) {
            console.error('Error guardando última visita:', e);
        }
    },

    /**
     * Obtener timestamp de última visita
     */
    getLastVisit() {
        try {
            const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
            return lastVisit ? new Date(lastVisit) : null;
        } catch (e) {
            console.error('Error obteniendo última visita:', e);
            return null;
        }
    },

    /**
     * Marcar notificación como vista
     */
    markAsSeen(notificationId) {
        try {
            const seen = this.getSeenNotifications();
            seen.add(notificationId);

            // Limitar a últimas 100 vistas
            const seenArray = Array.from(seen).slice(-100);

            localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(seenArray));
        } catch (e) {
            console.error('Error marcando notificación vista:', e);
        }
    },

    /**
     * Obtener IDs de notificaciones vistas
     */
    getSeenNotifications() {
        try {
            const seen = localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
            return new Set(seen ? JSON.parse(seen) : []);
        } catch (e) {
            console.error('Error obteniendo notificaciones vistas:', e);
            return new Set();
        }
    },

    /**
     * Verificar si una notificación es nueva desde última visita
     */
    isNewSinceLastVisit(notificationDate) {
        const lastVisit = this.getLastVisit();
        if (!lastVisit) return true;

        const notifDate = new Date(notificationDate);
        return notifDate > lastVisit;
    },

    /**
     * Contar notificaciones nuevas desde última visita
     */
    countNewSinceLastVisit(notifications) {
        return notifications.filter(notif =>
            this.isNewSinceLastVisit(notif.creado_en)
        ).length;
    }
};

// ============================================
// Uso en NotificationsContext.jsx:
// ============================================

import { notificationStorage } from '../utils/notificationStorage';

export function NotificationsProvider({ children }) {
    // ... código existente ...

    // ✅ Guardar última visita al cargar
    useEffect(() => {
        notificationStorage.saveLastVisit();
    }, []);

    // ✅ Agregar función para obtener nuevas
    const obtenerNuevasDesdeUltimaVisita = useCallback(() => {
        return notificationStorage.countNewSinceLastVisit(notificaciones);
    }, [notificaciones]);

    const value = {
        // ... valores existentes ...
        obtenerNuevasDesdeUltimaVisita,
    };

    // ...
}

// ============================================
// Uso en NotificationBadge.jsx:
// ============================================

export default function NotificationBadge() {
    const {
        notificaciones,
        unreadCount,
        obtenerNuevasDesdeUltimaVisita
    } = useNotificationsContext();

    const nuevasCount = obtenerNuevasDesdeUltimaVisita();

    return (
        <div>
            {/* Badge existente */}

            {/* ✅ Indicador de "nuevas desde última visita" */}
            {nuevasCount > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: -4,
                    left: -4,
                    background: '#10b981',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 4px',
                    borderRadius: 4,
                    border: '1px solid #13346b',
                }}>
                    {nuevasCount} nuevas
                </div>
            )}
        </div>
    );
}