
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import AuthModal from './AuthModal';

export default function AuthGuard({ children, requireAuth = false }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        // Verificar sesión actual
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
            setLoading(false);
        };

        getSession();

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user || null);
                setLoading(false);

                if (event === 'SIGNED_IN') {
                    setShowAuthModal(false);

                    // Crear/actualizar perfil automáticamente
                    if (session.user) {
                        try {
                            const { error } = await supabase
                                .from('usuario')
                                .upsert({
                                    correo: session.user.email,
                                    nombre: session.user.user_metadata?.name || session.user.email.split('@')[0],
                                    username: session.user.email.split('@')[0],
                                    fecha_creado: new Date().toISOString(),
                                    creditos: 0
                                }, {
                                    onConflict: 'correo'
                                });

                            if (error && !error.message.includes('duplicate key')) {
                                console.error('Error actualizando perfil:', error);
                            }
                        } catch (error) {
                            console.error('Error en upsert:', error);
                        }
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Mostrar loading mientras verifica
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                fontSize: '18px',
                color: '#64748b'
            }}>
                Cargando...
            </div>
        );
    }

    // Si requiere autenticación y no hay usuario, mostrar modal
    if (requireAuth && !user) {
        return (
            <>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '60vh',
                    flexDirection: 'column',
                    gap: '20px',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <div style={{ fontSize: '48px' }}>🔒</div>
                    <h2 style={{ margin: 0, color: '#0b1e3a' }}>Acceso Requerido</h2>
                    <p style={{ color: '#64748b', maxWidth: '400px' }}>
                        Necesitás iniciar sesión para acceder a esta página.
                    </p>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        style={{
                            padding: '12px 24px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Iniciar Sesión
                    </button>
                </div>

                <AuthModal
                    open={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    onSuccess={() => setShowAuthModal(false)}
                />
            </>
        );
    }

    return children;
}