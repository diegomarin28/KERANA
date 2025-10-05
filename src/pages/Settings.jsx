// src/pages/Settings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        if (!window.confirm(
            '¿Estás seguro de que querés eliminar tu cuenta?\n\n' +
            'Se eliminarán todos tus datos permanentemente.\n' +
            'Esta acción NO se puede deshacer.'
        )) {
            return;
        }

        const confirmation = window.confirm('¿Realmente querés eliminar tu cuenta?');
        if (!confirmation) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay usuario logueado');

            // Obtener el ID numérico del usuario
            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            const usuarioId = usuarioData.id_usuario;

            // Eliminar datos del usuario
            await Promise.all([
                supabase.from('apunte').delete().eq('id_usuario', usuarioId),
                supabase.from('califica').delete().eq('id_usuario', usuarioId),
                supabase.from('evalua').delete().eq('id_usuario', usuarioId)
            ]);

            // Eliminar el usuario
            await supabase.from('usuario').delete().eq('auth_id', user.id);

            // Cerrar sesión
            await supabase.auth.signOut();

            setMessage({ type: 'success', text: 'Cuenta eliminada. Redirigiendo...' });
            setTimeout(() => navigate('/'), 2000);

        } catch (err) {
            console.error('Error eliminando cuenta:', err);
            setMessage({ type: 'error', text: 'Error al eliminar la cuenta' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Configuración</h1>
                    <p style={subtitleStyle}>Gestioná tu cuenta y preferencias</p>
                </div>

                {/* Cuenta */}
                <Card style={cardStyle}>
                    <h3 style={sectionTitleStyle}>Cuenta</h3>
                    <div style={sectionContentStyle}>
                        <div style={settingItemStyle}>
                            <div style={settingInfoStyle}>
                                <strong style={settingTitleStyle}>Perfil público</strong>
                                <p style={settingDescriptionStyle}>Cómo ven tu perfil otros usuarios</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/profile')}
                                size="small"
                            >
                                Ver
                            </Button>
                        </div>

                        <div style={settingItemStyle}>
                            <div style={settingInfoStyle}>
                                <strong style={settingTitleStyle}>Editar perfil y contraseña</strong>
                                <p style={settingDescriptionStyle}>Actualizá tu nombre, usuario y contraseña</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/edit-profile')}
                                size="small"
                            >
                                Editar
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Privacidad y Legal */}
                <Card style={cardStyle}>
                    <h3 style={sectionTitleStyle}>Privacidad y Legal</h3>
                    <div style={sectionContentStyle}>
                        <div style={settingItemStyle}>
                            <div style={settingInfoStyle}>
                                <strong style={settingTitleStyle}>Política de Privacidad</strong>
                                <p style={settingDescriptionStyle}>Cómo protegemos tus datos según la ley uruguaya</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/privacidad')}
                                size="small"
                            >
                                Leer
                            </Button>
                        </div>

                        <div style={settingItemStyle}>
                            <div style={settingInfoStyle}>
                                <strong style={settingTitleStyle}>Términos de Servicio</strong>
                                <p style={settingDescriptionStyle}>Condiciones de uso de la plataforma</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/terminos')}
                                size="small"
                            >
                                Leer
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Eliminar Cuenta - MÍNIMO Y DISCRETO */}
                <div style={deleteSectionStyle}>
                    <div style={deleteContentStyle}>
                        <p style={deleteTextStyle}>
                            <strong>Eliminar cuenta</strong> - Esta acción es irreversible
                        </p>
                        <Button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            style={deleteButtonStyle}
                        >
                            {loading ? 'Eliminando...' : 'Eliminar cuenta'}
                        </Button>
                    </div>

                    {message.text && (
                        <div style={{
                            ...messageStyle,
                            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                        }}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Estilos minimalistas
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 16px',
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

const cardStyle = {
    padding: '24px',
    marginBottom: '20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
};

const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 20px 0',
};

const sectionContentStyle = {
    // padding ya está en el card
};

const settingItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid #f1f5f9',
};

const settingInfoStyle = {
    flex: 1,
};

const settingTitleStyle = {
    fontSize: '15px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 4px 0',
    display: 'block',
};

const settingDescriptionStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
};

// Eliminar cuenta minimalista
const deleteSectionStyle = {
    marginTop: '32px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
};

const deleteContentStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
};

const deleteTextStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    flex: 1,
    textAlign: 'left',
};

const deleteButtonStyle = {
    background: '#dc2626',
    color: 'white',
    border: '1px solid #dc2626',
    padding: '8px 16px',
    fontSize: '14px',
};

const messageStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '14px',
    fontWeight: '500',
};