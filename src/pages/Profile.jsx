// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Debes iniciar sesión');
                return;
            }

            // Usar maybeSingle en lugar de single para evitar error PGRST116
            const { data, error: profileError } = await supabase
                .from('usuario')
                .select('*')
                .eq('correo', user.email)
                .maybeSingle();

            if (profileError) {
                console.warn('Error cargando perfil:', profileError);
                // No es crítico - el usuario puede no tener perfil aún
            }

            if (data) {
                setProfile(data);
            } else {
                // Usuario no tiene perfil en la base de datos
                setProfile({
                    correo: user.email,
                    nombre: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
                    username: '',
                    creditos: 0,
                    fecha_creado: new Date().toISOString()
                });
            }

        } catch (err) {
            console.error('Error en fetchProfile:', err);
            setError('Error cargando perfil');
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async () => {
        try {
            setIsCreating(true);
            setError('');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Debes iniciar sesión');
                return;
            }

            const profileData = {
                correo: user.email,
                nombre: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuario',
                username: generateUsername(user.email),
                fecha_creado: new Date().toISOString(),
                creditos: 10
            };

            const { data, error: insertError } = await supabase
                .from('usuario')
                .insert([profileData])
                .select()
                .single();

            if (insertError) {
                console.error('Error creando perfil:', insertError);
                setError('No se pudo crear el perfil. Verifica los permisos de la base de datos.');
                return;
            }

            setProfile(data);

        } catch (err) {
            console.error('Error en createProfile:', err);
            setError('Error creando perfil');
        } finally {
            setIsCreating(false);
        }
    };

    const generateUsername = (email) => {
        const base = email.split('@')[0];
        const random = Math.floor(Math.random() * 10000);
        return `${base}${random}`;
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid #f3f4f6',
                        borderTop: '3px solid #2563eb',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p>Cargando perfil...</p>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
            <h1 style={{ marginBottom: 24 }}>Mi Perfil</h1>

            {error && (
                <Card style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: 16,
                    marginBottom: 20
                }}>
                    {error}
                </Card>
            )}

            {profile ? (
                <Card style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px 0' }}>{profile.nombre}</h2>
                            <p style={{ color: '#6b7280', margin: '0 0 8px 0' }}>{profile.correo}</p>
                            {profile.username && (
                                <p style={{ color: '#6b7280', margin: 0 }}>@{profile.username}</p>
                            )}
                        </div>
                        <Chip tone="green">{profile.creditos || 0} créditos</Chip>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                        <div>
                            <strong>Email:</strong> {profile.correo}
                        </div>
                        <div>
                            <strong>Nombre:</strong> {profile.nombre}
                        </div>
                        {profile.username && (
                            <div>
                                <strong>Username:</strong> @{profile.username}
                            </div>
                        )}
                        {profile.fecha_creado && (
                            <div>
                                <strong>Miembro desde:</strong> {new Date(profile.fecha_creado).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </Card>
            ) : (
                <Card style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                    <h3 style={{ margin: '0 0 12px 0' }}>Perfil no encontrado</h3>
                    <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
                        Tu cuenta de autenticación existe, pero no tienes un perfil en la base de datos.
                    </p>
                    <Button
                        variant="primary"
                        onClick={createProfile}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creando perfil...' : 'Crear mi perfil'}
                    </Button>
                </Card>
            )}
        </div>
    );
}