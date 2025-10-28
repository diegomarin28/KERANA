
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