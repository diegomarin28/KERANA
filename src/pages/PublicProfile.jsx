import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI } from '../api/database';
import { useSeguidores } from '../hooks/useSeguidores';
import ApunteCard from "../components/ApunteCard.jsx";

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
    const [showShareTooltip, setShowShareTooltip] = useState(false);

    const [showAllNotes, setShowAllNotes] = useState(false);
    const [allNotes, setAllNotes] = useState([]);
    const [userSubjects, setUserSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loadingAllNotes, setLoadingAllNotes] = useState(false);

    const [siguiendo, setSiguiendo] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const { seguirUsuario, dejarDeSeguir } = useSeguidores();

    const carouselRef = useRef(null);

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);

            const { data: profileData, error: profileError } = await publicProfileAPI.getPublicProfile(username);
            if (profileError) {
                console.error('Error cargando perfil:', profileError);
                setLoading(false);
                return;
            }
            setProfile(profileData);

            const userId = profileData.id_usuario;

            const { data: statsData } = await publicProfileAPI.getPublicStats(userId);
            setStats(statsData);

            const { data: mentorData } = await publicProfileAPI.checkIfMentor(userId);
            setMentorInfo(mentorData);

            const { data: notesData } = await publicProfileAPI.getRecentNotes(userId, 4);
            setRecentNotes(notesData || []);

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
            const { data: allNotesData } = await publicProfileAPI.getAllNotes(profile.id_usuario);
            setAllNotes(allNotesData || []);

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

        if (siguiendo) {
            setShowUnfollowModal(true);
            return;
        }

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

    const handleShare = async () => {
        const shareData = {
            title: `Perfil de ${profile.nombre} en Kerana`,
            text: `Mirá el perfil de @${profile.username} en Kerana`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    handleCopyLink();
                }
            }
        } else {
            handleCopyLink();
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 380;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const getBadges = () => {
        if (!profile || !stats) return [];

        const badges = [];
        const memberDate = new Date(profile.fecha_creado);
        const monthsAgo = (new Date() - memberDate) / (1000 * 60 * 60 * 24 * 30);

        if (monthsAgo >= 6) {
            badges.push({ icon: '🚀', label: 'Early Adopter', color: '#8B5CF6' });
        }

        if (stats.apuntes >= 10) {
            badges.push({ icon: '📚', label: 'Bookworm', color: '#10B981' });
        }

        if (stats.apuntes >= 20) {
            badges.push({ icon: '🥇', label: 'Top Contributor', color: '#F59E0B' });
        }

        if (mentorInfo) {
            badges.push({ icon: '🎓', label: 'Mentor Verificado', color: '#0A66C2' });
        }

        return badges;
    };

    const formatMemberSince = (dateString) => {
        const date = new Date(dateString);
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#64748b', fontSize: 15 }}>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={{ fontSize: '4rem', marginBottom: 20 }}>😕</div>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: 24, color: '#111827' }}>Usuario no encontrado</h2>
                    <p style={{ margin: '0 0 20px 0', color: '#6B7280' }}>Este perfil no existe o es privado</p>
                    <button onClick={() => navigate(-1)} style={backButtonStyle}>
                        ← Volver
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
    const badges = getBadges();

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>

                {/* Cover + Avatar Header */}
                <div style={coverContainerStyle}>
                    <div style={coverPhotoStyle}></div>

                    <div style={profileHeaderWrapperStyle}>
                        {/* Avatar */}
                        <div style={avatarWrapperStyle}>
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

                        {/* Info y acciones */}
                        <div style={profileInfoContainerStyle}>
                            <div style={profileInfoLeftStyle}>
                                <h1 style={nameStyle}>{profile.nombre}</h1>

                                <p style={usernameStyle}>@{profile.username}</p>

                                {/* Badges */}
                                {badges.length > 0 && (
                                    <div style={badgesContainerStyle}>
                                        {badges.map((badge, idx) => (
                                            <div key={idx} style={{ ...badgeStyle, borderColor: badge.color }}>
                                                <span style={{ fontSize: 14 }}>{badge.icon}</span>
                                                <span style={{ color: badge.color }}>{badge.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Meta info */}
                                <div style={metaInfoStyle}>
                                    <div style={metaItemStyle}>
                                        <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Miembro desde {formatMemberSince(profile.fecha_creado)}
                                    </div>

                                    {/* LinkedIn placeholder */}
                                    <div style={metaItemStyle}>
                                        <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                        </svg>
                                        LinkedIn (próximamente)
                                    </div>
                                </div>

                                {profile.mostrar_email && (
                                    <div style={emailContainerStyle}>
                                        <svg style={{ width: 14, height: 14 }} fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                        </svg>
                                        {profile.correo}
                                    </div>
                                )}

                                {/* Stats inline */}
                                <div style={statsInlineStyle}>
                                    <StatInline number={stats?.seguidores || 0} label="Seguidores" />
                                    <StatInline number={stats?.siguiendo || 0} label="Siguiendo" />
                                    <StatInline number={stats?.apuntes || 0} label="Apuntes" />
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div style={actionButtonsStyle}>
                                <button
                                    onClick={handleSeguir}
                                    disabled={loadingFollow}
                                    style={{
                                        ...followButtonStyle,
                                        background: siguiendo ? '#F3F4F6' : '#0A66C2',
                                        color: siguiendo ? '#111827' : 'white',
                                        border: siguiendo ? '2px solid #D1D5DB' : '2px solid #0A66C2'
                                    }}
                                >
                                    {loadingFollow ? (
                                        <div style={buttonSpinnerStyle}></div>
                                    ) : siguiendo ? (
                                        <>
                                            <svg style={{ width: 16, height: 16, marginRight: 6 }} fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                            Siguiendo
                                        </>
                                    ) : (
                                        <>
                                            <svg style={{ width: 16, height: 16, marginRight: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Seguir
                                        </>
                                    )}
                                </button>

                                {/* Share button */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={handleShare}
                                        style={shareButtonStyle}
                                        title="Compartir perfil"
                                    >
                                        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                    {showShareTooltip && (
                                        <div style={tooltipStyle}>
                                            ¡Link copiado!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={tabsContainerStyle}>
                    {['apuntes', ...(mentorInfo ? ['mentorias'] : [])].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                ...tabButtonStyle,
                                background: tab === t ? '#0A66C2' : 'transparent',
                                color: tab === t ? 'white' : '#666',
                                borderBottom: tab === t ? '3px solid #0A66C2' : '3px solid transparent'
                            }}
                        >
                            {t === 'apuntes' && `📚 Apuntes`}
                            {t === 'mentorias' && `🎓 Mentorías`}
                        </button>
                    ))}
                </div>

                {/* Contenido */}
                {tab === 'apuntes' && (
                    <div style={{ marginTop: 24 }}>
                        {!showAllNotes ? (
                            <>
                                {recentNotes.length > 0 ? (
                                    <>
                                        {stats?.apuntes > 4 && (
                                            <div style={verTodosHeaderStyle}>
                                                <button onClick={handleVerTodos} style={verMasButtonStyle}>
                                                    Ver todos los apuntes ({stats.apuntes})
                                                    <svg style={{ width: 16, height: 16, marginLeft: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                        <div style={carouselWrapperStyle}>
                                            {recentNotes.length > 3 && (
                                                <button
                                                    onClick={() => scrollCarousel('left')}
                                                    style={{ ...carouselArrowStyle, left: -20 }}
                                                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'}
                                                    onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}
                                                >
                                                    ‹
                                                </button>
                                            )}

                                            <div ref={carouselRef} style={carouselContainerStyle}>
                                                {recentNotes.map(note => (
                                                    <div key={note.id_apunte} style={carouselItemStyle}>
                                                        <ApunteCard note={note} />
                                                    </div>
                                                ))}
                                            </div>

                                            {recentNotes.length > 3 && (
                                                <button
                                                    onClick={() => scrollCarousel('right')}
                                                    style={{ ...carouselArrowStyle, right: -20 }}
                                                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'}
                                                    onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}
                                                >
                                                    ›
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div style={emptyStateStyle}>
                                        <div style={emptyIconStyle}>📚</div>
                                        <h3 style={emptyTitleStyle}>Sin apuntes aún</h3>
                                        <p style={emptyDescStyle}>
                                            {profile.nombre.split(' ')[0]} aún no ha compartido apuntes.
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={sectionHeaderStyle}>
                                    <div>
                                        <h2 style={sectionTitleStyle}>Todos los Apuntes</h2>
                                        <p style={sectionSubtitleStyle}>
                                            {allNotes.length} {allNotes.length === 1 ? 'apunte' : 'apuntes'} en total
                                        </p>
                                    </div>
                                    <button onClick={() => setShowAllNotes(false)} style={backToRecentButtonStyle}>
                                        <svg style={{ width: 16, height: 16, marginRight: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Volver
                                    </button>
                                </div>

                                {userSubjects.length > 0 && (
                                    <div style={filtersContainerStyle}>
                                        <span style={filterLabelStyle}>
                                            <svg style={{ width: 16, height: 16, marginRight: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                            Filtrar por materia:
                                        </span>
                                        <button
                                            onClick={() => handleFilterBySubject(null)}
                                            style={{
                                                ...filterChipStyle,
                                                background: selectedSubject === null ? '#0A66C2' : 'white',
                                                color: selectedSubject === null ? 'white' : '#666',
                                                border: selectedSubject === null ? '2px solid #0A66C2' : '2px solid #E5E7EB'
                                            }}
                                        >
                                            Todas
                                        </button>
                                        {userSubjects.map(materia => (
                                            <button
                                                key={materia.id_materia}
                                                onClick={() => handleFilterBySubject(materia.id_materia)}
                                                style={{
                                                    ...filterChipStyle,
                                                    background: selectedSubject === materia.id_materia ? '#0A66C2' : 'white',
                                                    color: selectedSubject === materia.id_materia ? 'white' : '#666',
                                                    border: selectedSubject === materia.id_materia ? '2px solid #0A66C2' : '2px solid #E5E7EB'
                                                }}
                                            >
                                                {materia.nombre_materia}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {loadingAllNotes ? (
                                    <div style={centerStyle}>
                                        <div style={spinnerStyle}></div>
                                    </div>
                                ) : allNotes.length > 0 ? (
                                    <div style={notesGridStyle}>
                                        {allNotes.map(note => (
                                            <ApunteCard key={note.id_apunte} note={note} />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={emptyStateStyle}>
                                        <div style={emptyIconStyle}>🔍</div>
                                        <h3 style={emptyTitleStyle}>No se encontraron apuntes</h3>
                                        <p style={emptyDescStyle}>
                                            {selectedSubject
                                                ? 'No hay apuntes para esta materia.'
                                                : 'Este usuario no tiene apuntes.'}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {tab === 'mentorias' && mentorInfo && (
                    <div style={{ marginTop: 24 }}>
                        <div style={sectionHeaderStyle}>
                            <div>
                                <h2 style={sectionTitleStyle}>Mentorías</h2>
                                <p style={sectionSubtitleStyle}>Materias en las que ofrece apoyo</p>
                            </div>
                        </div>

                        <div style={mentorCardStyle}>
                            {mentorInfo.estrellas_mentor && (
                                <div style={mentorRatingStyle}>
                                    <span style={{ fontSize: 24 }}>⭐</span>
                                    <div>
                                        <div style={{ fontSize: 28, fontWeight: 700, color: '#0A66C2' }}>
                                            {mentorInfo.estrellas_mentor.toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#666' }}>Calificación</div>
                                    </div>
                                </div>
                            )}

                            <div style={mentorMateriasGridStyle}>
                                {mentorInfo.materias?.map(m => (
                                    <div key={m.id_materia} style={mentorMateriaCardStyle}>
                                        <div style={mentorMateriaIconStyle}>📚</div>
                                        <div>
                                            <div style={mentorMateriaTitleStyle}>{m.materia.nombre_materia}</div>
                                            {m.materia.semestre && (
                                                <div style={mentorMateriaSemestreStyle}>Semestre {m.materia.semestre}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
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

// Componentes auxiliares
function StatInline({ number, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{number}</span>
            <span style={{ fontSize: 14, color: '#666' }}>{label}</span>
        </div>
    );
}

// ==========================================
// ESTILOS
// ==========================================
const pageStyle = {
    minHeight: '100vh',
    background: '#F3F2EF',
    paddingBottom: 40,
};

const containerStyle = {
    maxWidth: 1128,
    margin: '0 auto',
    padding: '0 16px',
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
};

const spinnerStyle = {
    width: 40,
    height: 40,
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #0A66C2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
};

const buttonSpinnerStyle = {
    width: 16,
    height: 16,
    border: '2px solid #f3f4f6',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
};

const coverContainerStyle = {
    background: 'white',
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
    marginTop: 16,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)',
};

const coverPhotoStyle = {
    height: 120,
    background: 'linear-gradient(135deg, #0A66C2 0%, #004182 50%, #00325B 100%)',
    position: 'relative',
};

const profileHeaderWrapperStyle = {
    padding: '0 24px 24px 24px',
    position: 'relative',
};

const avatarWrapperStyle = {
    width: 120,
    height: 120,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginTop: -60,
    marginBottom: 16,
    background: 'white',
};

const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const avatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
};

const profileInfoContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    flexWrap: 'wrap',
};

const profileInfoLeftStyle = {
    flex: 1,
    minWidth: 280,
};

const nameStyle = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#000000E6',
    letterSpacing: '-0.5px',
};

const usernameStyle = {
    margin: '4px 0 12px 0',
    fontSize: 16,
    color: '#666',
    fontWeight: 500,
};

const badgesContainerStyle = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
};

const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: 'white',
    border: '2px solid',
    transition: 'all 0.2s ease',
};

const metaInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
};

const metaItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#666',
};

const emailContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
};

const statsInlineStyle = {
    display: 'flex',
    gap: 20,
    marginTop: 8,
    flexWrap: 'wrap',
};

const actionButtonsStyle = {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
};

const followButtonStyle = {
    padding: '10px 24px',
    borderRadius: 24,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    height: 40,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};

const shareButtonStyle = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #D1D5DB',
    background: 'white',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};

const tooltipStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    padding: '8px 12px',
    background: '#111827',
    color: 'white',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 100,
};

const tabsContainerStyle = {
    background: 'white',
    borderRadius: '0 0 8px 8px',
    display: 'flex',
    gap: 4,
    padding: '0 24px',
    borderTop: '1px solid #E5E7EB',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)',
};

const tabButtonStyle = {
    padding: '16px 20px',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};

const verTodosHeaderStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 16,
};

const verMasButtonStyle = {
    padding: '10px 20px',
    background: 'white',
    color: '#0A66C2',
    border: '2px solid #0A66C2',
    borderRadius: 24,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
};

const sectionHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
};

const sectionTitleStyle = {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#000000E6',
    letterSpacing: '-0.3px',
};

const sectionSubtitleStyle = {
    margin: '4px 0 0 0',
    fontSize: 14,
    color: '#666',
};

const backToRecentButtonStyle = {
    padding: '10px 20px',
    background: 'white',
    color: '#666',
    border: '2px solid #E5E7EB',
    borderRadius: 24,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
};

const carouselWrapperStyle = {
    position: 'relative',
    paddingBottom: 20,
};

const carouselContainerStyle = {
    display: 'flex',
    gap: 16,
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    paddingBottom: 8,
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E1 transparent',
};

const carouselItemStyle = {
    minWidth: 280,
    maxWidth: 280,
    flexShrink: 0,
};

const carouselArrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'white',
    border: '2px solid #E5E7EB',
    color: '#0A66C2',
    fontSize: 28,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
    zIndex: 10,
};

const filtersContainerStyle = {
    display: 'flex',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
    alignItems: 'center',
    background: 'white',
    padding: 16,
    borderRadius: 8,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
};

const filterLabelStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: '#666',
    display: 'flex',
    alignItems: 'center',
};

const filterChipStyle = {
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid',
};

const notesGridStyle = {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 280px))',
};

const emptyStateStyle = {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'white',
    borderRadius: 8,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
};

const emptyIconStyle = {
    fontSize: '4rem',
    marginBottom: 16,
    opacity: 0.5,
};

const emptyTitleStyle = {
    margin: '0 0 8px 0',
    fontSize: 20,
    fontWeight: 700,
    color: '#111827',
};

const emptyDescStyle = {
    margin: 0,
    color: '#666',
    fontSize: 15,
};

const mentorCardStyle = {
    background: 'white',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)',
};

const mentorRatingStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    borderRadius: 8,
    marginBottom: 24,
    border: '2px solid #FCD34D',
};

const mentorMateriasGridStyle = {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
};

const mentorMateriaCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: '#F9FAFB',
    border: '2px solid #E5E7EB',
    borderRadius: 8,
    transition: 'all 0.2s ease',
};

const mentorMateriaIconStyle = {
    fontSize: 28,
    width: 48,
    height: 48,
    background: 'white',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #E5E7EB',
};

const mentorMateriaTitleStyle = {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.3,
};

const mentorMateriaSemestreStyle = {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
};

const backButtonStyle = {
    padding: '12px 24px',
    background: '#0A66C2',
    color: 'white',
    border: 'none',
    borderRadius: 24,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 15,
    boxShadow: '0 2px 8px rgba(10, 102, 194, 0.3)',
    transition: 'all 0.2s ease',
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
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