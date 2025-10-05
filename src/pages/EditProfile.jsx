// src/pages/EditProfile.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function EditProfile() {
    const [formData, setFormData] = useState({
        nombre: '',
        username: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [canChangeUsername, setCanChangeUsername] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'password') {
            setActiveTab('password');
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/?auth=signin');
                return;
            }

            const { data, error } = await supabase
                .from('usuario')
                .select('nombre, username, fecha_creado, last_username_change')
                .eq('correo', user.email)
                .single();

            if (error) throw error;

            setFormData({
                nombre: data.nombre || '',
                username: data.username || '',
                originalUsername: data.username || '',
            });

            checkUsernameChangeAvailability(data.last_username_change);

        } catch (err) {
            console.error('Error cargando perfil:', err);
            setMessage({ type: 'error', text: 'No se pudo cargar el perfil' });
        } finally {
            setLoading(false);
        }
    };

    const checkUsernameChangeAvailability = (lastChange) => {
        if (!lastChange) {
            setCanChangeUsername(true);
            return;
        }

        const lastChangeDate = new Date(lastChange);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        setCanChangeUsername(lastChangeDate < oneWeekAgo);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const newUsername = formData.username.trim().toLowerCase();
            const changedUsername =
                canChangeUsername &&
                newUsername !== (formData.originalUsername || '').toLowerCase();

            const updateData = {
                nombre: formData.nombre.trim(),
            };

            if (changedUsername) {
                updateData.username = newUsername;
                updateData.last_username_change = new Date().toISOString();
            }

            const { error } = await supabase
                .from('usuario')
                .update(updateData)
                .eq('correo', user.email);

            if (error) {
                if (error.code === '23505') {
                    setMessage({ type: 'error', text: 'Ese usuario ya existe.' });
                    return;
                }
                throw error;
            }

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });

            localStorage.setItem('kerana_profile_updated', String(Date.now()));
            if (changedUsername) {
                localStorage.setItem('kerana_username_cache', newUsername);
            }
            localStorage.setItem('kerana_name_cache', formData.nombre?.trim() || '');

            if (changedUsername) {
                await supabase.auth.updateUser({ data: { username: newUsername } });
            }

            setTimeout(() => navigate('/profile'), 1500);
        } catch (err) {
            console.error('Error guardando perfil:', err);
            setMessage({ type: 'error', text: 'Error al guardar los cambios' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // Validaciones
            if (!passwordData.currentPassword) {
                setMessage({ type: 'error', text: 'Debes ingresar tu contraseña actual' });
                return;
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
                return;
            }

            if (passwordData.newPassword.length < 6) {
                setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
                return;
            }

            // Verificar contraseña actual reautenticando
            const { data: { user } } = await supabase.auth.getUser();

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword
            });

            if (signInError) {
                setMessage({ type: 'error', text: 'La contraseña actual es incorrecta' });
                return;
            }

            // Cambiar contraseña
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });

            // Limpiar formulario
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);

        } catch (err) {
            console.error('Error cambiando contraseña:', err);
            setMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#64748b' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Editar Perfil</h1>
                    <p style={subtitleStyle}>Gestioná tu información personal y contraseña</p>
                </div>

                {/* Tabs */}
                <div style={tabsContainerStyle}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={activeTab === 'profile' ? activeTabStyle : tabStyle}
                    >
                        👤 Información Personal
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        style={activeTab === 'password' ? activeTabStyle : tabStyle}
                    >
                        🔐 Contraseña
                    </button>
                </div>

                <Card style={cardStyle}>
                    {message.text && (
                        <div style={{
                            ...messageStyle,
                            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                        }}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' ? (
                        <form onSubmit={handleProfileSubmit} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Nombre completo</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        nombre: e.target.value
                                    }))}
                                    style={inputStyle}
                                    placeholder="Tu nombre completo"
                                    required
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    Usuario
                                    {!canChangeUsername && (
                                        <span style={warningStyle}>
                                            (Podrás cambiar nuevamente en 7 días)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        username: e.target.value.toLowerCase()
                                    }))}
                                    style={inputStyle}
                                    placeholder="nombredeusuario"
                                    disabled={!canChangeUsername}
                                    required
                                />
                                {!canChangeUsername && (
                                    <p style={helpTextStyle}>
                                        El nombre de usuario solo se puede cambiar una vez por semana.
                                    </p>
                                )}
                            </div>

                            <div style={buttonsStyle}>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    style={{ flex: 1 }}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/profile')}
                                    style={{ flex: 1 }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Contraseña actual</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        currentPassword: e.target.value
                                    }))}
                                    style={inputStyle}
                                    placeholder="Ingresá tu contraseña actual"
                                    required
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Nueva contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        newPassword: e.target.value
                                    }))}
                                    style={inputStyle}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>

                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>Confirmar nueva contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData(prev => ({
                                        ...prev,
                                        confirmPassword: e.target.value
                                    }))}
                                    style={inputStyle}
                                    placeholder="Repetí la nueva contraseña"
                                    required
                                />
                            </div>

                            <div style={passwordHelpStyle}>
                                <p style={helpTextStyle}>
                                    💡 <strong>Requisitos de contraseña:</strong>
                                </p>
                                <ul style={helpListStyle}>
                                    <li>Mínimo 6 caracteres</li>
                                    <li>Recomendamos usar mayúsculas, minúsculas y números</li>
                                </ul>
                            </div>

                            <div style={buttonsStyle}>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    style={{ flex: 1 }}
                                >
                                    {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/profile')}
                                    style={{ flex: 1 }}
                                >
                                    Volver al Perfil
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}

// Estilos (los mismos que antes)
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 16px',
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '32px',
};

const titleStyle = {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0b1e3a',
    margin: '0 0 8px 0',
};

const subtitleStyle = {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
};

const tabsContainerStyle = {
    display: 'flex',
    background: 'white',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
};

const tabStyle = {
    flex: 1,
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.2s ease',
};

const activeTabStyle = {
    ...tabStyle,
    background: '#2563eb',
    color: 'white',
};

const cardStyle = {
    padding: '32px',
    background: 'white',
    borderRadius: '16px',
};

const formStyle = {
    display: 'grid',
    gap: '24px',
};

const inputGroupStyle = {
    display: 'grid',
    gap: '8px',
};

const labelStyle = {
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
};

const inputStyle = {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    background: '#fff',
    transition: 'border-color 0.2s',
};

const warningStyle = {
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: 'normal',
    marginLeft: '8px',
};

const helpTextStyle = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0 0',
};

const passwordHelpStyle = {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
};

const helpListStyle = {
    margin: '8px 0 0 0',
    paddingLeft: '16px',
    color: '#6b7280',
    fontSize: '12px',
};

const messageStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: '24px',
};

const buttonsStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
};