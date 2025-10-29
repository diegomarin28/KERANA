import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { createOrUpdateUserProfile } from '../utils/authHelpers';

export default function AuthConfirm() {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
        try {
            setStatus('loading');
            setMessage('Verificando autenticación...');

            // Obtener token de la URL
            const token_hash = searchParams.get('token_hash');
            const type = searchParams.get('type');

            // Si hay token en la URL, verificar con Supabase
            if (token_hash && type) {
                const { data, error } = await supabase.auth.verifyOtp({
                    token_hash,
                    type: type
                });

                if (error) {
                    console.error('Error verificando OTP:', error);
                    setStatus('error');
                    setMessage('Error al verificar el código. El enlace puede haber expirado.');
                    return;
                }

                if (data.session) {
                    await handleUserProfile(data.user);
                    return;
                }
            }

            // Si no hay token, intentar obtener sesión actual
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                setStatus('error');
                setMessage('Error de autenticación. Por favor, intenta nuevamente.');
                return;
            }

            if (!session) {
                setStatus('error');
                setMessage('No se encontró sesión activa. Redirigiendo al login...');
                setTimeout(() => navigate('/?auth=signin'), 3000);
                return;
            }

            await handleUserProfile(session.user);

        } catch (err) {
            console.error('Error en handleAuthCallback:', err);
            setStatus('error');
            setMessage('Error durante el proceso de autenticación.');
        }
    };

    const handleUserProfile = async (user) => {
        try {
            setMessage('Configurando tu perfil...');

            // Usar la función unificada para crear/actualizar perfil
            const { data: profile, error } = await createOrUpdateUserProfile(user);

            if (error) {
                console.error('Error creando perfil:', error);
                // Aún así marcamos como éxito - la autenticación funcionó
                setStatus('success');
                setMessage('¡Autenticación exitosa! Redirigiendo...');
                setTimeout(() => navigate('/profile/setup'), 1500);
                return;
            }

            if (profile) {
                setStatus('success');
                setMessage('¡Bienvenido! Configurando tu cuenta...');
                setTimeout(() => navigate('/profile/setup'), 1500);
            }

        } catch (err) {
            console.error('Error en handleUserProfile:', err);
            // La autenticación funcionó, así que redirigimos de todas formas
            setStatus('success');
            setMessage('¡Autenticación exitosa! Redirigiendo...');
            setTimeout(() => navigate('/profile/setup'), 1500);
        }
    };

    const handleRetry = () => {
        hasRun.current = false;
        setStatus('loading');
        setMessage('');
        handleAuthCallback();
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const containerStyle = {
        minHeight: '60vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    };

    const cardStyle = {
        padding: 40,
        textAlign: 'center',
        maxWidth: 500,
        width: '100%'
    };

    if (status === 'loading') {
        return (
            <div style={containerStyle}>
                <Card style={cardStyle}>
                    <div style={{
                        width: 50,
                        height: 50,
                        border: '3px solid #f3f4f6',
                        borderTop: '3px solid #2563eb',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }} />
                    <h2 style={{ margin: '0 0 16px 0', color: '#1f2937', fontFamily: 'Inter, sans-serif' }}>
                        Procesando...
                    </h2>
                    <p style={{ color: '#6b7280', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                        {message}
                    </p>
                </Card>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div style={containerStyle}>
                <Card style={{
                    ...cardStyle,
                    background: '#fef2f2',
                    border: '1px solid #fecaca'
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ margin: '0 0 16px 0', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
                        Error de autenticación
                    </h2>
                    <p style={{ color: '#991b1b', margin: '0 0 24px 0', fontFamily: 'Inter, sans-serif' }}>
                        {message}
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Button variant="primary" onClick={handleRetry}>
                            Reintentar
                        </Button>
                        <Button variant="secondary" onClick={handleGoHome}>
                            Ir al inicio
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div style={containerStyle}>
                <Card style={{
                    ...cardStyle,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0'
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h2 style={{ margin: '0 0 16px 0', color: '#166534', fontFamily: 'Inter, sans-serif' }}>
                        ¡Autenticación exitosa!
                    </h2>
                    <p style={{ color: '#166534', margin: '0 0 24px 0', fontFamily: 'Inter, sans-serif' }}>
                        {message}
                    </p>
                    <Button variant="primary" onClick={() => navigate('/profile/setup')}>
                        Continuar
                    </Button>
                </Card>
            </div>
        );
    }

    return null;
}