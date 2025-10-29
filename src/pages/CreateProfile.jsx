import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAvatar } from '../contexts/AvatarContext';

export default function CreateProfile() {
    const [formData, setFormData] = useState({
        bio: '',
        linkedin: ''
    });
    const [currentAvatar, setCurrentAvatar] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const { updateAvatar } = useAvatar();

    useEffect(() => {
        checkProfile();
    }, []);

    const checkProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/?auth=signin');
                return;
            }

            const { data: profile, error } = await supabase
                .from('usuario')
                .select('nombre, foto, bio, linkedin')
                .eq('auth_id', user.id)
                .single();

            if (error) throw error;

            setUserName(profile.nombre || 'Usuario');
            setCurrentAvatar(profile.foto);

            // Si ya completó el perfil (tiene foto Y bio), redirigir a home
            if (profile.foto && profile.bio) {
                navigate('/');
                return;
            }

            setFormData({
                bio: profile.bio || '',
                linkedin: profile.linkedin || ''
            });

        } catch (err) {
            console.error('Error cargando perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage({ type: 'error', text: 'Debe ser una imagen' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Máximo 5MB' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
        setMessage({ type: '', text: '' });
    };

    const uploadAvatar = async () => {
        const fileInput = document.getElementById("avatar-upload-setup");
        const file = fileInput?.files?.[0];
        if (!file) return null;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { data: perfil } = await supabase
                .from("usuario")
                .select("id_usuario, foto")
                .eq("auth_id", user.id)
                .maybeSingle();

            if (!perfil) throw new Error("Perfil no encontrado");

            const ext = file.name.split(".").pop();
            const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { cacheControl: "3600", upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicData } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            return publicData?.publicUrl || null;

        } catch (err) {
            console.error('Error subiendo avatar:', err);
            setMessage({ type: 'error', text: 'Error al subir la foto' });
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            let avatarUrl = currentAvatar;

            // Si hay un nuevo avatar, subirlo
            if (preview) {
                avatarUrl = await uploadAvatar();
                if (!avatarUrl) {
                    setSaving(false);
                    return;
                }
            }

            // Actualizar perfil (todos los campos son opcionales)
            const updateData = {
                foto: avatarUrl || null,
                bio: formData.bio.trim() || null,
                linkedin: formData.linkedin.trim() || null
            };

            const { error } = await supabase
                .from('usuario')
                .update(updateData)
                .eq('auth_id', user.id);

            if (error) throw error;

            // Actualizar contexto si hay avatar
            if (avatarUrl) {
                updateAvatar(avatarUrl);
            }

            setMessage({ type: 'success', text: '¡Perfil completado!' });
            setTimeout(() => navigate('/'), 1500);

        } catch (err) {
            console.error('Error guardando perfil:', err);
            setMessage({ type: 'error', text: 'Error al guardar el perfil' });
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        navigate('/');
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
            <div style={containerStyle}>
                {/* Header con bienvenida */}
                <div style={headerStyle}>
                    <div style={badgeStyle}>KERANA</div>
                    <h1 style={titleStyle}>¡Bienvenido, {userName}! 🎉</h1>
                    <p style={subtitleStyle}>
                        Completá tu perfil para aprovechar al máximo Kerana
                    </p>
                </div>

                {/* Card principal */}
                <div style={cardStyle}>
                    {message.text && (
                        <div style={{
                            ...messageStyle,
                            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                            color: message.type === 'success' ? '#065f46' : '#991b1b',
                        }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={formStyle}>
                        {/* Avatar */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>📸 Foto de perfil (opcional)</label>
                            <p style={hintStyle}>
                                Agregá una foto para que otros usuarios te reconozcan, o mantené tu inicial
                            </p>

                            <div style={avatarContainerStyle}>
                                <div style={avatarWrapperStyle}>
                                    {preview ? (
                                        <img src={preview} alt="preview" style={avatarImageStyle} />
                                    ) : currentAvatar ? (
                                        <img src={currentAvatar} alt="avatar" style={avatarImageStyle} />
                                    ) : (
                                        <div style={avatarPlaceholderStyle}>
                                            <span style={{ fontSize: 48, color: '#fff' }}>
                                                {userName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div style={avatarActionsStyle}>
                                    <input
                                        id="avatar-upload-setup"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        style={fileInputStyle}
                                    />
                                    {preview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreview(null);
                                                const el = document.getElementById("avatar-upload-setup");
                                                if (el) el.value = "";
                                            }}
                                            style={cancelButtonStyle}
                                        >
                                            ✕ Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>📝 Biografía (opcional)</label>
                            <p style={hintStyle}>
                                Contanos un poco sobre vos (máx. 160 caracteres)
                            </p>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    bio: e.target.value.slice(0, 160)
                                }))}
                                style={textareaStyle}
                                placeholder="Ej: Estudiante de Ingeniería, apasionado por la tecnología..."
                                rows={3}
                                maxLength={160}
                            />
                            <div style={charCountStyle}>
                                {formData.bio.length}/160 caracteres
                            </div>
                        </div>

                        {/* LinkedIn */}
                        <div style={sectionStyle}>
                            <label style={labelStyle}>🔗 LinkedIn (opcional)</label>
                            <p style={hintStyle}>
                                Compartí tu perfil profesional
                            </p>
                            <input
                                type="url"
                                value={formData.linkedin}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    linkedin: e.target.value
                                }))}
                                style={inputStyle}
                                placeholder="https://linkedin.com/in/tu-perfil"
                            />
                        </div>

                        {/* Botones */}
                        <div style={buttonsContainerStyle}>
                            <button
                                type="submit"
                                disabled={saving || uploading}
                                style={saving || uploading ? primaryButtonDisabledStyle : primaryButtonStyle}
                            >
                                {saving ? '⏳ Guardando...' : uploading ? '📤 Subiendo foto...' : '✅ Completar perfil'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                disabled={saving || uploading}
                                style={secondaryButtonStyle}
                            >
                                Hacerlo después
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer con info */}
                <div style={footerInfoStyle}>
                    <p style={footerTextStyle}>
                        💡 <strong>Tip:</strong> Completar tu perfil te ayuda a ganar confianza en la comunidad
                    </p>
                </div>
            </div>
        </div>
    );
}

