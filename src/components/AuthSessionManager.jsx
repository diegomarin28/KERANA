import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const CHECK_INTERVAL = 60000; // Verificar cada 60 segundos
const TOKEN_REFRESH_THRESHOLD = 300000; // Renovar si expira en 5 minutos

export default function AuthSessionManager() {
    const navigate = useNavigate();
    const intervalRef = useRef(null);
    const isRefreshingRef = useRef(false);

    useEffect(() => {
        // Listener para cambios de auth
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Auth event:', event);

            if (event === 'TOKEN_REFRESHED') {
                console.log('✅ Token renovado exitosamente');
                isRefreshingRef.current = false;
            }

            if (event === 'SIGNED_OUT') {
                console.log('👋 Usuario deslogueado');
                navigate('/login');
            }

            if (event === 'USER_UPDATED') {
                console.log('👤 Usuario actualizado');
            }
        });

        // Verificador periódico de sesión
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.log('⚠️ Error obteniendo sesión:', error.message);

                    // Si el error es de token expirado, intentar renovar
                    if (error.message?.includes('JWT') || error.message?.includes('expired')) {
                        await attemptRefresh();
                    }
                    return;
                }

                if (!session) {
                    console.log('⚠️ No hay sesión activa');
                    return;
                }

                // Verificar si el token está por expirar
                const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
                const timeUntilExpiry = expiresAt - Date.now();

                if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
                    console.log(`⏰ Token expira en ${Math.round(timeUntilExpiry / 1000 / 60)} minutos, renovando...`);
                    await attemptRefresh();
                } else if (timeUntilExpiry <= 0) {
                    console.log('❌ Token ya expirado, renovando...');
                    await attemptRefresh();
                }
            } catch (err) {
                console.log('⚠️ Error verificando sesión:', err.message);
            }
        };

        const attemptRefresh = async () => {
            if (isRefreshingRef.current) {
                console.log('⏸️ Ya hay un refresh en proceso');
                return;
            }

            isRefreshingRef.current = true;

            try {
                console.log('🔄 Intentando renovar sesión...');
                const { data, error } = await supabase.auth.refreshSession();

                if (error) {
                    console.error('❌ Error renovando sesión:', error.message);

                    // Si no se puede renovar, desloguear
                    if (error.message?.includes('refresh_token') ||
                        error.message?.includes('invalid')) {
                        console.log('🚪 Sesión inválida, redirigiendo al login...');
                        await supabase.auth.signOut();
                        navigate('/login');
                    }
                } else if (data?.session) {
                    console.log('✅ Sesión renovada exitosamente');
                    // Recargar página para refrescar todos los componentes
                    window.location.reload();
                } else {
                    console.log('⚠️ No se obtuvo nueva sesión');
                }
            } catch (err) {
                console.error('❌ Excepción al renovar:', err);
            } finally {
                isRefreshingRef.current = false;
            }
        };

        // Verificación inicial
        checkSession();

        // Verificación periódica
        intervalRef.current = setInterval(checkSession, CHECK_INTERVAL);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            authListener?.subscription?.unsubscribe();
        };
    }, [navigate]);

    return null; // Este componente no renderiza nada
}