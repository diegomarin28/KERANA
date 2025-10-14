import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { usePrivacySettings } from '../hooks/usePrivacySettings';
import { downloadUserData, getUserDataSummary } from '../utils/exportUserData';
import { supabase } from '../supabase';
import { useAvatar } from '../contexts/AvatarContext';

const TAB_STORAGE_KEY = 'kerana_settings_active_tab';

export default function Settings() {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem(TAB_STORAGE_KEY) || 'account';
    });
    const [saved, setSaved] = useState(false);
    const navigate = useNavigate();

    const {
        settings,
        toggleSetting,
        resetToDefault,
    } = useNotificationSettings();

    useEffect(() => {
        localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    const tabs = [
        { id: 'account', label: 'Cuenta', icon: '👤' },
        { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
        { id: 'privacy', label: 'Privacidad', icon: '🔒' },
        { id: 'appearance', label: 'Apariencia', icon: '🎨' },
    ];

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const notificationTypes = [
        { key: 'nuevo_seguidor', label: 'Nuevos seguidores', icon: '👤' },
        { key: 'solicitud_aceptada', label: 'Solicitudes aceptadas', icon: '✅' },
        { key: 'nuevo_comentario', label: 'Comentarios', icon: '💬' },
        { key: 'nuevo_like', label: 'Likes', icon: '❤️' },
        { key: 'nueva_resenia', label: 'Reseñas', icon: '⭐' },
        { key: 'mentor_acepto', label: 'Mentores', icon: '🎓' },
        { key: 'nuevo_apunte', label: 'Nuevos apuntes', icon: '📄' },
        { key: 'apunte_aprobado', label: 'Aprobados', icon: '✔️' },
        { key: 'mentor_aprobado', label: 'Mentor', icon: '🏆' },
        { key: 'system', label: 'Sistema', icon: '⚙️' },
        { key: 'update', label: 'Actualizaciones', icon: '🆕' },
    ];

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Header */}
                <div style={headerStyle}>
                    <button
                        onClick={() => navigate(-1)}
                        style={backButtonStyle}
                        onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                    >
                        ← Volver
                    </button>
                    <h1 style={titleStyle}>Configuración</h1>
                    <p style={subtitleStyle}>
                        Personalizá tu experiencia en Kerana
                    </p>
                </div>

                {/* Tabs */}
                <div style={tabsContainerStyle}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                ...tabButtonStyle,
                                background: activeTab === tab.id ? '#2563eb' : '#fff',
                                color: activeTab === tab.id ? '#fff' : '#64748b',
                                borderColor: activeTab === tab.id ? '#2563eb' : '#e5e7eb',
                            }}
                        >
                            <span style={{ fontSize: 16 }}>{tab.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    {activeTab === 'account' && <AccountTab navigate={navigate} />}
                    {activeTab === 'notifications' && (
                        <NotificationsTab
                            settings={settings}
                            toggleSetting={toggleSetting}
                            resetToDefault={resetToDefault}
                            notificationTypes={notificationTypes}
                            saved={saved}
                            onSave={handleSave}
                        />
                    )}
                    {activeTab === 'privacy' && <PrivacyTab navigate={navigate} />}
                    {activeTab === 'appearance' && <AppearanceTab />}
                </div>
            </div>
        </div>
    );
}

