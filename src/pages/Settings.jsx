// Settings.jsx (actualizado)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Settings() {
    const [formData, setFormData] = useState({
        nombre: '',
        username: '',
        correo: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    return;
                }

                const { data, error } = await supabase
                    .from('usuario')
                    .select('nombre, username, correo')
                    .eq('correo', user.email)
                    .single();

                if (error) throw error;

                setFormData(data);
            } catch (err) {
                console.error('Error al cargar perfil:', err);
                setMessage({ type: 'error', text: 'No se pudo cargar la configuración' });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []); // Quitamos navigate de las dependencias

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('usuario')
                .update({
                    nombre: formData.nombre.trim(),
                    username: formData.username.trim(),
                })
                .eq('correo', user.email);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        } catch (err) {
            console.error('Error al guardar:', err);
            setMessage({ type: 'error', text: 'Error al guardar los cambios' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>Cargando configuración...</div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={titleStyle}>Ajustes</h1>

                <Card style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label htmlFor="nombre" style={labelStyle}>Nombre completo</label>
                            <input
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div>
                            <label htmlFor="username" style={labelStyle}>Nombre de usuario</label>
                            <input
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                                placeholder="ej: juanperez"
                            />
                        </div>

                        <div>
                            <label htmlFor="correo" style={labelStyle}>Correo electrónico</label>
                            <input
                                id="correo"
                                name="correo"
                                value={formData.correo}
                                style={{ ...inputStyle, background: '#f1f5f9', cursor: 'not-allowed' }}
                                readOnly
                            />
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                El correo no se puede cambiar. Está vinculado a tu cuenta de autenticación.
                            </p>
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: message.type === 'success' ? '#166534' : '#991b1b',
                                textAlign: 'center'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button
                                type="submit"
                                disabled={saving}
                                style={{ flex: 1 }}
                            >
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/profile')}
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

// Estilos (mantené los mismos)
const pageStyle = {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: '20px 16px',
};

const centerStyle = {
    display: 'grid',
    placeItems: 'center',
    minHeight: '50vh',
    fontSize: '18px',
    color: '#475569',
};

const titleStyle = {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0b1e3a',
    marginBottom: '1.5rem',
    textAlign: 'center',
};

const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#334155',
};

const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    background: '#fff',
    transition: 'border-color 0.2s',
};

inputStyle[':focus'] = {
    outline: 'none',
    borderColor: '#2563eb',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
};