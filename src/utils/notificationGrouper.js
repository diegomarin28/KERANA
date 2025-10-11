
/**
 * Agrupa notificaciones similares del mismo tipo
 * Ejemplo: "Juan, María y 2 más te siguieron"
 */

const GROUPABLE_TYPES = [
    'nuevo_seguidor',
    'nuevo_like',
    'nuevo_comentario',
    'nueva_resenia',
];

const TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Verifica si un tipo de notificación es agrupable
 */
function isGroupableType(tipo) {
    return GROUPABLE_TYPES.includes(tipo);
}

/**
 * Verifica si dos notificaciones pueden agruparse
 */
function canGroupTogether(notif1, notif2) {
    // Mismo tipo
    if (notif1.tipo !== notif2.tipo) return false;

    // Tipo agrupable
    if (!isGroupableType(notif1.tipo)) return false;

    // Mismo recurso (si aplica)
    if (notif1.relacion_id && notif2.relacion_id && notif1.relacion_id !== notif2.relacion_id) {
        return false;
    }

    // Dentro de ventana de tiempo
    const time1 = new Date(notif1.creado_en).getTime();
    const time2 = new Date(notif2.creado_en).getTime();

    return Math.abs(time1 - time2) <= TIME_WINDOW_MS;
}

/**
 * Agrupa notificaciones similares
 * @param {Array} notifications - Array de notificaciones ordenadas por fecha
 * @returns {Array} - Array de notificaciones agrupadas
 */
export function groupNotifications(notifications) {
    if (!notifications || notifications.length === 0) return [];

    const grouped = [];
    const processed = new Set();

    for (let i = 0; i < notifications.length; i++) {
        if (processed.has(i)) continue;

        const current = notifications[i];

        // Si no es agrupable, agregar tal cual
        if (!isGroupableType(current.tipo)) {
            grouped.push({ ...current, isGroup: false });
            processed.add(i);
            continue;
        }

        // Buscar notificaciones similares
        const group = [current];
        processed.add(i);

        for (let j = i + 1; j < notifications.length; j++) {
            if (processed.has(j)) continue;

            const candidate = notifications[j];

            if (canGroupTogether(current, candidate)) {
                group.push(candidate);
                processed.add(j);
            }
        }

        // Si hay más de 1, crear grupo
        if (group.length > 1) {
            grouped.push(createGroupedNotification(group));
        } else {
            grouped.push({ ...current, isGroup: false });
        }
    }

    return grouped;
}

/**
 * Crea una notificación agrupada
 */
function createGroupedNotification(notifications) {
    const tipo = notifications[0].tipo;
    const emisores = notifications.map(n => n.emisor).filter(Boolean);
    const count = notifications.length;

    // Tomar los primeros 2 emisores por nombre
    const firstTwo = emisores.slice(0, 2);
    const remaining = count - 2;

    // Generar mensaje agrupado
    let mensaje = '';

    if (firstTwo.length === 1) {
        mensaje = `${firstTwo[0].nombre} `;
    } else if (firstTwo.length === 2) {
        mensaje = `${firstTwo[0].nombre} y ${firstTwo[1].nombre} `;
    }

    if (remaining > 0) {
        mensaje += `y ${remaining} más `;
    }

    // Completar mensaje según tipo
    switch (tipo) {
        case 'nuevo_seguidor':
            mensaje += count === 1 ? 'te siguió' : 'te siguieron';
            break;
        case 'nuevo_like':
            mensaje += count === 1 ? 'le dio like a tu apunte' : 'le dieron like a tu apunte';
            break;
        case 'nuevo_comentario':
            mensaje += count === 1 ? 'comentó en tu apunte' : 'comentaron en tu apunte';
            break;
        case 'nueva_resenia':
            mensaje += count === 1 ? 'dejó una reseña' : 'dejaron reseñas';
            break;
        default:
            mensaje += 'interactuaron contigo';
    }

    return {
        id: `group-${notifications[0].id}`,
        tipo,
        mensaje,
        emisor: firstTwo[0], // Usar el primero como avatar
        emisores: firstTwo, // Guardar ambos
        creado_en: notifications[0].creado_en, // Fecha de la más reciente
        leida: notifications.every(n => n.leida), // Leída solo si todas están leídas
        relacion_id: notifications[0].relacion_id,
        isGroup: true,
        count,
        notifications, // Guardar originales
    };
}

/**
 * Expande un grupo de notificaciones
 */
export function expandGroup(groupedNotification) {
    if (!groupedNotification.isGroup) {
        return [groupedNotification];
    }

    return groupedNotification.notifications || [];
}

/**
 * Obtiene el texto descriptivo de un grupo
 */
export function getGroupDescription(groupedNotification) {
    if (!groupedNotification.isGroup) return null;

    const { count, tipo } = groupedNotification;

    const descriptions = {
        nuevo_seguidor: `${count} personas`,
        nuevo_like: `${count} likes`,
        nuevo_comentario: `${count} comentarios`,
        nueva_resenia: `${count} reseñas`,
    };

    return descriptions[tipo] || `${count} notificaciones`;
}

/**
 * Verifica si se debe mostrar agrupado
 * (Solo si hay 3 o más del mismo tipo)
 */
export function shouldGroup(notifications, tipo) {
    if (!isGroupableType(tipo)) return false;

    const ofType = notifications.filter(n => n.tipo === tipo);
    return ofType.length >= 3;
}