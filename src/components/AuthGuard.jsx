import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { useState } from 'react';

export default function AuthGuard({ children, requireAuth = true }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                // PRIMERO intentar con la sesión actual
                const { data: { session } } = await supabase.auth.getSession();

                if (!mounted) return;

                if (session?.user) {
                    setUser(session.user);
                    setLoading(false);
                    return; // Ya está autenticado
                }

                // SI NO HAY SESIÓN, verificar si hay token en localStorage (recordarme)
                const rememberMe = JSON.parse(localStorage.getItem("kerana_remember") || "false");
                const storedSession = localStorage.getItem("supabase.auth.token");

                if (rememberMe && storedSession) {
                    // Intentar refrescar la sesión automáticamente
                    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

                    if (!mounted) return;

                    if (refreshedSession?.user && !error) {
                        setUser(refreshedSession.user);
                        setLoading(false);
                        return;
                    }
                }

                setUser(null);
                setLoading(false);

                // Si requiere autenticación y no hay usuario, redirigir al home con modal
                if (requireAuth && !session?.user) {
                    const returnUrl = location.pathname + location.search;
                    navigate(`/?auth=signin&return=${encodeURIComponent(returnUrl)}`, { replace: true });
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                setLoading(false);
            }
        };

        checkAuth();

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                setLoading(false);
            } else {
                setUser(null);
                setLoading(false);

                if (requireAuth) {
                    const returnUrl = location.pathname + location.search;
                    navigate(`/?auth=signin&return=${encodeURIComponent(returnUrl)}`, { replace: true });
                }
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, [requireAuth, navigate, location]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <div
                    style={{
                        width: 40,
                        height: 40,
                        border: "3px solid #f3f4f6",
                        borderTop: "3px solid #2563eb",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
            </div>
        );
    }

    // Si no requiere autenticación o hay usuario, mostrar children
    if (!requireAuth || user) {
        return children;
    }

    // Si requiere auth pero no hay usuario, mostrar loading (será redirigido)
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <div
                style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }}
            />
        </div>
    );
}