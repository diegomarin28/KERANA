export function getNotificationRoute(notification) {
    if (!notification) return null;

    const { tipo, emisor_id, relacion_id } = notification;

    switch (tipo) {
        case 'nuevo_seguidor':
        case 'solicitud_aceptada':
            // Ir al perfil del emisor
            return `/profile/${emisor_id}`;

        case 'nuevo_comentario':
            // Ir al apunte comentado
            return `/apuntes/${relacion_id}`;

        case 'nuevo_mentor':
            // Ir a mentores
            return `/mentors`;

        case 'nueva_resenia':
            // Ir a la materia reseñada
            return `/cursos/${relacion_id}`;

        case 'system':
        case 'update':
            // Notificaciones del sistema no tienen link
            return null;

        default:
            // Por defecto, ir a la página de notificaciones
            return '/notifications';
    }
}

export function isNotificationClickable(notification) {
    return getNotificationRoute(notification) !== null;
}