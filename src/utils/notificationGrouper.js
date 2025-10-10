
// Agrupa notificaciones similares
/**
 * Agrupa notificaciones del mismo tipo que ocurrieron en un periodo corto
 * @param {Array} notifications - Lista de notificaciones
 * @param {number} timeWindowMinutes - Ventana de tiempo en minutos para agrupar
 */
export function groupNotifications(notifications, timeWindowMinutes = 60) {
    if (!notifications || notifications.length === 0) return [];

    const grouped = [];
    const processed = new Set();

    notifications.forEach((notif, index) => {
        if (processed.has(notif.id)) return;

        // Buscar notificaciones similares en ventana de tiempo
        const similar = notifications.filter((other, otherIndex) => {
            if (otherIndex === index || processed.has(other.id)) return false;

            // Mismo tipo
            if (other.tipo !== notif.tipo) return false;

            // Dentro de ventana de tiempo
            const timeDiff = Math.abs(
                new Date(other.creado_en) - new Date(notif.creado_en)
            ) / (1000 * 60); // minutos

            return timeDiff <= timeWindowMinutes;
        });

        if (similar.length > 0) {
            // Crear notificación agrupada
            const allItems = [notif, ...similar];
            allItems.forEach(item => processed.add(item.id));

            grouped.push({
                ...notif,
                isGrouped: true,
                groupCount: allItems.length,
                groupedItems: allItems,
                mensaje: generateGroupedMessage(notif.tipo, allItems),
            });
        } else {
            // Notificación individual
            processed.add(notif.id);
            grouped.push({
                ...notif,
                isGrouped: false,
            });
        }
    });

    return grouped;
}

/**
 * Genera mensaje para notificación agrupada
 */
function generateGroupedMessage(tipo, items) {
    const count = items.length;
    const firstEmitter = items[0].emisor?.nombre || 'Alguien';
    const secondEmitter = items[1]?.emisor?.nombre;

    switch (tipo) {
        case 'nuevo_seguidor':
            if (count === 2) {
                return `${firstEmitter} y ${secondEmitter} comenzaron a seguirte`;
            }
            if (count === 3) {
                const thirdEmitter = items[2]?.emisor?.nombre;
                return `${firstEmitter}, ${secondEmitter} y ${thirdEmitter} comenzaron a seguirte`;
            }
            return `${firstEmitter}, ${secondEmitter} y ${count - 2} personas más comenzaron a seguirte`;

        case 'nuevo_like':
            if (count === 2) {
                return `A ${firstEmitter} y ${secondEmitter} les gustó tu apunte`;
            }
            return `A ${firstEmitter}, ${secondEmitter} y ${count - 2} personas más les gustó tu apunte`;

        case 'nuevo_comentario':
            if (count === 2) {
                return `${firstEmitter} y ${secondEmitter} comentaron en tu apunte`;
            }
            return `${firstEmitter}, ${secondEmitter} y ${count - 2} personas más comentaron en tu apunte`;

        default:
            return `${count} notificaciones de ${tipo}`;
    }
}

/**
 * Obtener avatares de notificaciones agrupadas (máximo 3)
 */
export function getGroupedAvatars(groupedNotif) {
    if (!groupedNotif.isGrouped) {
        return [groupedNotif.emisor];
    }

    return groupedNotif.groupedItems
        .slice(0, 3)
        .map(item => item.emisor)
        .filter(Boolean);
}

// ============================================
// EJEMPLO DE USO EN NotificationBadge:
// ============================================

/*
import { groupNotifications, getGroupedAvatars } from '../utils/notificationGrouper';

const groupedNotifications = groupNotifications(notificaciones, 60); // 60 minutos

// Renderizar:
groupedNotifications.map(notif => (
  <div key={notif.id}>
    {notif.isGrouped ? (
      // Mostrar múltiples avatares
      <div style={{ display: 'flex', marginLeft: -8 }}>
        {getGroupedAvatars(notif).map((emisor, i) => (
          <img
            key={i}
            src={emisor.foto}
            style={{
              marginLeft: -8,
              zIndex: 3 - i,
              border: '2px solid #fff'
            }}
          />
        ))}
      </div>
    ) : (
      // Avatar individual
      <img src={notif.emisor.foto} />
    )}
    <p>{notif.mensaje}</p>
  </div>
))
*/