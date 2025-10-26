import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAvatar } from '../contexts/AvatarContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faLock,
    faTrash,
    faIdCard,
    faAt,
    faAlignLeft,
    faCamera,
    faCheck,
    faTimes,
    faUpload,
    faExclamationTriangle,
    faInfoCircle,
    faCheckCircle,
    faTimesCircle,
    faCog
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';

export default function EditProfile() {
    const [formData, setFormData] = useState({
        nombre: '',
        username: '',
        bio: '',
        linkedin: '',
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
        if (tab === 'delete') {
            setActiveTab('delete');
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
                .select('nombre, username, bio, linkedin, fecha_creado, last_username_change')
                .eq('correo', user.email)
                .single();

            if (error) throw error;

            setFormData({
                nombre: data.nombre || '',
                username: data.username || '',
                bio: data.bio || '',
                linkedin: data.linkedin || '',
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
                bio: formData.bio.trim(),
                linkedin: formData.linkedin.trim(),
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

            const { data: { user } } = await supabase.auth.getUser();

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword
            });

            if (signInError) {
                setMessage({ type: 'error', text: 'La contraseña actual es incorrecta' });
                return;
            }

            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });

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

    const handleDeleteAccount = async () => {
        setMessage({
            type: 'delete_confirmation',
            text: '¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.'
        });
    };

    const confirmDeleteAccount = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No hay usuario logueado');

            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (usuarioError || !usuarioData) {
                throw new Error('No se pudo encontrar tu perfil de usuario');
            }

            const usuarioId = usuarioData.id_usuario;

            const deleteOperations = [
                supabase.from('apunte_fav').delete().eq('id_usuario', usuarioId),
                supabase.from('usuario_fav').delete().eq('id_usuario', usuarioId),
                supabase.from('apunte').delete().eq('id_usuario', usuarioId),
                supabase.from('rating').delete().eq('user_id', user.id),
                supabase.from('mentor_aplicacion').delete().eq('id_usuario', user.id),
            ];

            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', usuarioId)
                .single();

            if (mentorData) {
                deleteOperations.push(
                    supabase.from('mentor_materia').delete().eq('id_mentor', mentorData.id_mentor),
                    supabase.from('mentor_disponibilidad').delete().eq('id_mentor', mentorData.id_mentor),
                    supabase.from('mentor').delete().eq('id_mentor', mentorData.id_mentor)
                );
            }

            await Promise.allSettled(deleteOperations);

            const { error: deleteError } = await supabase
                .from('usuario')
                .delete()
                .eq('auth_id', user.id);

            if (deleteError) {
                throw new Error('No se pudo eliminar tu cuenta de la base de datos');
            }

            await supabase.auth.signOut();

            setMessage({ type: 'success', text: 'Cuenta eliminada correctamente. Redirigiendo...' });

            localStorage.removeItem('kerana_username_cache');
            localStorage.removeItem('kerana_name_cache');
            localStorage.removeItem('kerana_remember');

            setTimeout(() => navigate('/'), 2000);

        } catch (err) {
            console.error('Error eliminando cuenta:', err);
            setMessage({
                type: 'error',
                text: 'Cuenta parcialmente eliminada. Contacta soporte para eliminación completa.'
            });
        } finally {
            setSaving(false);
        }
    };

    const cancelDelete = () => {
        setMessage({ type: '', text: '' });
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={headerStyle}>
                    <h1 style={titleStyle}>
                        <FontAwesomeIcon icon={faCog} style={{ marginRight: 8 }} />
                        Configuración de Perfil
                    </h1>
                    <p style={subtitleStyle}>Gestioná tu información personal, contraseña y cuenta</p>
                </div>

                <div style={tabsContainerStyle}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={activeTab === 'profile' ? activeTabStyle : tabStyle}
                    >
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: 6 }} />
                        Información Personal
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        style={activeTab === 'password' ? activeTabStyle : tabStyle}
                    >
                        <FontAwesomeIcon icon={faLock} style={{ marginRight: 6 }} />
                        Contraseña
                    </button>
                    <button
                        onClick={() => setActiveTab('delete')}
                        style={activeTab === 'delete' ? activeTabStyle : tabStyle}
                    >
                        <FontAwesomeIcon icon={faTrash} style={{ marginRight: 6 }} />
                        Eliminar Cuenta
                    </button>
                </div>

                <Card style={cardStyle}>
                    {message.text && message.type !== 'delete_confirmation' && (
                        <div style={{
                            ...messageStyle,
                            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                        }}>
                            <FontAwesomeIcon
                                icon={message.type === 'success' ? faCheckCircle : faTimesCircle}
                                style={{ marginRight: 8 }}
                            />
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <>
                            <div style={{ marginBottom: 24 }}>
                                <AvatarChangeInline />
                            </div>
                            <form onSubmit={handleProfileSubmit} style={formStyle}>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>
                                        <FontAwesomeIcon icon={faIdCard} style={{ marginRight: 6 }} />
                                        Nombre completo
                                    </label>
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
                                        <FontAwesomeIcon icon={faAt} style={{ marginRight: 6 }} />
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

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>
                                        <FontAwesomeIcon icon={faAlignLeft} style={{ marginRight: 6 }} />
                                        Biografía
                                    </label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            bio: e.target.value
                                        }))}
                                        style={{...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'Inter, sans-serif'}}
                                        placeholder="Contanos un poco sobre vos..."
                                        maxLength={500}
                                    />
                                    <p style={helpTextStyle}>
                                        {formData.bio.length}/500 caracteres
                                    </p>
                                </div>

                                <div style={inputGroupStyle}>
                                    <label style={labelStyle}>
                                        <FontAwesomeIcon icon={faLinkedin} style={{ marginRight: 6 }} />
                                        LinkedIn
                                    </label>
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
                                    <p style={helpTextStyle}>
                                        URL completa de tu perfil de LinkedIn
                                    </p>
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
                        </>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} style={formStyle}>
                            <div style={inputGroupStyle}>
                                <label style={labelStyle}>
                                    <FontAwesomeIcon icon={faLock} style={{ marginRight: 6 }} />
                                    Contraseña actual
                                </label>
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
                                <label style={labelStyle}>
                                    <FontAwesomeIcon icon={faLock} style={{ marginRight: 6 }} />
                                    Nueva contraseña
                                </label>
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
                                <label style={labelStyle}>
                                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: 6 }} />
                                    Confirmar nueva contraseña
                                </label>
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
                                    <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: 6 }} />
                                    <strong>Requisitos de contraseña:</strong>
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

                    {activeTab === 'delete' && (
                        <div style={deleteSectionStyle}>
                            {message.type === 'delete_confirmation' ? (
                                <div style={confirmationSectionStyle}>
                                    <h3 style={warningTitleStyle}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8 }} />
                                        Confirmar Eliminación
                                    </h3>
                                    <p style={warningTextStyle}>
                                        ¿Estás seguro de que querés eliminar tu cuenta? Esta acción no se puede deshacer.
                                    </p>
                                    <p style={warningTextStyle}>
                                        <strong>Se eliminarán todos tus datos permanentemente.</strong>
                                    </p>
                                    <div style={modalButtonsStyle}>
                                        <button
                                            onClick={confirmDeleteAccount}
                                            disabled={saving}
                                            style={saving ? deleteButtonDisabledStyle : deleteButtonStyle}
                                            onMouseEnter={(e) => !saving && (e.target.style.background = '#b91c1c')}
                                            onMouseLeave={(e) => !saving && (e.target.style.background = '#dc2626')}
                                        >
                                            {saving ? 'Eliminando...' : 'Confirmar'}
                                        </button>
                                        <button
                                            onClick={cancelDelete}
                                            disabled={saving}
                                            style={cancelButtonStyle}
                                            onMouseEnter={(e) => !saving && (e.target.style.background = '#f3f4f6')}
                                            onMouseLeave={(e) => !saving && (e.target.style.background = '#ffffff')}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={warningSectionStyle}>
                                    <h3 style={warningTitleStyle}>
                                        <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8 }} />
                                        Eliminar Cuenta Permanentemente
                                    </h3>
                                    <p style={warningTextStyle}>
                                        Esta acción <strong>no se puede deshacer</strong>. Se eliminarán todos tus datos:
                                    </p>
                                    <ul style={warningListStyle}>
                                        <li>Tu perfil y información personal</li>
                                        <li>Todos los apuntes que hayas subido</li>
                                        <li>Tus reseñas y calificaciones</li>
                                        <li>Tu historial de favoritos</li>
                                        <li>Tus aplicaciones como mentor</li>
                                    </ul>
                                    <p style={warningTextStyle}>
                                        <strong>Nota:</strong> Por seguridad, tu email permanecerá en nuestro sistema de autenticación.
                                    </p>

                                    <div style={singleButtonStyle}>
                                        <button
                                            onClick={handleDeleteAccount}
                                            style={deleteButtonStyle}
                                            onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
                                            onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                                        >
                                            <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
                                            Eliminar mi cuenta
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

