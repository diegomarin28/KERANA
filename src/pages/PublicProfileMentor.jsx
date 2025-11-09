import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {publicProfileAPI} from '../api/database';
import { useSeguidores } from '../hooks/useSeguidores';
import ApunteCard from '../components/ApunteCard';
import CourseCard from '../components/CourseCard';
import {supabase} from "../supabase.js";
import { ratingsAPI } from '../api/database';
import AuthModal_HacerResenia from '../components/AuthModal_HacerResenia';
import ReviewsSection from '../components/ReviewsSection';
import MentorCalendarModal from '../components/MentorCalendarModal';
import {slotsAPI} from "../api/slots.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserPlus,
    faUserCheck,
    faShareNodes,
    faChevronLeft,
    faChevronRight,
    faFilter,
    faArrowLeft,
    faGraduationCap,
    faStar,
    faRocket,
    faBook,
    faTrophy,
    faFaceFrown,
    faSearch,
    faCalendarCheck,
    faBookmark,
    faEnvelope,
    faCalendar
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import {useMentorStatus} from "../hooks/useMentorStatus.js";

export default function PublicProfileMentor() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [mentorInfo, setMentorInfo] = useState(null);
    const [recentNotes, setRecentNotes] = useState([]);
    const [tab, setTab] = useState('mentorias');
    const [avatarOk, setAvatarOk] = useState(true);
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);
    const { isMentor, loading: mentorLoading } = useMentorStatus(true);

    const [showAllNotes, setShowAllNotes] = useState(false);
    const [allNotes, setAllNotes] = useState([]);
    const [userSubjects, setUserSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [loadingAllNotes, setLoadingAllNotes] = useState(false);

    const [siguiendo, setSiguiendo] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [showUnfollowModal, setShowUnfollowModal] = useState(false);
    const { seguirUsuario, dejarDeSeguir } = useSeguidores();

    const [signedUrls, setSignedUrls] = useState({});
    const [isFavoriteMentor, setIsFavoriteMentor] = useState(false);
    const [loadingFavorite, setLoadingFavorite] = useState(false);

    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const carouselRef = useRef(null);

    const [reviews, setReviews] = useState([]);
    const [filteredReviews, setFilteredReviews] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('todos');
    const [selectedMateriaReview, setSelectedMateriaReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [materiasNamesForReviews, setMateriasNamesForReviews] = useState({});

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    useEffect(() => {
        filterReviews();
    }, [reviews, selectedFilter, selectedMateriaReview]);

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

            // Cargar reseñas del mentor
            if (mentorData?.id_mentor) {
                const { data: reviewsData } = await ratingsAPI.listByMentor(mentorData.id_mentor);
                if (reviewsData) {
                    setReviews(reviewsData);

                    // Cargar nombres de materias para las reseñas
                    const materiaIds = [...new Set(reviewsData.map(r => r.materia_id).filter(Boolean))];
                    const names = {};
                    for (const id of materiaIds) {
                        const { data } = await supabase
                            .from('materia')
                            .select('nombre_materia')
                            .eq('id_materia', id)
                            .single();
                        if (data) names[id] = data.nombre_materia;
                    }
                    setMateriasNamesForReviews(names);
                }
            }

            const { data: notesData } = await publicProfileAPI.getRecentNotes(userId, 4);
            setRecentNotes(notesData || []);

            // Generar signed URLs para notas recientes
            if (notesData && notesData.length > 0) {
                await generateSignedUrls(notesData);
            }

            const { data: isFollowingData } = await publicProfileAPI.isFollowing(userId);
            setSiguiendo(isFollowingData);

            // Verificar si el mentor está en favoritos
            if (mentorData?.id_mentor) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: usuarioData } = await supabase
                        .from('usuario')
                        .select('id_usuario')
                        .eq('auth_id', user.id)
                        .single();

                    if (usuarioData) {
                        const { data: favoritoData, error: favoritoError } = await supabase
                            .from('mentor_fav')
                            .select('id_usuario, id_mentor')
                            .eq('id_usuario', usuarioData.id_usuario)
                            .eq('id_mentor', mentorData.id_mentor)
                            .maybeSingle();

                        if (favoritoError) {
                            console.error('Error verificando favorito mentor:', favoritoError);
                        }
                        setIsFavoriteMentor(!!favoritoData);
                    }
                }
            }

        } catch (error) {
            console.error('Error cargando datos del perfil:', error);
        } finally {
            setLoading(false);
        }

    };

    const filterReviews = () => {
        let filtered = [...reviews];

        if (selectedMateriaReview) {
            filtered = filtered.filter(r => r.materia_id === selectedMateriaReview);
        }

        if (selectedFilter === 'positivas') {
            filtered = filtered.filter(r => r.estrellas >= 3);
        } else if (selectedFilter === 'negativas') {
            filtered = filtered.filter(r => r.estrellas < 3);
        }

        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setFilteredReviews(filtered);
    };

    const generateSignedUrls = async (notes) => {
        const urls = {};
        for (const note of notes) {
            if (note.file_path) {
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('apuntes')
                    .createSignedUrl(note.file_path, 3600);

                if (!signedError && signedData) {
                    urls[note.id_apunte] = signedData.signedUrl;
                }
            }
        }
        setSignedUrls(prev => ({ ...prev, ...urls }));
    };

    const handleVerTodos = async () => {
        setShowAllNotes(true);
        setLoadingAllNotes(true);
        try {
            const { data: allNotesData } = await publicProfileAPI.getAllNotes(profile.id_usuario);
            setAllNotes(allNotesData || []);

            if (allNotesData && allNotesData.length > 0) {
                await generateSignedUrls(allNotesData);
            }

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

            if (data && data.length > 0) {
                await generateSignedUrls(data);
            }

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
            title: `Perfil de ${profile.nombre} - Mentor en Kerana`,
            text: `Conocé a @${profile.username}, mentor verificado en Kerana`,
            url: window.location.href
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') handleCopyLink();
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

    const handleFavoriteMentor = async () => {
        if (!profile || !mentorInfo) return;

        try {
            setLoadingFavorite(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para guardar favoritos');
                return;
            }

            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (usuarioError || !usuarioData) {
                alert('Error al obtener tu perfil');
                return;
            }

            if (isFavoriteMentor) {
                // Quitar de favoritos
                const { error } = await supabase
                    .from('mentor_fav')
                    .delete()
                    .match({
                        id_usuario: usuarioData.id_usuario,
                        id_mentor: mentorInfo.id_mentor
                    });

                if (error) throw error;
                setIsFavoriteMentor(false);
            } else {
                // Agregar a favoritos
                const { error } = await supabase
                    .from('mentor_fav')
                    .insert({
                        id_usuario: usuarioData.id_usuario,
                        id_mentor: mentorInfo.id_mentor
                    });

                if (error) {
                    if (error.code === '23505') {
                        setIsFavoriteMentor(true);
                    } else {
                        throw error;
                    }
                } else {
                    setIsFavoriteMentor(true);
                }
            }
        } catch (error) {
            console.error('Error al manejar favorito:', error);
            alert('Error al guardar favorito: ' + (error.message || ''));
        } finally {
            setLoadingFavorite(false);
        }
    };

    const handleReviewAdded = () => {
        setShowReviewModal(false);
        fetchProfileData(); // Recargar todo
    };

    const handleReviewDeleted = () => {
        fetchProfileData(); // Recargar todo
    };

    const handleEditReview = (review) => {
        if (!materiasNamesForReviews[review.materia_id]) {
            loadMateriaNameForReview(review.materia_id);
        }

        const ratingData = {
            ratingId: review.id,
            tipo: 'mentor',
            selectedEntity: {
                id: mentorInfo.id_mentor,
                nombre: profile.nombre,
                tipo: 'mentor'
            },
            selectedMateria: review.materia_id ? {
                id: review.materia_id,
                nombre: materiasNamesForReviews[review.materia_id] || ''
            } : null,
            rating: review.estrellas,
            selectedTags: review.tags || [],
            texto: review.comentario || '',
            workload: review.workload || 'Medio'
        };

        setEditingReview(ratingData);
        setShowEditModal(true);
    };

    const loadMateriaNameForReview = async (materiaId) => {
        const { data } = await supabase
            .from('materia')
            .select('nombre_materia')
            .eq('id_materia', materiaId)
            .single();

        if (data) {
            setMateriasNamesForReviews(prev => ({ ...prev, [materiaId]: data.nombre_materia }));
        }
    };

    const handleSaveEdit = async (updatedData) => {
        try {
            const { error } = await ratingsAPI.updateRating(
                editingReview.ratingId,
                updatedData.rating,
                updatedData.texto,
                {
                    workload: updatedData.workload,
                    tags: updatedData.selectedTags,
                    materia_id: updatedData.selectedMateria?.id
                }
            );

            if (error) {
                console.error('Error actualizando reseña:', error);
                return;
            }

            setShowEditModal(false);
            setEditingReview(null);
            fetchProfileData();
        } catch (error) {
            console.error('Error inesperado:', error);
        }
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 304;
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
            badges.push({ icon: faRocket, label: 'Pionero', color: '#8B5CF6' });
        }

        if (stats.apuntesSubidos >= 10) {
            badges.push({ icon: faTrophy, label: 'Colaborador Destacado', color: '#9F1239' });
        }

        if (stats.apuntesSubidos >= 100) {
            badges.push({ icon: faBook, label: 'Ratón de biblioteca', color: '#F59E0B' });
        }



        if (isMentor) {
            badges.push({ icon: faGraduationCap, label: 'Mentor Verificado', color: '#0d9488' });
        }

        return badges;
    };


    const formatMemberSince = (dateString) => {
        const date = new Date(dateString);
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#64748b', fontSize: 15 }}>Cargando perfil del mentor...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <FontAwesomeIcon icon={faFaceFrown} style={{ fontSize: 64, color: '#94a3b8', marginBottom: 20 }} />
                    <h2 style={{ margin: '0 0 12px 0', fontSize: 24, color: '#111827' }}>Mentor no encontrado</h2>
                    <p style={{ margin: '0 0 20px 0', color: '#6B7280' }}>Este perfil no existe o es privado</p>
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
                <div style={coverContainerStyle}>
                    <div style={coverPhotoStyle}></div>
                    <div style={profileHeaderWrapperStyle}>
                        <div
                            onClick={() => avatarSrc && setShowFullImage(true)}
                            style={{
                                ...avatarWrapperStyle,
                                cursor: avatarSrc ? 'pointer' : 'default',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (avatarSrc) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 148, 136, 0.35)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
                            }}
                        >
                            {avatarSrc && avatarOk ? (
                                <img src={avatarSrc} alt={profile.nombre} onError={() => setAvatarOk(false)} style={avatarImageStyle} />
                            ) : (
                                <div style={avatarPlaceholderStyle}>{(profile.nombre?.[0] || 'M').toUpperCase()}</div>
                            )}
                        </div>
                        <div style={profileInfoContainerStyle}>
                            <div style={profileInfoLeftStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                                    <h1 style={nameStyle}>{profile.nombre}</h1>
                                </div>
                                <p style={usernameStyle}>@{profile.username}</p>
                                {badges.length > 0 && (
                                    <div style={badgesContainerStyle}>
                                        {badges.map((badge, idx) => (
                                            <div key={idx} style={{ ...badgeStyle, borderColor: badge.color }}>
                                                <FontAwesomeIcon icon={badge.icon} style={{ fontSize: 14 }} />
                                                <span style={{ color: badge.color }}>{badge.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* LINKEDIN BUTTON */}
                                {profile.linkedin && (
                                    <a
                                        href={profile.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={linkedinButtonStyle}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#0a66c2';
                                            e.currentTarget.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                            e.currentTarget.style.color = '#0a66c2';
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faLinkedin} style={{ fontSize: 16 }} />
                                        Ver LinkedIn
                                    </a>
                                )}
                                {mentorInfo?.estrellas_mentor && (
                                    <div style={mentorRatingInlineStyle}>
                                        <FontAwesomeIcon icon={faStar} style={{ fontSize: 20, color: '#F59E0B' }} />
                                        <span style={{ fontSize: 18, fontWeight: 700, color: '#0d9488' }}>{mentorInfo.estrellas_mentor.toFixed(1)}</span>
                                        {mentorInfo.materias?.length > 0 && (
                                            <span style={{ fontSize: 14, color: '#666' }}>
                                                / 5.0 · {mentorInfo.materias.length} {mentorInfo.materias.length === 1 ? 'materia' : 'materias'}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div style={metaInfoStyle}>
                                    <div style={metaItemStyle}>
                                        <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Mentor desde {formatMemberSince(profile.fecha_creado)}
                                    </div>

                                </div>
                                {profile.mostrar_email && (
                                    <div style={emailContainerStyle}>
                                        <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 14 }} />
                                        {profile.correo}
                                    </div>
                                )}
                                <div style={statsInlineStyle}>
                                    <StatInline number={stats?.seguidores || 0} label="seguidores" />
                                    <StatInline number={stats?.siguiendo || 0} label="siguiendo" />
                                    <StatInline number={stats?.apuntes || 0} label="apuntes" />
                                </div>
                            </div>
                            <div style={actionButtonsStyle}>
                                <button onClick={handleSeguir} disabled={loadingFollow} style={{ ...followButtonStyle, background: siguiendo ? '#F3F4F6' : '#0d9488', color: siguiendo ? '#111827' : 'white', border: siguiendo ? '2px solid #D1D5DB' : '2px solid #0d9488' }}>
                                    {loadingFollow ? <div style={buttonSpinnerStyle}></div> : siguiendo ? (
                                        <>
                                            <FontAwesomeIcon icon={faUserCheck} style={{ width: 16, height: 16, marginRight: 6 }} />
                                            Siguiendo
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faUserPlus} style={{ width: 16, height: 16, marginRight: 6 }} />
                                            Seguir
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleFavoriteMentor}
                                    disabled={loadingFavorite}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        border: '2px solid #0d9488',
                                        background: 'white',
                                        cursor: loadingFavorite ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                                        opacity: loadingFavorite ? 0.6 : 1
                                    }}
                                    title={isFavoriteMentor ? "Quitar de favoritos" : "Agregar a favoritos"}
                                    onMouseEnter={(e) => !loadingFavorite && (e.currentTarget.style.transform = 'scale(1.05)')}
                                    onMouseLeave={(e) => !loadingFavorite && (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    <FontAwesomeIcon
                                        icon={faBookmark}
                                        style={{
                                            fontSize: 20,
                                            color: isFavoriteMentor ? '#0d9488' : '#D1D5DB'
                                        }}
                                    />
                                </button>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={handleShare} style={shareButtonStyle} title="Compartir perfil">
                                        <FontAwesomeIcon icon={faShareNodes} style={{ width: 18, height: 18 }} />
                                    </button>
                                    {showShareTooltip && <div style={tooltipStyle}>¡Link copiado!</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={tabsContainerStyle}>
                    {['mentorias', 'resenas', 'apuntes'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                ...tabButtonStyle,
                                background: tab === t ? '#0d9488' : 'transparent',
                                color: tab === t ? 'white' : '#666',
                                borderBottom: tab === t ? '3px solid #0d9488' : '3px solid transparent'
                            }}
                        >
                            {t === 'mentorias' && <><FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: 6 }} /> Mentorías</>}
                            {t === 'resenas' && <><FontAwesomeIcon icon={faStar} style={{ marginRight: 6 }} /> Reseñas</>}
                            {t === 'apuntes' && <><FontAwesomeIcon icon={faBook} style={{ marginRight: 6 }} /> Apuntes</>}
                        </button>
                    ))}
                </div>

                {tab === 'mentorias' && mentorInfo && (
                    <div style={{ marginTop: 24 }}>
                        <div style={sectionHeaderStyle}>
                            <div>
                                <h2 style={sectionTitleStyle}>Mentorías Ofrecidas</h2>
                                <p style={sectionSubtitleStyle}>
                                    Materias en las que brinda apoyo académico
                                </p>
                            </div>

                            <button
                                onClick={() => setShowCalendarModal(true)}
                                style={{
                                    background: '#0d9488',
                                    color: '#fff',
                                    fontWeight: 700,
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                                    transition: 'all 0.2s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#14b8a6';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(13, 148, 136, 0.35)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#0d9488';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.25)';
                                }}
                            >
                                <FontAwesomeIcon icon={faCalendarCheck} />
                                Agendar Mentoría
                            </button>
                        </div>

                        <div style={mentorCardStyle}>
                            {mentorInfo.estrellas_mentor && (
                                <div style={mentorRatingCardStyle}>
                                    <FontAwesomeIcon icon={faStar} style={{ fontSize: 32, color: '#F59E0B' }} />
                                    <div>
                                        <div style={{ fontSize: 36, fontWeight: 800, color: '#0d9488' }}>
                                            {mentorInfo.estrellas_mentor.toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>
                                            Calificación promedio
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{
                                display: 'grid',
                                gap: 20,
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
                            }}>
                                {mentorInfo.materias?.map((m) => (
                                    <CourseCard
                                        key={m.id_materia}
                                        course={{
                                            tipo: 'materia',
                                            id: m.materia.id_materia,
                                            titulo: m.materia.nombre_materia,
                                            subtitulo: m.materia.semestre ? `Semestre ${m.materia.semestre}` : null
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'apuntes' && (
                    <div style={{ marginTop: 24 }}>
                        {!showAllNotes ? (
                            <>
                                <div style={sectionHeaderStyle}>
                                    <div>
                                        <h2 style={sectionTitleStyle}>Últimos Apuntes</h2>
                                        <p style={sectionSubtitleStyle}>{recentNotes.length > 0 ? 'Los recursos más recientes compartidos' : 'Aún no hay apuntes para mostrar'}</p>
                                    </div>
                                    {stats?.apuntes > 4 && (
                                        <button onClick={handleVerTodos} style={verMasButtonStyle}>
                                            Ver todos ({stats.apuntes})
                                            <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: 6 }} />
                                        </button>
                                    )}
                                </div>
                                {recentNotes.length > 0 ? (
                                    <div style={carouselWrapperStyle}>
                                        {recentNotes.length > 3 && (
                                            <button onClick={() => scrollCarousel('left')} style={{ ...carouselArrowStyle, left: -20 }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}>
                                                <FontAwesomeIcon icon={faChevronLeft} />
                                            </button>
                                        )}
                                        <div ref={carouselRef} style={carouselContainerStyle}>
                                            {recentNotes.map(note => (
                                                <div key={note.id_apunte} style={carouselItemStyle}>
                                                    <ApunteCard
                                                        note={{
                                                            ...note,
                                                            signedUrl: signedUrls[note.id_apunte]
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {recentNotes.length > 3 && (
                                            <button onClick={() => scrollCarousel('right')} style={{ ...carouselArrowStyle, right: -20 }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}>
                                                <FontAwesomeIcon icon={faChevronRight} />
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={emptyStateStyle}>
                                        <FontAwesomeIcon icon={faBook} style={emptyIconStyle} />
                                        <h3 style={emptyTitleStyle}>Sin apuntes aún</h3>
                                        <p style={emptyDescStyle}>{profile.nombre.split(' ')[0]} aún no ha compartido apuntes.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={sectionHeaderStyle}>
                                    <div>
                                        <h2 style={sectionTitleStyle}>Todos los Apuntes</h2>
                                        <p style={sectionSubtitleStyle}>{allNotes.length} {allNotes.length === 1 ? 'apunte' : 'apuntes'} en total</p>
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
                                        <button onClick={() => handleFilterBySubject(null)} style={{ ...filterChipStyle, background: selectedSubject === null ? '#0d9488' : 'white', color: selectedSubject === null ? 'white' : '#666', border: selectedSubject === null ? '2px solid #0d9488' : '2px solid #E5E7EB' }}>Todas</button>
                                        {userSubjects.map(materia => (
                                            <button key={materia.id_materia} onClick={() => handleFilterBySubject(materia.id_materia)} style={{ ...filterChipStyle, background: selectedSubject === materia.id_materia ? '#0d9488' : 'white', color: selectedSubject === materia.id_materia ? 'white' : '#666', border: selectedSubject === materia.id_materia ? '2px solid #0d9488' : '2px solid #E5E7EB' }}>{materia.nombre_materia}</button>
                                        ))}
                                    </div>
                                )}
                                {loadingAllNotes ? (
                                    <div style={centerStyle}><div style={spinnerStyle}></div></div>
                                ) : allNotes.length > 0 ? (
                                    <div style={notesGridStyle}>
                                        {allNotes.map(note => (
                                            <ApunteCard
                                                key={note.id_apunte}
                                                note={{
                                                    ...note,
                                                    signedUrl: signedUrls[note.id_apunte]
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={emptyStateStyle}>
                                        <FontAwesomeIcon icon={faSearch} style={emptyIconStyle} />
                                        <h3 style={emptyTitleStyle}>No se encontraron apuntes</h3>
                                        <p style={emptyDescStyle}>{selectedSubject ? 'No hay apuntes para esta materia.' : 'Este mentor no tiene apuntes.'}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {tab === 'resenas' && (
                    <div style={{ marginTop: 24 }}>
                        <ReviewsSection
                            reviews={filteredReviews}
                            materias={mentorInfo?.materias?.map(m => ({
                                id: m.materia.id_materia,
                                nombre: m.materia.nombre_materia
                            })) || []}
                            selectedFilter={selectedFilter}
                            selectedMateria={selectedMateriaReview}
                            onFilterChange={setSelectedFilter}
                            onMateriaChange={setSelectedMateriaReview}
                            onAddReview={() => setShowReviewModal(true)}
                            onReviewDeleted={handleReviewDeleted}
                            onEditReview={handleEditReview}
                        />
                    </div>
                )}

                {showUnfollowModal && (
                    <div style={modalOverlayStyle} onClick={() => setShowUnfollowModal(false)}>
                        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                            <div style={modalAvatarContainerStyle}>
                                {avatarSrc && avatarOk ? (
                                    <img src={avatarSrc} alt={profile.nombre} style={modalAvatarStyle} />
                                ) : (
                                    <div style={modalAvatarPlaceholderStyle}>
                                        {(profile.nombre?.[0] || 'M').toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h3 style={modalTitleStyle}>¿Dejar de seguir a @{profile.username}?</h3>
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

                {/* Modal de nueva reseña */}
                {showReviewModal && mentorInfo && (
                    <AuthModal_HacerResenia
                        open={showReviewModal}
                        onClose={() => setShowReviewModal(false)}
                        onSave={handleReviewAdded}
                        preSelectedEntity={{
                            id: mentorInfo.id_mentor,
                            nombre: profile.nombre,
                            tipo: 'mentor'
                        }}
                    />
                )}

                {/* Modal de edición */}
                {showEditModal && editingReview && (
                    <AuthModal_HacerResenia
                        open={showEditModal}
                        onClose={() => {
                            setShowEditModal(false);
                            setEditingReview(null);
                        }}
                        onSave={handleSaveEdit}
                        preSelectedEntity={editingReview.selectedEntity}
                        initialData={editingReview}
                        isEditing={true}
                    />
                )}

                {/* Modal de calendario para agendar */}
                {showCalendarModal && mentorInfo && (
                    <MentorCalendarModal
                        open={showCalendarModal}
                        onClose={() => setShowCalendarModal(false)}
                        mentorId={mentorInfo.id_mentor}
                        mentorName={profile.nombre}
                        mentorMaterias={mentorInfo.materias?.map(m => ({
                            id: m.materia.id_materia,
                            nombre: m.materia.nombre_materia
                        })) || []}
                        supabase={supabase}
                        slotsAPI={slotsAPI}
                        currentUserId={profile.id_usuario}
                    />
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
        </div>
    );
}

function StatInline({ number, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{number}</span>
            <span style={{ fontSize: 14, color: '#666' }}>{label}</span>
        </div>
    );
}

const pageStyle = { minHeight: '100vh', background: '#f0fdfa', paddingBottom: 40 };
const containerStyle = { maxWidth: 1128, margin: '0 auto', padding: '0 16px' };
const centerStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' };
const spinnerStyle = { width: 40, height: 40, border: '3px solid #f3f4f6', borderTop: '3px solid #0d9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };
const buttonSpinnerStyle = { width: 16, height: 16, border: '2px solid #f3f4f6', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 0.6s linear infinite' };
const coverContainerStyle = { background: 'white', borderRadius: '8px 8px 0 0', overflow: 'hidden', marginTop: 16, boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' };
const coverPhotoStyle = { height: 120, background: '#0d9488', position: 'relative' };
const profileHeaderWrapperStyle = { padding: '0 24px 24px 24px', position: 'relative' };
const avatarWrapperStyle = { width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)', marginTop: -60, marginBottom: 16, background: 'white' };
const avatarImageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const avatarPlaceholderStyle = { width: '100%', height: '100%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 'bold', color: 'white' };
const profileInfoContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' };
const profileInfoLeftStyle = { flex: 1, minWidth: 280 };
const nameStyle = { margin: 0, fontSize: 28, fontWeight: 700, color: '#000000E6', letterSpacing: '-0.5px' };
const usernameStyle = { margin: '4px 0 12px 0', fontSize: 16, color: '#666', fontWeight: 500 };
const badgesContainerStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 };
const badgeStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'white', border: '2px solid', transition: 'all 0.2s ease' };
const mentorRatingInlineStyle = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 16px', background: '#f0fdfa', borderRadius: 12, border: '2px solid #99f6e4', width: 'fit-content' };
const metaInfoStyle = { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 };
const metaItemStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#666' };
const emailContainerStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#666', marginBottom: 12 };
const statsInlineStyle = { display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' };
const actionButtonsStyle = { display: 'flex', gap: 10, alignItems: 'flex-start' };
const followButtonStyle = { padding: '10px 24px', borderRadius: 24, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140, height: 40, boxShadow: '0 2px 8px rgba(13, 148, 136, 0.2)' };
const shareButtonStyle = { width: 40, height: 40, borderRadius: '50%', border: '2px solid #D1D5DB', background: 'white', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const tooltipStyle = { position: 'absolute', top: '100%', right: 0, marginTop: 8, padding: '8px 12px', background: '#111827', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100 };
const tabsContainerStyle = { background: 'white', borderRadius: '0 0 8px 8px', display: 'flex', gap: 4, padding: '0 24px', borderTop: '1px solid #E5E7EB', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' };
const tabButtonStyle = { padding: '16px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6 };
const sectionHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 };
const sectionTitleStyle = { margin: 0, fontSize: 22, fontWeight: 700, color: '#000000E6', letterSpacing: '-0.3px' };
const sectionSubtitleStyle = { margin: '4px 0 0 0', fontSize: 14, color: '#666' };
const verMasButtonStyle = { padding: '10px 20px', background: 'white', color: '#0d9488', border: '2px solid #0d9488', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const backToRecentButtonStyle = { padding: '10px 20px', background: 'white', color: '#666', border: '2px solid #E5E7EB', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center' };
const carouselWrapperStyle = { position: 'relative', paddingBottom: 20 };
const carouselContainerStyle = { display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' };
const carouselItemStyle = { minWidth: 280, flexShrink: 0 };
const carouselArrowStyle = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'white', border: '2px solid #0d9488', color: '#0d9488', fontSize: 28, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)', transition: 'all 0.2s ease', zIndex: 10 };
const filtersContainerStyle = { display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' };
const filterLabelStyle = { fontSize: 14, fontWeight: 600, color: '#666', display: 'flex', alignItems: 'center' };
const filterChipStyle = { padding: '8px 16px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease', border: '2px solid' };
const notesGridStyle = { display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' };
const emptyStateStyle = { textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 8, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' };
const emptyIconStyle = { fontSize: '4rem', marginBottom: 16, opacity: 0.5 };
const emptyTitleStyle = { margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: '#111827' };
const emptyDescStyle = { margin: 0, color: '#666', fontSize: 15 };
const mentorCardStyle = { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' };
const mentorRatingCardStyle = { display: 'flex', alignItems: 'center', gap: 20, padding: 24, background: '#f0fdfa', borderRadius: 12, marginBottom: 24, border: '2px solid #99f6e4' };
const backButtonStyle = { padding: '12px 24px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 24, fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)', transition: 'all 0.2s ease' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' };
const modalContentStyle = { background: 'white', borderRadius: 16, padding: '32px 24px 24px 24px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' };
const modalAvatarContainerStyle = { width: 80, height: 80, margin: '0 auto 16px auto', borderRadius: '50%', overflow: 'hidden', border: '3px solid #0d9488' };
const modalAvatarStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const modalAvatarPlaceholderStyle = { width: '100%', height: '100%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: 'white' };
const modalTitleStyle = { margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: '#111827' };
const modalButtonsStyle = { display: 'flex', flexDirection: 'column', gap: 10 };
const modalConfirmButtonStyle = { padding: '12px 24px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' };
const modalCancelButtonStyle = { padding: '12px 24px', background: 'transparent', color: '#6B7280', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' };
const linkedinButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 16px',
    background: 'white',
    color: '#0a66c2',
    border: '2px solid #0a66c2',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    marginBottom: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};