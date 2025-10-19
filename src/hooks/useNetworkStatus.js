import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [hasConnectionError, setHasConnectionError] = useState(false);
    const [errorType, setErrorType] = useState(null); // 'offline' | 'expired' | null

    // Detectar cambios de conexión del navegador
    useEffect(() => {
        const handleOnline = () => {
            console.log('🟢 Conexión restaurada');
            setIsOnline(true);
            setErrorType(null);
            // Recargar página cuando vuelve la conexión
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        };

        const handleOffline = () => {
            console.log('🔴 Sin conexión a internet');
            setIsOnline(false);
            setErrorType('offline');
            setHasConnectionError(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Detectar errores de Supabase (token expirado, etc)
    useEffect(() => {
        const checkSupabaseConnection = async () => {
            try {
                // Intentar obtener usuario actual
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error) {
                    console.log('⚠️ Error de autenticación:', error.message);

                    // Si es error de JWT expirado o sesión
                    if (error.message.includes('JWT') ||
                        error.message.includes('expired') ||
                        error.message.includes('session')) {
                        setErrorType('expired');
                        setHasConnectionError(true);

                        // Recargar después de 2 segundos
                        setTimeout(() => {
                            console.log('🔄 Recargando página por sesión expirada...');
                            window.location.reload();
                        }, 2000);
                    }
                }
            } catch (err) {
                console.error('❌ Error chequeando conexión:', err);
            }
        };

        // Chequear conexión cada 30 segundos
        const interval = setInterval(checkSupabaseConnection, 30000);

        // Chequear inmediatamente al montar
        checkSupabaseConnection();

        return () => clearInterval(interval);
    }, []);

    return {
        isOnline,
        hasConnectionError,
        errorType
    };
}