// ============================================
// TAB: CUENTA
// ============================================
function AccountTab({ navigate }) {
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setMessage('❌ Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 6) {
            setMessage('❌ Mínimo 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setMessage('✅ Contraseña actualizada');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setChangePasswordOpen(false);
                setMessage('');
            }, 2000);
        } catch (error) {
            setMessage(`❌ ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card title="Información de Cuenta">
                <p style={{ color: '#64748b', marginBottom: 14, fontSize: 13 }}>
                    Administrá tu información personal.
                </p>
                <button onClick={() => navigate('/profile')} style={linkButtonStyle}>
                    👤 Mi perfil →
                </button>
                <button onClick={() => navigate('/edit-profile')} style={linkButtonStyle}>
                    ✏️ Editar perfil →
                </button>
            </Card>

            <Card title="Seguridad">
                {!changePasswordOpen ? (
                    <button onClick={() => setChangePasswordOpen(true)} style={linkButtonStyle}>
                        🔑 Cambiar contraseña →
                    </button>
                ) : (
                    <div style={{ marginTop: 12 }}>
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            type="password"
                            placeholder="Confirmar"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={inputStyle}
                        />
                        {message && (
                            <p style={{ fontSize: 12, margin: '6px 0', color: message.includes('✅') ? '#10b981' : '#ef4444' }}>
                                {message}
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                style={{ ...primaryButtonStyle, flex: 1, opacity: loading ? 0.5 : 1 }}
                            >
                                {loading ? 'Cambiando...' : 'Cambiar'}
                            </button>
                            <button
                                onClick={() => {
                                    setChangePasswordOpen(false);
                                    setMessage('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                style={{ ...secondaryButtonStyle, flex: 1 }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* FOTO DE PERFIL */}
            <Card title="Foto de Perfil">
                <AvatarChangeSection />
            </Card>

            {/* ✅ GESTIÓN DE DATOS FUNCIONAL */}
            <Card title="Gestión de Datos">
                <DataManagementSection />
            </Card>
        </>
    );
}

// ============================================
// GESTIÓN DE DATOS (FUNCIONAL)
// ============================================
function DataManagementSection() {
    const [summary, setSummary] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        const data = await getUserDataSummary();
        setSummary(data);
    };

    const handleDownload = async () => {
        setDownloading(true);
        setMessage('');

        try {
            const success = await downloadUserData();

            if (success) {
                setMessage('✅ Datos descargados');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Error al descargar');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('❌ Error al descargar');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <>
            <p style={{ color: '#64748b', marginBottom: 14, fontSize: 13 }}>
                Descargá todos tus datos en formato JSON.
            </p>

            {/* Resumen */}
            {summary && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                    marginBottom: 14,
                    padding: 10,
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                }}>
                    <DataStat label="Notificaciones" value={summary.notificaciones} />
                    <DataStat label="Apuntes" value={summary.apuntes} />
                    <DataStat label="Favoritos" value={summary.favoritos} />
                    <DataStat label="Reseñas" value={summary.reseñas} />
                </div>
            )}

            {message && (
                <div style={{
                    padding: '8px 12px',
                    marginBottom: 10,
                    borderRadius: 6,
                    background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
                    color: message.includes('✅') ? '#065f46' : '#991b1b',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    {message}
                </div>
            )}

            <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                    ...linkButtonStyle,
                    opacity: downloading ? 0.6 : 1,
                    cursor: downloading ? 'not-allowed' : 'pointer',
                }}
            >
                📥 {downloading ? 'Descargando...' : 'Descargar mis datos'} →
            </button>

            <button
                onClick={() => window.open('mailto:soporte@kerana.com?subject=Solicitud de eliminación de cuenta')}
                style={{...linkButtonStyle, color: '#ef4444'}}
            >
                🗑️ Eliminar cuenta →
            </button>
        </>
    );
}

function DataStat({ label, value }) {
    return (
        <div style={{
            padding: '6px 8px',
            background: '#fff',
            borderRadius: 6,
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb', marginBottom: 2 }}>
                {value}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                {label}
            </div>
        </div>
    );
}

// ============================================
// TAB: NOTIFICACIONES
// ============================================
function NotificationsTab({ settings, toggleSetting, resetToDefault, notificationTypes, saved, onSave }) {
    return (
        <>
            <Card title="Configuraciones Generales">
                <div style={{ display: 'grid', gap: 8 }}>
                    <SettingToggle label="Sonido" description="Reproducir al recibir" checked={settings.sonido} onChange={() => toggleSetting('sonido')} icon="🔊" />
                    <SettingToggle label="Popups" description="Mostrar emergentes" checked={settings.toasts} onChange={() => toggleSetting('toasts')} icon="💬" />
                    <SettingToggle label="Badge" description="Contador en header" checked={settings.badge} onChange={() => toggleSetting('badge')} icon="🔔" />
                    <SettingToggle label="Email" description="Próximamente" checked={settings.email} onChange={() => toggleSetting('email')} icon="📧" disabled />
                </div>
            </Card>

            <Card title="Tipos de Notificaciones">
                <div style={{ display: 'grid', gap: 8 }}>
                    {notificationTypes.map(type => (
                        <SettingToggle
                            key={type.key}
                            label={type.label}
                            checked={settings[type.key]}
                            onChange={() => toggleSetting(type.key)}
                            icon={type.icon}
                        />
                    ))}
                </div>
            </Card>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
                <button onClick={onSave} style={primaryButtonStyle}>
                    {saved ? '✓ Guardado' : 'Guardar'}
                </button>
                <button onClick={resetToDefault} style={secondaryButtonStyle}>
                    Restaurar
                </button>
            </div>
        </>
    );
}

// ============================================
// TAB: PRIVACIDAD
// ============================================
function PrivacyTab({ navigate }) {
    const { settings, loading, saving, togglePerfilPublico, toggleMostrarEmail, togglePermitirMensajes } = usePrivacySettings();
    const [saveMessage, setSaveMessage] = useState('');

    const handleToggle = async (toggleFunction, name) => {
        const success = await toggleFunction();
        setSaveMessage(success ? `✅ ${name} actualizado` : `❌ Error`);
        setTimeout(() => setSaveMessage(''), 2000);
    };

    if (loading) {
        return (
            <Card title="Privacidad">
                <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Cargando...</p>
            </Card>
        );
    }

    return (
        <>
            {saveMessage && (
                <div style={{
                    padding: '10px 14px',
                    marginBottom: 14,
                    borderRadius: 8,
                    background: saveMessage.includes('✅') ? '#d1fae5' : '#fee2e2',
                    color: saveMessage.includes('✅') ? '#065f46' : '#991b1b',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    {saveMessage}
                </div>
            )}

            <Card title="Privacidad del Perfil">
                <div style={{ display: 'grid', gap: 8 }}>
                    <SettingToggle label="Perfil público" description="Otros pueden ver" checked={settings.perfil_publico} onChange={() => handleToggle(togglePerfilPublico, 'Perfil')} icon="👁️" disabled={saving} />
                    <SettingToggle label="Mostrar email" description="Visible en perfil" checked={settings.mostrar_email} onChange={() => handleToggle(toggleMostrarEmail, 'Email')} icon="📧" disabled={saving} />
                    <SettingToggle label="Mensajes" description="Permitir contacto" checked={settings.permitir_mensajes} onChange={() => handleToggle(togglePermitirMensajes, 'Mensajes')} icon="💬" disabled={saving} />
                </div>
            </Card>

            <Card title="Políticas">
                <button onClick={() => navigate('/privacy')} style={linkButtonStyle}>🔐 Privacidad →</button>
                <button onClick={() => navigate('/terms')} style={linkButtonStyle}>📄 Términos →</button>
            </Card>
        </>
    );
}

// ============================================
// TAB: APARIENCIA
// ============================================
function AppearanceTab() {
    const [theme, setTheme] = useState('light');
    const [idioma, setIdioma] = useState('es');
    const [compactMode, setCompactMode] = useState(false);

    return (
        <>
            <Card title="Tema">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    <ThemeCard icon="☀️" label="Claro" active={theme === 'light'} onClick={() => setTheme('light')} />
                    <ThemeCard icon="🌙" label="Oscuro" active={theme === 'dark'} onClick={() => alert('Próximamente')} disabled />
                </div>
            </Card>

            <Card title="Idioma">
                <select value={idioma} onChange={(e) => setIdioma(e.target.value)} style={selectStyle}>
                    <option value="es">🇺🇾 Español</option>
                    <option value="en" disabled>🇺🇸 English</option>
                    <option value="pt" disabled>🇧🇷 Português</option>
                </select>
            </Card>

            <Card title="Visualización">
                <SettingToggle label="Modo compacto" description="Reduce espaciado" checked={compactMode} onChange={() => setCompactMode(!compactMode)} icon="📏" />
            </Card>
        </>
    );
}

// ============================================
// COMPONENTES
// ============================================
function Card({ title, children }) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: 18,
            marginBottom: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
            <h2 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                {title}
            </h2>
            {children}
        </div>
    );
}

function SettingToggle({ label, description, checked, onChange, icon, disabled = false }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: checked ? '#eff6ff' : '#f8fafc',
            opacity: disabled ? 0.5 : 1,
            minHeight: 44,
        }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                <div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#0f172a', lineHeight: 1.2 }}>
                        {label}
                    </div>
                    {description && (
                        <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.2, marginTop: 2 }}>
                            {description}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onChange}
                disabled={disabled}
                style={{
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    background: checked ? '#2563eb' : '#cbd5e1',
                    border: 'none',
                    position: 'relative',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: 3,
                    left: checked ? 21 : 3,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );
}

function ThemeCard({ icon, label, active, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: 14,
                borderRadius: 10,
                border: `2px solid ${active ? '#2563eb' : '#e5e7eb'}`,
                background: active ? '#f0f9ff' : '#fff',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: active ? '#2563eb' : '#64748b' }}>
                {label}
            </div>
            {disabled && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>Próximamente</div>}
        </button>
    );
}

// ============================================
// CAMBIO DE AVATAR (CON RESTRICCIONES)
// ============================================
function AvatarChangeSection() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [canChange, setCanChange] = useState(true);
    const [changesLeft, setChangesLeft] = useState(2);
    const [nextChangeDate, setNextChangeDate] = useState(null);
    const [currentAvatar, setCurrentAvatar] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { updateAvatar } = useAvatar();


    useEffect(() => {
        checkAvatarStatus();
    }, []);

    const checkAvatarStatus = async () => {
        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Obtener perfil
            const { data: profile } = await supabase
                .from('usuario')
                .select('id_usuario, foto')
                .eq('auth_id', user.id)
                .single();

            if (!profile) return;

            setCurrentAvatar(profile.foto);

            // Obtener cambios en los últimos 7 días
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
                // Calcular cuándo puede cambiar de nuevo
                const oldestChange = new Date(recentChanges[recentChanges.length - 1].changed_at);
                const nextDate = new Date(oldestChange);
                nextDate.setDate(nextDate.getDate() + 7);

                setNextChangeDate(nextDate);
                setCanChange(new Date() >= nextDate);
            } else {
                setCanChange(true);
            }
        } catch (error) {
            console.error('Error checking avatar status:', error);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            setMessage('❌ Debe ser una imagen');
            return;
        }

        // Validar tamaño
        if (file.size > 5 * 1024 * 1024) {
            setMessage('❌ Máximo 5MB');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!canChange) {
            setMessage('❌ Debes esperar para cambiar tu foto');
            return;
        }

        const fileInput = document.querySelector('#avatar-upload');
        const file = fileInput?.files?.[0];
        if (!file) {
            setMessage('❌ Selecciona una imagen');
            return;
        }

        setUploading(true);
        setMessage('');

        try {
            // Obtener usuario
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // Obtener perfil
            const { data: profile } = await supabase
                .from('usuario')
                .select('id_usuario, foto')
                .eq('auth_id', user.id)
                .single();

            if (!profile) throw new Error('Perfil no encontrado');

            // Subir imagen
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Actualizar BD
            const { error: updateError } = await supabase
                .from('usuario')
                .update({ foto: publicUrl })
                .eq('id_usuario', profile.id_usuario);

            if (updateError) throw updateError;

            // Registrar cambio
            await supabase
                .from('avatar_changes')
                .insert({
                    user_id: profile.id_usuario,
                    old_photo: profile.foto,
                    new_photo: publicUrl
                });

            // Eliminar foto anterior si existe
            if (profile.foto && profile.foto.includes('/storage/v1/object/public/avatars/')) {
                const oldPath = profile.foto.split('/avatars/')[1];
                if (oldPath) {
                    await supabase.storage
                        .from('avatars')
                        .remove([oldPath]);
                }
            }

            setMessage('✅ Foto actualizada');
            setCurrentAvatar(publicUrl);
            setPreview(null);

            // Actualizar contexto sin reload
            updateAvatar(publicUrl);
            console.log('✅ Settings: Avatar actualizado con URL:', publicUrl); // ← AGREGAR
            console.log('🔄 Settings: updateTrigger debería incrementarse ahora');

            // Recargar status
            setTimeout(() => {
                checkAvatarStatus();
                setMessage('');
            }, 1500);

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setMessage(`❌ ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePreview = () => {
        setPreview(null);
        const fileInput = document.querySelector('#avatar-upload');
        if (fileInput) fileInput.value = '';
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
        <div>
            <p style={{ color: '#64748b', marginBottom: 14, fontSize: 13 }}>
                Personalizá tu foto de perfil
            </p>

            {/* Avatar actual */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16,
                padding: 14,
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
            }}>
                <div
                    onClick={() => (currentAvatar || preview) && setShowModal(true)}
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #e5e7eb',
                        flexShrink: 0,
                        cursor: (currentAvatar || preview) ? 'pointer' : 'default',
                        transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (currentAvatar || preview) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : currentAvatar ? (
                        <img src={currentAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#fff',
                            fontSize: 24,
                            fontWeight: 700,
                        }}>
                            ?
                        </div>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        {preview ? 'Vista previa' : 'Foto actual'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                        {canChange ? (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                                ✓ {changesLeft} {changesLeft === 1 ? 'cambio disponible' : 'cambios disponibles'}
                            </span>
                        ) : (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                ⏳ Próximo cambio: {nextChangeDate ? formatDate(nextChangeDate) : 'Calculando...'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Información de límites */}
            <div style={{
                padding: '10px 12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 8,
                marginBottom: 14,
                fontSize: 11,
                color: '#1e40af',
                lineHeight: 1.5,
            }}>
                <strong>ℹ️ Límites:</strong><br />
                • Podés cambiar tu foto 2 veces<br />
                • Para el tercer cambio, debes esperar 7 días desde el primer cambio<br />
                • Tamaño máximo: 5MB (JPG, PNG, WEBP)
            </div>

            {message && (
                <div style={{
                    padding: '8px 12px',
                    marginBottom: 12,
                    borderRadius: 6,
                    background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
                    color: message.includes('✅') ? '#065f46' : '#991b1b',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    {message}
                </div>
            )}

            {/* Input + botones */}
            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={!canChange || uploading}
                    style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: 12,
                        border: '2px solid #e5e7eb',
                        borderRadius: 8,
                        cursor: canChange && !uploading ? 'pointer' : 'not-allowed',
                        opacity: canChange && !uploading ? 1 : 0.5,
                    }}
                />
                {preview && (
                    <button
                        onClick={handleRemovePreview}
                        style={{
                            ...secondaryButtonStyle,
                            padding: '8px 12px',
                        }}
                    >
                        ✕
                    </button>
                )}
                <button
                    onClick={handleUpload}
                    disabled={!canChange || uploading || !preview}
                    style={{
                        ...primaryButtonStyle,
                        padding: '8px 16px',
                        opacity: canChange && !uploading && preview ? 1 : 0.5,
                        cursor: canChange && !uploading && preview ? 'pointer' : 'not-allowed',
                    }}
                >
                    {uploading ? '⏳' : '📤'} {uploading ? 'Subiendo...' : 'Subir'}
                </button>
            </div>
            {/* Modal para ver foto grande */}
            {showModal && (currentAvatar || preview) && (
                <AvatarModal
                    avatarUrl={preview || currentAvatar}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

// ============================================
// MODAL PARA VER AVATAR EN GRANDE
// ============================================
function AvatarModal({ avatarUrl, onClose }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'grid',
                placeItems: 'center',
                padding: 20,
                cursor: 'pointer',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    cursor: 'default',
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: -40,
                        right: 0,
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        color: '#fff',
                        fontSize: 20,
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                    }}
                >
                    ✕
                </button>
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '90vh',
                        borderRadius: 16,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    }}
                />
            </div>
        </div>
    );
}

// ============================================
// ESTILOS
// ============================================
const pageStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '30px 16px' };
const containerStyle = { maxWidth: 800, margin: '0 auto' };
const headerStyle = { textAlign: 'center', marginBottom: 24 };
const backButtonStyle = { padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#64748b', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', marginBottom: 12 };
const titleStyle = { fontSize: 26, fontWeight: 800, color: '#0b1e3a', margin: '0 0 6px 0' };
const subtitleStyle = { fontSize: 13, color: '#64748b', margin: 0 };
const tabsContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 24, background: '#fff', padding: 8, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
const tabButtonStyle = { padding: '8px 10px', border: '2px solid', borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 };
const contentStyle = { animation: 'fadeIn 0.3s ease-out' };
const primaryButtonStyle = { padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 8, cursor: 'pointer' };
const secondaryButtonStyle = { padding: '8px 20px', fontSize: 13, fontWeight: 600, color: '#64748b', background: '#fff', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' };
const linkButtonStyle = { width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', textAlign: 'left', marginBottom: 6 };
const selectStyle = { width: '100%', padding: '8px 12px', fontSize: 12, color: '#0f172a', background: '#fff', border: '2px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '8px 12px', fontSize: 12, color: '#0f172a', background: '#fff', border: '2px solid #e5e7eb', borderRadius: 8, marginBottom: 8, boxSizing: 'border-box' };

if (typeof document !== 'undefined' && !document.getElementById('settings-animations')) {
    const style = document.createElement('style');
    style.id = 'settings-animations';
    style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
    document.head.appendChild(style);
}