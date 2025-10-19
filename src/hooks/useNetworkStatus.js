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
            setHasConnectionError(false);
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

    // Detectar si una sesión activa se perdió (no si nunca hubo sesión)
    useEffect(() => {
        const checkSupabaseConnection = async () => {
            try {
                // Obtener sesión actual
                const { data: { session }, error } = await supabase.auth.getSession();

                // Verificar si había una sesión guardada previamente
                const hadSession = localStorage.getItem('kerana_had_session') === 'true';

                if (session?.user) {
                    // HAY usuario logueado → marcar que hay sesión
                    localStorage.setItem('kerana_had_session', 'true');
                    setErrorType(null);
                    setHasConnectionError(false);
                } else {
                    // NO hay usuario logueado
                    if (hadSession) {
                        // Si HABÍA sesión pero ahora no → sesión perdida
                        console.log('⚠️ Sesión perdida o expirada');
                        setErrorType('expired');
                        setHasConnectionError(true);

                        // Limpiar flag y recargar
                        localStorage.removeItem('kerana_had_session');
                        setTimeout(() => {
                            console.log('🔄 Recargando página por sesión expirada...');
                            window.location.reload();
                        }, 2000);
                    } else {
                        // Si NUNCA hubo sesión → todo normal, no mostrar error
                        console.log('✅ Sin sesión activa (normal)');
                        setErrorType(null);
                        setHasConnectionError(false);
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