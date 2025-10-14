import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI } from '../api/database';
import { useSeguidores } from '../hooks/useSeguidores';
import NoteCard from '../components/NoteCard';
import { Card } from '../components/ui/Card';

export default function PublicProfile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [mentorInfo, setMentorInfo] = useState(null);
    const [recentNotes, setRecentNotes] = useState([]);
    const [tab, setTab] = useState('apuntes');
    const [avatarOk, setAvatarOk] = useState(true);

    // Estado para "Ver todos los apuntes"
    const [showAllNotes, setShowAllNotes] = useState(false);
    const [allNotes, setAllNotes] = useState([]);
    const [userSubjects, setUserSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loadingAllNotes, setLoadingAllNotes] = useState(false);

    // Estado para seguir
    const [siguiendo, setSiguiendo] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const { seguirUsuario, dejarDeSeguir } = useSeguidores();

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            // 1. Obtener perfil
            const { data: profileData, error: profileError } = await publicProfileAPI.getPublicProfile(username);
            if (profileError) {
                console.error('Error cargando perfil:', profileError);
                setLoading(false);
                return;
            }
            setProfile(profileData);

            const userId = profileData.id_usuario;

            // 2. Obtener estadísticas
            const { data: statsData } = await publicProfileAPI.getPublicStats(userId);
            setStats(statsData);

            // 3. Verificar si es mentor
            const { data: mentorData } = await publicProfileAPI.checkIfMentor(userId);
            setMentorInfo(mentorData);

            // 4. Obtener últimos 4 apuntes para el carrusel
            const { data: notesData } = await publicProfileAPI.getRecentNotes(userId, 4);
            setRecentNotes(notesData || []);

            // 5. Verificar si ya lo estoy siguiendo
            const { data: isFollowingData } = await publicProfileAPI.isFollowing(userId);
            setSiguiendo(isFollowingData);

        } catch (error) {
            console.error('Error cargando datos del perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerTodos = async () => {
        setShowAllNotes(true);
        setLoadingAllNotes(true);

        try {
            // Obtener todos los apuntes
            const { data: allNotesData } = await publicProfileAPI.getAllNotes(profile.id_usuario);
            setAllNotes(allNotesData || []);

            // Obtener materias únicas del usuario
            const { data: subjectsData } = await publicProfileAPI.getUserSubjects(profile.id_usuario);
            setUserSubjects(subjectsData || []);
        } catch (error) {
            console.error('Error cargando todos los apuntes:', error);
        } finally {
            setLoadingAllNotes(false);
        }
    };

    const handleFilterBySubject = async (materiaId) => {
        setSelectedSubject(materiaId);
        setLoadingAllNotes(true);

        try {
            const { data } = await publicProfileAPI.getAllNotes(profile.id_usuario, materiaId);
            setAllNotes(data || []);
        } catch (error) {
            console.error('Error filtrando apuntes:', error);
        } finally {
            setLoadingAllNotes(false);
        }
    };

    const handleSeguir = async () => {
        if (!profile) return;

        // Si ya está siguiendo, mostrar modal de confirmación
        if (siguiendo) {
            setShowUnfollowModal(true);
            return;
        }

        // Si no está siguiendo, seguir directamente
        setLoadingFollow(true);
        try {
            const result = await seguirUsuario(profile.id_usuario);
            if (result.success) {
                setSiguiendo(true);
                setStats(prev => ({ ...prev, seguidores: prev.seguidores + 1 }));
            }
        } catch (error) {
            console.error('Error al seguir:', error);
        } finally {
            setLoadingFollow(false);
        }
    };

    const confirmarDejarDeSeguir = async () => {
        setLoadingFollow(true);
        try {
            const result = await dejarDeSeguir(profile.id_usuario);
            if (result.success) {
                setSiguiendo(false);
                setStats(prev => ({ ...prev, seguidores: Math.max(0, prev.seguidores - 1) }));
            }
        } catch (error) {
            console.error('Error al dejar de seguir:', error);
        } finally {
            setLoadingFollow(false);
            setShowUnfollowModal(false);
        }
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#64748b' }}>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <h2>Usuario no encontrado</h2>
                    <button onClick={() => navigate(-1)} style={backButtonStyle}>
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const getAvatarSrc = (url) => {
        const avatarUrl = (url || "").trim();
        const isHttp = /^https?:\/\//.test(avatarUrl);
        const isSupabasePublic = isHttp && avatarUrl.includes("/storage/v1/object/public/");
        return isSupabasePublic ? avatarUrl : "";
    };

    const avatarSrc = getAvatarSrc(profile.foto);

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

                {/* Header del perfil */}
                <Card style={profileHeaderStyle}>
                    <div style={headerContentStyle}>
                        {/* Avatar */}
                        <div style={avatarContainerStyle}>
                            {avatarSrc && avatarOk ? (
                                <img
                                    src={avatarSrc}
                                    alt={profile.nombre}
                                    onError={() => setAvatarOk(false)}
                                    style={avatarImageStyle}
                                />
                            ) : (
                                <div style={avatarPlaceholderStyle}>
                                    {(profile.nombre?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info del usuario */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <h1 style={nameStyle}>{profile.nombre}</h1>
                                {mentorInfo && (
                                    <span style={mentorBadgeStyle}>
                                        🎓 Mentor
                                    </span>
                                )}
                            </div>

                            <p style={usernameStyle}>@{profile.username}</p>

                            {profile.mostrar_email && (
                                <p style={emailStyle}>{profile.correo}</p>
                            )}

                            {/* Stats */}
                            <div style={statsContainerStyle}>
                                <div style={statItemStyle}>
                                    <span style={statNumberStyle}>{stats?.seguidores || 0}</span>
                                    <span style={statLabelStyle}>Seguidores</span>
                                </div>
                                <div style={statItemStyle}>
                                    <span style={statNumberStyle}>{stats?.siguiendo || 0}</span>
                                    <span style={statLabelStyle}>Siguiendo</span>
                                </div>
                                <div style={statItemStyle}>
                                    <span style={statNumberStyle}>{stats?.apuntes || 0}</span>
                                    <span style={statLabelStyle}>Apuntes</span>
                                </div>
                            </div>

                            {/* Botón Seguir */}
                            <button
                                onClick={handleSeguir}
                                disabled={loadingFollow}
                                style={{
                                    ...followButtonStyle,
                                    background: siguiendo ? 'white' : '#2563EB',
                                    color: siguiendo ? '#2563EB' : 'white',
                                    border: '2px solid #2563EB'
                                }}
                            >
                                {loadingFollow ? 'Procesando...' : siguiendo ? 'Siguiendo' : 'Seguir'}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Tabs */}
                <div style={tabsContainerStyle}>
                    {['apuntes', ...(mentorInfo ? ['mentorias'] : [])].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                ...tabButtonStyle,
                                background: tab === t ? '#2563EB' : 'white',
                                color: tab === t ? 'white' : '#374151',
                                border: tab === t ? '1px solid #2563EB' : '1px solid #D1D5DB'
                            }}
                        >
                            {t === 'apuntes' && `📚 Apuntes (${stats?.apuntes || 0})`}
                            {t === 'mentorias' && `🎓 Mentorías`}
                        </button>
                    ))}
                </div>

                {/* Contenido según tab */}
                {tab === 'apuntes' && (
                    <div>
                        {!showAllNotes ? (
                            // Carrusel de últimos apuntes
                            <>
                                <div style={sectionHeaderStyle}>
                                    <h2 style={sectionTitleStyle}>Últimos Apuntes</h2>
                                    {stats?.apuntes > 4 && (
                                        <button onClick={handleVerTodos} style={verMasButtonStyle}>
                                            Ver todos →
                                        </button>
                                    )}
                                </div>

                                {recentNotes.length > 0 ? (
                                    <div style={notesGridStyle}>
                                        {recentNotes.map(note => (
                                            <NoteCard key={note.id_apunte} note={note} />
                                        ))}
                                    </div>
                                ) : (
                                    <Card style={emptyStateStyle}>
                                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📚</div>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>
                                            Sin apuntes aún
                                        </h3>
                                        <p style={{ margin: 0, color: '#6B7280' }}>
                                            Este usuario aún no ha subido apuntes.
                                        </p>
                                    </Card>
                                )}
                            </>
                        ) : (
                            // Vista de "Todos los apuntes" con filtros
                            <>
                                <div style={sectionHeaderStyle}>
                                    <h2 style={sectionTitleStyle}>Todos los Apuntes</h2>
                                    <button onClick={() => setShowAllNotes(false)} style={backToRecentButtonStyle}>
                                        ← Volver a destacados
                                    </button>
                                </div>

                                {/* Filtros por materia */}
                                {userSubjects.length > 0 && (
                                    <div style={filtersContainerStyle}>
                                        <span style={filterLabelStyle}>Filtrar por materia:</span>
                                        <button
                                            onClick={() => handleFilterBySubject(null)}
                                            style={{
                                                ...filterButtonStyle,
                                                background: selectedSubject === null ? '#2563EB' : 'white',
                                                color: selectedSubject === null ? 'white' : '#374151'
                                            }}
                                        >
                                            Todas
                                        </button>
                                        {userSubjects.map(materia => (
                                            <button
                                                key={materia.id_materia}
                                                onClick={() => handleFilterBySubject(materia.id_materia)}
                                                style={{
                                                    ...filterButtonStyle,
                                                    background: selectedSubject === materia.id_materia ? '#2563EB' : 'white',
                                                    color: selectedSubject === materia.id_materia ? 'white' : '#374151'
                                                }}
                                            >
                                                {materia.nombre_materia}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Grid de todos los apuntes */}
                                {loadingAllNotes ? (
                                    <div style={centerStyle}>
                                        <div style={spinnerStyle}></div>
                                    </div>
                                ) : allNotes.length > 0 ? (
                                    <div style={notesGridStyle}>
                                        {allNotes.map(note => (
                                            <NoteCard key={note.id_apunte} note={note} />
                                        ))}
                                    </div>
                                ) : (
                                    <Card style={emptyStateStyle}>
                                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>
                                            No se encontraron apuntes
                                        </h3>
                                        <p style={{ margin: 0, color: '#6B7280' }}>
                                            {selectedSubject
                                                ? 'No hay apuntes para esta materia.'
                                                : 'Este usuario no tiene apuntes.'}
                                        </p>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                )}

                {tab === 'mentorias' && mentorInfo && (
                    <Card style={{ padding: 24, background: 'white', borderRadius: 12 }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>
                            Mentor en:
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            {mentorInfo.materias?.map(m => (
                                <div key={m.id_materia} style={mentorSubjectBadgeStyle}>
                                    📚 {m.materia.nombre_materia}
                                </div>
                            ))}
                        </div>
                        {mentorInfo.estrellas_mentor && (
                            <div style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
                                ⭐ {mentorInfo.estrellas_mentor.toFixed(1)} estrellas
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Modal de confirmación para dejar de seguir */}
            {showUnfollowModal && (
                <div style={modalOverlayStyle} onClick={() => setShowUnfollowModal(false)}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={modalAvatarContainerStyle}>
                            {avatarSrc && avatarOk ? (
                                <img src={avatarSrc} alt={profile.nombre} style={modalAvatarStyle} />
                            ) : (
                                <div style={modalAvatarPlaceholderStyle}>
                                    {(profile.nombre?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>

                        <h3 style={modalTitleStyle}>
                            ¿Dejar de seguir a @{profile.username}?
                        </h3>

                        <div style={modalButtonsStyle}>
                            <button
                                onClick={confirmarDejarDeSeguir}
                                disabled={loadingFollow}
                                style={modalConfirmButtonStyle}
                            >
                                {loadingFollow ? 'Procesando...' : 'Dejar de seguir'}
                            </button>
                            <button
                                onClick={() => setShowUnfollowModal(false)}
                                disabled={loadingFollow}
                                style={modalCancelButtonStyle}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// ESTILOS
// ==========================================
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '40px 0',
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

const profileHeaderStyle = {
    padding: 32,
    marginBottom: 24,
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    color: 'white',
    borderRadius: 16,
    boxShadow: '0 10px 40px rgba(37, 99, 235, 0.3)',
};

const headerContentStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
};

const avatarContainerStyle = {
    width: 120,
    height: 120,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid rgba(255,255,255,0.3)',
    flexShrink: 0,
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
};

const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const avatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
};

const nameStyle = {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
};

const usernameStyle = {
    margin: '4px 0 8px 0',
    fontSize: 18,
    opacity: 0.9,
};

const emailStyle = {
    margin: '0 0 16px 0',
    fontSize: 14,
    opacity: 0.8,
};

const mentorBadgeStyle = {
    background: '#10B981',
    color: 'white',
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
};

const statsContainerStyle = {
    display: 'flex',
    gap: 32,
    marginTop: 16,
    marginBottom: 20,
};

const statItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

const statNumberStyle = {
    fontSize: 24,
    fontWeight: 800,
};

const statLabelStyle = {
    fontSize: 13,
    opacity: 0.9,
    marginTop: 2,
};

const followButtonStyle = {
    padding: '12px 32px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid',
};

const tabsContainerStyle = {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
};

const tabButtonStyle = {
    padding: '12px 24px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid',
};

const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
};

const sectionTitleStyle = {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
};

const verMasButtonStyle = {
    padding: '10px 20px',
    background: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const backToRecentButtonStyle = {
    padding: '10px 20px',
    background: 'white',
    color: '#2563EB',
    border: '1px solid #2563EB',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const filtersContainerStyle = {
    display: 'flex',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
    alignItems: 'center',
};

const filterLabelStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: '#6B7280',
};

const filterButtonStyle = {
    padding: '8px 16px',
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #D1D5DB',
};

const notesGridStyle = {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
};

const emptyStateStyle = {
    textAlign: 'center',
    padding: 60,
    background: 'white',
    borderRadius: 12,
};

const mentorSubjectBadgeStyle = {
    background: '#EEF2FF',
    color: '#2563EB',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: '1px solid #BFDBFE',
};

const backButtonStyle = {
    padding: '10px 20px',
    background: '#2563EB',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 16,
};

// Modal styles
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
};

const modalContentStyle = {
    background: 'white',
    borderRadius: 16,
    padding: '32px 24px 24px 24px',
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
};

const modalAvatarContainerStyle = {
    width: 80,
    height: 80,
    margin: '0 auto 16px auto',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #E5E7EB',
};

const modalAvatarStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const modalAvatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
};

const modalTitleStyle = {
    margin: '0 0 24px 0',
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
};

const modalButtonsStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
};

const modalConfirmButtonStyle = {
    padding: '12px 24px',
    background: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const modalCancelButtonStyle = {
    padding: '12px 24px',
    background: 'transparent',
    color: '#6B7280',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};