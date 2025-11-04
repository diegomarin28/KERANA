import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faCheckCircle,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
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
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        background: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
    };

    const cardStyle = {
        padding: '48px 40px',
        textAlign: 'center',
        maxWidth: 480,
        width: '100%',
        borderRadius: 16,
        border: '2px solid #f1f5f9',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
    };

    if (status === 'loading') {
        return (
            <div style={containerStyle}>
                <Card style={cardStyle}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <FontAwesomeIcon
                            icon={faSpinner}
                            spin
                            style={{ fontSize: 36, color: '#fff' }}
                        />
                    </div>
                    <h2 style={{
                        margin: '0 0 12px 0',
                        color: '#13346b',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 24,
                        fontWeight: 700
                    }}>
                        Procesando...
                    </h2>
                    <p style={{
                        color: '#64748b',
                        margin: 0,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 15,
                        fontWeight: 500
                    }}>
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
                    border: '2px solid #fecaca'
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            style={{ fontSize: 36, color: '#fff' }}
                        />
                    </div>
                    <h2 style={{
                        margin: '0 0 12px 0',
                        color: '#dc2626',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 24,
                        fontWeight: 700
                    }}>
                        Error de autenticación
                    </h2>
                    <p style={{
                        color: '#991b1b',
                        margin: '0 0 28px 0',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.5
                    }}>
                        {message}
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleRetry}
                            style={{
                                padding: '12px 24px',
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#1e40af';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#2563eb';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={handleGoHome}
                            style={{
                                padding: '12px 24px',
                                background: '#fff',
                                color: '#64748b',
                                border: '2px solid #e2e8f0',
                                borderRadius: 10,
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#f8fafc';
                                e.target.style.borderColor = '#2563eb';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#fff';
                                e.target.style.borderColor = '#e2e8f0';
                            }}
                        >
                            Ir al inicio
                        </button>
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
                    border: '2px solid #bbf7d0'
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <FontAwesomeIcon
                            icon={faCheckCircle}
                            style={{ fontSize: 36, color: '#fff' }}
                        />
                    </div>
                    <h2 style={{
                        margin: '0 0 12px 0',
                        color: '#166534',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 24,
                        fontWeight: 700
                    }}>
                        ¡Autenticación exitosa!
                    </h2>
                    <p style={{
                        color: '#166534',
                        margin: '0 0 28px 0',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.5
                    }}>
                        {message}
                    </p>
                    <button
                        onClick={() => navigate('/profile/setup')}
                        style={{
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                        }}
                    >
                        Continuar
                    </button>
                </Card>
            </div>
        );
    }

    return null;
}