function AvatarChangeInline() {
    const [currentAvatar, setCurrentAvatar] = useState(null);
    const [preview, setPreview] = useState(null);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [canChange, setCanChange] = useState(true);
    const [changesLeft, setChangesLeft] = useState(2);
    const [nextChangeDate, setNextChangeDate] = useState(null);
    const [showFullImage, setShowFullImage] = useState(false);
    const { updateAvatar } = useAvatar();

    useEffect(() => {
        checkAvatarStatus();
    }, []);

    const checkAvatarStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('usuario')
                .select('id_usuario, foto')
                .eq('auth_id', user.id)
                .single();

            if (!profile) return;

            setCurrentAvatar(profile.foto);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentChanges } = await supabase
                .from('avatar_changes')
                .select('changed_at')
                .eq('user_id', profile.id_usuario)
                .gte('changed_at', sevenDaysAgo.toISOString())
                .order('changed_at', { ascending: false });

            const changesCount = recentChanges?.length || 0;
            const remaining = Math.max(0, 2 - changesCount);

            setChangesLeft(remaining);

            if (remaining === 0 && recentChanges && recentChanges.length > 0) {
                const oldestChange = new Date(recentChanges[recentChanges.length - 1].changed_at);
                const nextDate = new Date(oldestChange);
                nextDate.setDate(nextDate.getDate() + 7);

                setNextChangeDate(nextDate);
                setCanChange(new Date() >= nextDate);
            } else {
                setCanChange(true);
            }
        } catch (e) {
            console.error("Error checking avatar status:", e);
        }
    };

    const onFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setMessage("Debe ser una imagen");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage("Máximo 5MB");
            return;
        }
        const fr = new FileReader();
        fr.onload = (ev) => setPreview(ev.target.result);
        fr.readAsDataURL(file);
        setMessage("");
    };

    const onClickSubir = () => {
        if (!canChange) {
            setMessage("Debes esperar para cambiar tu foto");
            return;
        }
        if (!preview) {
            setMessage("Elegí una imagen primero");
            return;
        }
        setOpenConfirm(true);
    };

    const onConfirm = async () => {
        setUploading(true);
        setMessage("");
        try {
            const fileInput = document.getElementById("avatar-upload-inline");
            const file = fileInput?.files?.[0];
            if (!file) throw new Error("No hay archivo");

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            const { data: perfil, error: perErr } = await supabase
                .from("usuario")
                .select("id_usuario, foto")
                .eq("auth_id", user.id)
                .maybeSingle();
            if (perErr || !perfil) throw new Error("Perfil no encontrado");

            const ext = file.name.split(".").pop();
            const fileName = `${user.id}/avatar-${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { cacheControl: "3600", upsert: false });
            if (upErr) throw upErr;

            const { data: pub } = supabase.storage.from("avatars").getPublicUrl(fileName);
            const publicUrl = pub?.publicUrl || "";

            const { error: updErr } = await supabase
                .from("usuario")
                .update({ foto: publicUrl })
                .eq("id_usuario", perfil.id_usuario);
            if (updErr) throw updErr;

            await supabase
                .from('avatar_changes')
                .insert({
                    user_id: perfil.id_usuario,
                    old_photo: perfil.foto,
                    new_photo: publicUrl
                });

            if (perfil.foto && perfil.foto.includes("/storage/v1/object/public/avatars/")) {
                const oldPath = perfil.foto.split("/avatars/")[1];
                if (oldPath) {
                    await supabase.storage.from("avatars").remove([oldPath]);
                }
            }

            setCurrentAvatar(publicUrl);
            setPreview(null);
            setOpenConfirm(false);
            setMessage("Avatar actualizado");

            updateAvatar(publicUrl);

            setTimeout(() => {
                checkAvatarStatus();
                setMessage("");
                const el = document.getElementById("avatar-upload-inline");
                if (el) el.value = "";
            }, 1500);
        } catch (e) {
            console.error(e);
            setMessage(`Error: ${e.message}`);
        } finally {
            setUploading(false);
        }
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('es-UY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 700, color: "#0f172a", fontSize: 15, display: "block", marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                <FontAwesomeIcon icon={faCamera} style={{ marginRight: 6 }} />
                Foto de perfil
            </label>

            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
                padding: 16,
                background: "#f8fafc",
                borderRadius: 12,
                border: "2px solid #e5e7eb",
            }}>
                <div
                    onClick={() => (currentAvatar || preview) && setShowFullImage(true)}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "4px solid #e5e7eb",
                        flexShrink: 0,
                        cursor: (currentAvatar || preview) ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                        if (currentAvatar || preview) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                >
                    {preview ? (
                        <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : currentAvatar ? (
                        <img src={currentAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <div style={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 32,
                        }}>
                            ?
                        </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                        {preview ? 'Vista previa' : 'Foto actual'}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                        {canChange ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                                <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} />
                                {changesLeft} {changesLeft === 1 ? 'cambio disponible' : 'cambios disponibles'}
                            </span>
                        ) : (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                Próximo cambio: {nextChangeDate ? formatDate(nextChangeDate) : 'Calculando...'}
                            </span>
                        )}
                    </div>
                    {preview && (
                        <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
                            Hacé click en la imagen para verla en grande
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                padding: '12px 14px',
                background: '#eff6ff',
                border: '2px solid #bfdbfe',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 12,
                color: '#1e40af',
                lineHeight: 1.6,
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FontAwesomeIcon icon={faInfoCircle} />
                    Límites de cambio
                </div>
                <div style={{ paddingLeft: 8 }}>
                    • Podés cambiar tu foto <strong>2 veces</strong><br />
                    • Para el tercer cambio, debes esperar <strong>7 días</strong> desde el primer cambio<br />
                    • Tamaño máximo: <strong>5MB</strong> (JPG, PNG, WEBP)
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '10px 14px',
                    marginBottom: 14,
                    borderRadius: 8,
                    background: message.includes("actualizado") ? "#d1fae5" : "#fee2e2",
                    color: message.includes("actualizado") ? "#065f46" : "#991b1b",
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                    border: `2px solid ${message.includes("actualizado") ? "#6ee7b7" : "#fecaca"}`,
                    fontFamily: 'Inter, sans-serif'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
                <input
                    id="avatar-upload-inline"
                    type="file"
                    accept="image/*"
                    onChange={onFile}
                    disabled={!canChange || uploading}
                    style={{
                        flex: 1,
                        padding: "10px 12px",
                        fontSize: 13,
                        border: "2px solid #d1d5db",
                        borderRadius: 8,
                        background: canChange && !uploading ? "#fff" : "#f3f4f6",
                        cursor: canChange && !uploading ? "pointer" : "not-allowed",
                        opacity: canChange && !uploading ? 1 : 0.6,
                        fontFamily: 'Inter, sans-serif'
                    }}
                />
                {preview && (
                    <button
                        type="button"
                        onClick={() => {
                            setPreview(null);
                            const el = document.getElementById("avatar-upload-inline");
                            if (el) el.value = "";
                            setMessage("");
                        }}
                        style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#374151",
                            background: "#fff",
                            border: "2px solid #e5e7eb",
                            borderRadius: 8,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            fontFamily: 'Inter, sans-serif'
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#f9fafb"}
                        onMouseLeave={(e) => e.target.style.background = "#fff"}
                    >
                        <FontAwesomeIcon icon={faTimes} style={{ marginRight: 4 }} />
                        Cancelar
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClickSubir}
                    disabled={!preview || uploading || !canChange}
                    style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        background: (!preview || uploading || !canChange) ? "#9ca3af" : "#2563eb",
                        border: "none",
                        borderRadius: 8,
                        cursor: (!preview || uploading || !canChange) ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                        if (preview && !uploading && canChange) {
                            e.target.style.background = "#1d4ed8";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (preview && !uploading && canChange) {
                            e.target.style.background = "#2563eb";
                        }
                    }}
                >
                    <FontAwesomeIcon icon={faUpload} style={{ marginRight: 4 }} />
                    {uploading ? "Subiendo..." : "Subir"}
                </button>
            </div>

            {openConfirm && preview && (
                <div
                    onClick={() => !uploading && setOpenConfirm(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "grid",
                        placeItems: "center",
                        zIndex: 9999,
                        padding: 20,
                        cursor: uploading ? "default" : "pointer",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: 16,
                            padding: 24,
                            width: "min(90vw, 400px)",
                            textAlign: "center",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                            cursor: "default",
                            fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
                            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 8, color: '#f59e0b' }} />
                            Confirmar nuevo avatar
                        </div>
                        <div style={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "4px solid #e5e7eb",
                            margin: "0 auto 16px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        }}>
                            <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>
                            ¿Estás seguro que querés cambiar tu foto de perfil?
                            {changesLeft <= 1 && (
                                <span style={{ display: "block", marginTop: 8, color: "#ef4444", fontWeight: 600 }}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: 4 }} />
                                    Te {changesLeft === 1 ? "queda 1 cambio" : "quedan 0 cambios"} disponible{changesLeft !== 1 ? "s" : ""}
                                </span>
                            )}
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                type="button"
                                onClick={() => setOpenConfirm(false)}
                                disabled={uploading}
                                style={{
                                    flex: 1,
                                    padding: "10px 16px",
                                    fontWeight: 600,
                                    color: "#374151",
                                    background: "#fff",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: 8,
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    opacity: uploading ? 0.5 : 1,
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                <FontAwesomeIcon icon={faTimes} style={{ marginRight: 4 }} />
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={uploading}
                                style={{
                                    flex: 1,
                                    padding: "10px 16px",
                                    fontWeight: 600,
                                    color: "#fff",
                                    background: uploading ? "#9ca3af" : "#2563eb",
                                    border: "none",
                                    borderRadius: 8,
                                    cursor: uploading ? "not-allowed" : "pointer",
                                    fontFamily: 'Inter, sans-serif'
                                }}
                            >
                                <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} />
                                {uploading ? "Subiendo..." : "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFullImage && (currentAvatar || preview) && (
                <div
                    onClick={() => setShowFullImage(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.9)",
                        backdropFilter: "blur(8px)",
                        zIndex: 9999,
                        display: "grid",
                        placeItems: "center",
                        padding: 20,
                        cursor: "pointer",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            cursor: "default",
                        }}
                    >
                        <button
                            onClick={() => setShowFullImage(false)}
                            style={{
                                position: "absolute",
                                top: -50,
                                right: 0,
                                background: "rgba(255, 255, 255, 0.2)",
                                border: "none",
                                borderRadius: "50%",
                                width: 40,
                                height: 40,
                                color: "#fff",
                                fontSize: 20,
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
                            onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <img
                            src={preview || currentAvatar}
                            alt="Avatar"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "90vh",
                                borderRadius: 16,
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 16px',
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};

const subtitleStyle = {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
    fontFamily: 'Inter, sans-serif',
};

const tabsContainerStyle = {
    display: 'flex',
    background: 'white',
    borderRadius: '12px',
    padding: '8px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    gap: '8px',
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
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};

const inputStyle = {
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    background: '#fff',
    transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};

const messageStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: '24px',
    fontFamily: 'Inter, sans-serif',
};

const buttonsStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
};

const deleteSectionStyle = {
    display: 'grid',
    gap: '24px',
};

const warningSectionStyle = {
    padding: '20px',
    background: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
};

const warningTitleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#dc2626',
    margin: '0 0 16px 0',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
};

const warningTextStyle = {
    color: '#7f1d1d',
    margin: '0 0 12px 0',
    lineHeight: '1.5',
    fontFamily: 'Inter, sans-serif',
};

const warningListStyle = {
    color: '#7f1d1d',
    paddingLeft: '20px',
    margin: '12px 0',
    lineHeight: '1.6',
    fontFamily: 'Inter, sans-serif',
};

const confirmationSectionStyle = {
    padding: '24px',
    background: '#fef2f2',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    textAlign: 'center',
};

const singleButtonStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '24px',
};

const deleteButtonStyle = {
    padding: '12px 32px',
    background: '#dc2626',
    color: 'white',
    border: '1px solid #dc2626',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    minWidth: '200px',
    fontFamily: 'Inter, sans-serif',
};

const deleteButtonDisabledStyle = {
    ...deleteButtonStyle,
    background: '#9ca3af',
    border: '1px solid #9ca3af',
    cursor: 'not-allowed',
};

const cancelButtonStyle = {
    padding: '12px 32px',
    background: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    flex: 1,
    fontFamily: 'Inter, sans-serif',
};

const modalButtonsStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
};