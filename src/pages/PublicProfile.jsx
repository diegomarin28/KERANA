import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicProfileAPI } from '../api/database';
import { useSeguidores } from '../hooks/useSeguidores';
import ApunteCard from "../components/ApunteCard.jsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faUserCheck,
    faShare,
    faCalendar,
    faChevronLeft,
    faChevronRight,
    faFilter,
    faArrowLeft,
    faGraduationCap,
    faStar
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';

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
    const [showFullImage, setShowFullImage] = useState(false);

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
            badges.push({ icon: 'rocket', label: 'Early Adopter', color: '#8B5CF6' });
        }

        if (stats.apuntes >= 10) {
            badges.push({ icon: 'book', label: 'Bookworm', color: '#10B981' });
        }

        if (stats.apuntes >= 20) {
            badges.push({ icon: 'trophy', label: 'Top Contributor', color: '#F59E0B' });
        }

        if (mentorInfo) {
            badges.push({ icon: faGraduationCap, label: 'Mentor Verificado', color: '#10B981' });
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
                    <p style={{ marginTop: 16, color: '#64748b', fontSize: 15, fontFamily: 'Inter, sans-serif' }}>Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={{ fontSize: '4rem', marginBottom: 20 }}>😕</div>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: 24, color: '#111827', fontFamily: 'Inter, sans-serif' }}>Usuario no encontrado</h2>
                    <p style={{ margin: '0 0 20px 0', color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Este perfil no existe o es privado</p>
                    <button onClick={() => navigate(-1)} style={backButtonStyle}>
                        <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 8 }} />
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
    const badges = getBadges();

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>

                {/* Cover + Avatar Header */}
                <div style={coverContainerStyle}>
                    <div style={coverPhotoStyle}></div>

                    <div style={profileHeaderWrapperStyle}>
                        {/* Avatar CLICKEABLE */}
                        <div
                            onClick={() => avatarSrc && setShowFullImage(true)}
                            style={avatarWrapperStyle}
                            onMouseEnter={(e) => {
                                if (avatarSrc) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.18)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                            }}
                        >
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

                                {/* BIO */}
                                {profile.bio && (
                                    <p style={bioStyle}>
                                        {profile.bio}
                                    </p>
                                )}

                                {/* Badges */}
                                {badges.length > 0 && (
                                    <div style={badgesContainerStyle}>
                                        {badges.map((badge, idx) => (
                                            <div key={idx} style={{ ...badgeStyle, borderColor: badge.color }}>
                                                {typeof badge.icon === 'string' ? (
                                                    <span style={{ fontSize: 14 }}>
                                                        {badge.icon === 'rocket' && '🚀'}
                                                        {badge.icon === 'book' && '📚'}
                                                        {badge.icon === 'trophy' && '🥇'}
                                                    </span>
                                                ) : (
                                                    <FontAwesomeIcon icon={badge.icon} style={{ fontSize: 14 }} />
                                                )}
                                                <span style={{ color: badge.color }}>{badge.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Meta info */}
                                <div style={metaInfoStyle}>
                                    <div style={metaItemStyle}>
                                        <FontAwesomeIcon icon={faCalendar} style={{ width: 16, height: 16 }} />
                                        Miembro desde {formatMemberSince(profile.fecha_creado)}
                                    </div>

                                    {/* LINKEDIN REAL */}
                                    {profile.linkedin && (
                                        <a
                                            href={profile.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={linkedinLinkStyle}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#004182'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#0a66c2'}
                                        >
                                            <FontAwesomeIcon icon={faLinkedin} style={{ width: 16, height: 16 }} />
                                            Ver perfil de LinkedIn
                                        </a>
                                    )}
                                </div>

                                {profile.mostrar_email && (
                                    <div style={emailContainerStyle}>
                                        {profile.correo}
                                    </div>
                                )}

                                {/* Stats inline */}
                                <div style={statsInlineStyle}>
                                    <StatInline number={stats?.seguidores || 0} label="seguidores" />
                                    <StatInline number={stats?.siguiendo || 0} label="siguiendo" />
                                    <StatInline number={stats?.apuntes || 0} label="apuntes" />
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div style={actionButtonsStyle}>
                                <button
                                    onClick={handleSeguir}
                                    disabled={loadingFollow}
                                    style={{
                                        ...followButtonStyle,
                                        background: siguiendo ? '#F3F4F6' : '#2563eb',
                                        color: siguiendo ? '#111827' : 'white',
                                        border: siguiendo ? '2px solid #D1D5DB' : '2px solid #2563eb'
                                    }}
                                >
                                    {loadingFollow ? (
                                        <div style={buttonSpinnerStyle}></div>
                                    ) : siguiendo ? (
                                        <>
                                            <FontAwesomeIcon icon={faUserCheck} style={{ marginRight: 6 }} />
                                            Siguiendo
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 6 }} />
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
                                        <FontAwesomeIcon icon={faShare} />
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
                                background: tab === t ? '#2563eb' : 'transparent',
                                color: tab === t ? 'white' : '#666',
                                borderBottom: tab === t ? '3px solid #2563eb' : '3px solid transparent'
                            }}
                        >
                            {t === 'apuntes' && `Apuntes`}
                            {t === 'mentorias' && `Mentorías`}
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
                                                    <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: 6 }} />
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
                                                    <FontAwesomeIcon icon={faChevronLeft} />
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
                                                    <FontAwesomeIcon icon={faChevronRight} />
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
                                        <FontAwesomeIcon icon={faChevronLeft} style={{ marginRight: 6 }} />
                                        Volver
                                    </button>
                                </div>

                                {userSubjects.length > 0 && (
                                    <div style={filtersContainerStyle}>
                                        <span style={filterLabelStyle}>
                                            <FontAwesomeIcon icon={faFilter} style={{ marginRight: 6 }} />
                                            Filtrar por materia:
                                        </span>
                                        <button
                                            onClick={() => handleFilterBySubject(null)}
                                            style={{
                                                ...filterChipStyle,
                                                background: selectedSubject === null ? '#2563eb' : 'white',
                                                color: selectedSubject === null ? 'white' : '#666',
                                                border: selectedSubject === null ? '2px solid #2563eb' : '2px solid #E5E7EB'
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
                                                    background: selectedSubject === materia.id_materia ? '#2563eb' : 'white',
                                                    color: selectedSubject === materia.id_materia ? 'white' : '#666',
                                                    border: selectedSubject === materia.id_materia ? '2px solid #2563eb' : '2px solid #E5E7EB'
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
                                    <FontAwesomeIcon icon={faStar} style={{ fontSize: 24, color: '#f59e0b' }} />
                                    <div>
                                        <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b', fontFamily: 'Inter, sans-serif' }}>
                                            {mentorInfo.estrellas_mentor.toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#666', fontFamily: 'Inter, sans-serif' }}>Calificación</div>
                                    </div>
                                </div>
                            )}

                            <div style={mentorMateriasGridStyle}>
                                {mentorInfo.materias?.map(m => (
                                    <div key={m.id_materia} style={mentorMateriaCardStyle}>
                                        <div style={mentorMateriaIconStyle}>
                                            <FontAwesomeIcon icon={faGraduationCap} />
                                        </div>
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

            {/* Modal Unfollow */}
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

            {/* Modal Avatar Grande */}
            {showFullImage && avatarSrc && (
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
                                fontSize: 24,
                                cursor: "pointer",
                                display: "grid",
                                placeItems: "center",
                                transition: "all 0.2s ease",
                                fontWeight: 'bold',
                            }}
                            onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"}
                            onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.2)"}
                        >
                            ✕
                        </button>
                        <img
                            src={avatarSrc}
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

// Componentes auxiliares
function StatInline({ number, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'Inter, sans-serif' }}>{number}</span>
            <span style={{ fontSize: 14, color: '#666', fontFamily: 'Inter, sans-serif' }}>{label}</span>
        </div>
    );
}

// ==========================================
// ESTILOS
// ==========================================
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
    paddingBottom: 40,
    fontFamily: 'Inter, sans-serif',
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
    borderTop: '3px solid #2563eb',
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
    background: '#13346b',
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
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const avatarImageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const avatarPlaceholderStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
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
    fontFamily: 'Inter, sans-serif',
};

const usernameStyle = {
    margin: '4px 0 12px 0',
    fontSize: 16,
    color: '#666',
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
};

const bioStyle = {
    margin: '0 0 12px 0',
    fontSize: 15,
    color: '#475569',
    lineHeight: 1.6,
    fontWeight: 400,
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};

const linkedinLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#0a66c2',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s ease',
    fontFamily: 'Inter, sans-serif',
};

const emailContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};

const verTodosHeaderStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 16,
};

const verMasButtonStyle = {
    padding: '10px 20px',
    background: 'white',
    color: '#2563eb',
    border: '2px solid #2563eb',
    borderRadius: 24,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};

const sectionSubtitleStyle = {
    margin: '4px 0 0 0',
    fontSize: 14,
    color: '#666',
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
    minWidth: 360,
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
    color: '#2563eb',
    fontSize: 20,
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
    fontFamily: 'Inter, sans-serif',
};

const filterChipStyle = {
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid',
    fontFamily: 'Inter, sans-serif',
};

const notesGridStyle = {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
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
    fontFamily: 'Inter, sans-serif',
};

const emptyDescStyle = {
    margin: 0,
    color: '#666',
    fontSize: 15,
    fontFamily: 'Inter, sans-serif',
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
    fontSize: 24,
    width: 48,
    height: 48,
    background: 'white',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #10b981',
    color: '#10b981',
};

const mentorMateriaTitleStyle = {
    fontSize: 15,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.3,
    fontFamily: 'Inter, sans-serif',
};

const mentorMateriaSemestreStyle = {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter, sans-serif',
};

const backButtonStyle = {
    padding: '12px 24px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 24,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 15,
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
    display: 'inline-flex',
    alignItems: 'center',
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
    fontFamily: 'Inter, sans-serif',
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
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
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
    fontFamily: 'Inter, sans-serif',
};