// 🎨 ESTILOS
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '40px 20px',
    display: 'grid',
    placeItems: 'center'
};

const containerStyle = {
    width: 'min(600px, 92vw)',
    margin: '0 auto'
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: 32
};

const badgeStyle = {
    display: 'inline-block',
    fontSize: 11,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    padding: '6px 14px',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    color: 'white',
    fontWeight: 700,
    marginBottom: 16
};

const titleStyle = {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em'
};

const subtitleStyle = {
    fontSize: 'clamp(14px, 2vw, 16px)',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5
};

const cardStyle = {
    background: 'white',
    borderRadius: 20,
    padding: 32,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0'
};

const formStyle = {
    display: 'grid',
    gap: 28
};

const sectionStyle = {
    display: 'grid',
    gap: 8
};

const labelStyle = {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a'
};

const hintStyle = {
    fontSize: 13,
    color: '#64748b',
    margin: 0
};

const avatarContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    padding: '20px',
    background: '#f8fafc',
    borderRadius: 12,
    border: '2px solid #e2e8f0'
};

const avatarWrapperStyle = {
    width: 100,
    height: 100,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid #e2e8f0',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
};

const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
};

const avatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'Inter, sans-serif'
};

const avatarActionsStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 10
};

const fileInputStyle = {
    fontSize: 13,
    padding: '10px',
    border: '2px dashed #cbd5e1',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif'
};

const cancelButtonStyle = {
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const textareaStyle = {
    padding: '12px 14px',
    fontSize: 15,
    border: '2px solid #d1d5db',
    borderRadius: 10,
    fontFamily: 'Inter, sans-serif',
    resize: 'vertical',
    lineHeight: 1.5
};

const inputStyle = {
    padding: '12px 14px',
    fontSize: 15,
    border: '2px solid #d1d5db',
    borderRadius: 10,
    fontFamily: 'Inter, sans-serif'
};

const charCountStyle = {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    fontFamily: 'Inter, sans-serif'
};

const messageStyle = {
    padding: '14px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 20,
    border: '2px solid',
    fontFamily: 'Inter, sans-serif'
};

const buttonsContainerStyle = {
    display: 'grid',
    gap: 12,
    marginTop: 8
};

const primaryButtonStyle = {
    width: '100%',
    padding: '14px 24px',
    fontSize: 15,
    fontWeight: 700,
    color: 'white',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
    fontFamily: 'Inter, sans-serif'
};

const primaryButtonDisabledStyle = {
    ...primaryButtonStyle,
    background: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
};

const secondaryButtonStyle = {
    width: '100%',
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif'
};

const footerInfoStyle = {
    marginTop: 20,
    textAlign: 'center'
};

const footerTextStyle = {
    fontSize: 13,
    color: '#64748b',
    margin: 0,
    padding: '12px 20px',
    background: 'white',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    fontFamily: 'Inter, sans-serif'
};