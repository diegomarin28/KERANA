import { useEffect } from 'react';
import { releaseExpiredTemporaryReservations } from '../utils/calendlySync.js';

/**
 * Hook que limpia automáticamente las reservas temporales expiradas
 * Ejecuta cada 60 segundos
 */
export function useExpiredReservationsCleanup() {
    useEffect(() => {
        // Ejecutar inmediatamente al montar
        releaseExpiredTemporaryReservations();

        // Ejecutar cada 60 segundos
        const interval = setInterval(() => {
            releaseExpiredTemporaryReservations();
        }, 60000); // 60 segundos

        return () => clearInterval(interval);
    }, []);
}