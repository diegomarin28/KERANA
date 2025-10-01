
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function AuthConfirm() {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const hasRun = useRef(false); // ← PREVENIR EJECUCIÓN DUPLICADA

    useEffect(() => {
        // Prevenir que se ejecute más de una vez
        if (hasRun.current) return;
        hasRun.current = true;

        handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
        try {
            setStatus('loading');
            setMessage('Verificando autenticación...');

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('Error de sesión:', sessionError);
                setStatus('error');
                setMessage('Error de autenticación. Por favor, intenta nuevamente.');
                return;
            }

            if (!session) {
                setStatus('error');
                setMessage('No se encontró sesión activa. Redirigiendo al login...');
                setTimeout(() => navigate('/signin'), 3000);
                return;
            }

            console.log('✅ Usuario autenticado:', session.user.email);
            await handleUserProfile(session.user);

        } catch (err) {
            console.error('Error en auth callback:', err);
            setStatus('error');
            setMessage('Error durante el proceso de autenticación.');
        }
    };

    const handleUserProfile = async (user) => {
        try {
            setMessage('Verificando tu perfil...');

            // Verificar si el usuario ya existe
            const { data: existingUser, error: checkError } = await supabase
                .from('usuario')
                .select('id_usuario, correo, nombre, auth_id')
                .eq('correo', user.email)
                .maybeSingle();

            if (checkError) {
                console.warn('Error verificando usuario:', checkError);
            }

            // SI EL USUARIO YA EXISTE - redirigir inmediatamente
            if (existingUser) {
                console.log('✅ Usuario ya existe en la base de datos:', existingUser);
                setStatus('success');
                setMessage('¡Bienvenido de vuelta! Redirigiendo...');
                setTimeout(() => navigate('/'), 1500);
                return;
            }

            // SOLO SI NO EXISTE - crear nuevo perfil
            setMessage('Creando tu perfil...');

            const userProfile = {
                correo: user.email,
                nombre: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
                username: generateUsername(user.email),
                fecha_creado: new Date().toISOString(),
                creditos: 10,
                auth_id: user.id,
            };

            console.log('Creando perfil con datos:', userProfile);

            const { data: newUser, error: insertError } = await supabase
                .from('usuario')
                .insert([userProfile])
                .select()
                .single();

            if (insertError) {
                console.error('Error creando perfil:', insertError);

                // Si es error de duplicado, significa que el usuario ya existe
                if (insertError.code === '23505') {
                    console.log('⚠️ Usuario ya existe (error de duplicado)');
                    setStatus('success');
                    setMessage('¡Bienvenido! Redirigiendo...');
                    setTimeout(() => navigate('/'), 1500);
                    return;
                }

                // Para otros errores
                setMessage('Perfil creado con algunas limitaciones. Puedes completarlo después.');
                setStatus('success');
                setTimeout(() => navigate('/profile'), 2000);
                return;
            }

            console.log('✅ Nuevo usuario creado:', newUser);
            setStatus('success');
            setMessage('¡Perfil creado exitosamente! Redirigiendo...');
            setTimeout(() => navigate('/'), 1500);

        } catch (err) {
            console.error('Error en handleUserProfile:', err);
            // Aún así marcamos como éxito - la autenticación funcionó
            setStatus('success');
            setMessage('¡Autenticación exitosa! Redirigiendo...');
            setTimeout(() => navigate('/'), 1500);
        }
    };

    const generateUsername = (email) => {
        const base = email.split('@')[0];
        const random = Math.floor(Math.random() * 10000);
        return `${base}${random}`;
    };

    const handleRetry = () => {
        setStatus('loading');
        setMessage('');
        handleAuthCallback();
    };

    const handleGoHome = () => {
        navigate('/');
    };

    // Estilos comunes
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
                    <h2 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>
                        Procesando...
                    </h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>
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
                    <h2 style={{ margin: '0 0 16px 0', color: '#dc2626' }}>
                        Error de autenticación
                    </h2>
                    <p style={{ color: '#991b1b', margin: '0 0 24px 0' }}>
                        {message}
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                    <h2 style={{ margin: '0 0 16px 0', color: '#166534' }}>
                        ¡Autenticación exitosa!
                    </h2>
                    <p style={{ color: '#166534', margin: '0 0 24px 0' }}>
                        {message}
                    </p>
                    <Button variant="primary" onClick={handleGoHome}>
                        Ir al inicio ahora
                    </Button>
                </Card>
            </div>
        );
    }

    return null;
}