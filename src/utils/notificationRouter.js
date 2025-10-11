
/**
 * Determina la ruta a la que debe navegar cuando se hace click en una notificación
 */
export function getNotificationRoute(notification) {
    if (!notification) return null;

    const { tipo, emisor_id, relacion_id } = notification;

    switch (tipo) {
        // Seguidores
        case 'nuevo_seguidor':
        case 'solicitud_aceptada':
            return emisor_id ? `/profile/${emisor_id}` : '/profile';

        // Apuntes
        case 'nuevo_comentario':
        case 'nuevo_like':
        case 'apunte_aprobado':
            return relacion_id ? `/apuntes/${relacion_id}` : '/my_papers';

        // Reseñas
        case 'nueva_resenia':
            return relacion_id ? `/cursos/${relacion_id}` : '/profile';

        // Mentoría
        case 'mentor_acepto':
        case 'nueva_solicitud_mentoria':
        case 'mentoria_confirmada':
        case 'mentoria_cancelada':
            return relacion_id ? `/mentor/sessions/${relacion_id}` : '/mentor/calendar';

        // Mentor
        case 'nuevo_apunte':
        case 'nuevo_mentor':
            return relacion_id ? `/subjects/${relacion_id}` : '/mentors';

        case 'mentor_aprobado':
            return '/mentor/courses';

        // Sistema
        case 'system':
        case 'update':
            return null; // No clickeable

        default:
            return '/notifications';
    }
}

/**
 * Verifica si una notificación tiene un link clickeable
 */
export function isNotificationClickable(notification) {
    return getNotificationRoute(notification) !== null;
}

/**
 * Obtiene el ícono para cada tipo de notificación
 */
export function getNotificationIcon(tipo) {
    const icons = {
        nuevo_seguidor: '👤',
        solicitud_aceptada: '✅',
        nuevo_comentario: '💬',
        nuevo_like: '❤️',
        nueva_resenia: '⭐',
        mentor_acepto: '🎓',
        nuevo_apunte: '📄',
        nuevo_mentor: '💡',
        apunte_aprobado: '✔️',
        mentor_aprobado: '🏆',
        system: '⚙️',
        update: '🆕',
        nueva_solicitud_mentoria: '📚',
        mentoria_confirmada: '✅',
        mentoria_cancelada: '❌',
    };

    return icons[tipo] || '🔔';
}

/**
 * Obtiene el color para cada tipo de notificación
 */
export function getNotificationColor(tipo) {
    const colors = {
        nuevo_seguidor: '#3b82f6',
        solicitud_aceptada: '#10b981',
        nuevo_comentario: '#8b5cf6',
        nuevo_like: '#ef4444',
        nueva_resenia: '#f59e0b',
        mentor_acepto: '#06b6d4',
        nuevo_apunte: '#6366f1',
        apunte_aprobado: '#10b981',
        mentor_aprobado: '#10b981',
        system: '#64748b',
        update: '#2563eb',
    };

    return colors[tipo] || '#64748b';
}