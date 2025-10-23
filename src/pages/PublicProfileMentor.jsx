import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {calendlyAPI, publicProfileAPI} from '../api/database';
import { useSeguidores } from '../hooks/useSeguidores';
import ApunteCard from '../components/ApunteCard';
import {supabase} from "../supabase.js";

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



    const [showCalendlyModal, setShowCalendlyModal] = useState(false);
    const [calendlyUrl, setCalendlyUrl] = useState(null);

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

            // Obtener URL de Calendly del mentor (si tiene id_mentor)
            if (mentorData?.id_mentor) {
                const { data: calendlyData } = await supabase
                    .from('usuario')
                    .select('calendly_url')
                    .eq('id_usuario', userId)
                    .single();

                console.log('🔍 DEBUG Calendly - URL original:', calendlyData?.calendly_url);

                let finalUrl = calendlyData?.calendly_url || null;

                // Pre-rellenar con los datos del usuario actual (quien está viendo el perfil)
                if (finalUrl) {
                    const { data: { user } } = await supabase.auth.getUser();
                    console.log('🔍 DEBUG Calendly - Usuario actual:', user);
                    console.log('🔍 DEBUG Calendly - Email del usuario:', user?.email);

                    if (user?.email) {
                        try {
                            const url = new URL(finalUrl);
                            url.searchParams.set('email', user.email);

                            // Obtener el nombre del usuario actual
                            const { data: currentUserData, error: userError } = await supabase
                                .from('usuario')
                                .select('nombre')
                                .eq('correo', user.email)
                                .single();

                            if (userError) {
                                console.error('❌ Error obteniendo nombre:', userError);
                            }

                            console.log('🔍 DEBUG Calendly - Datos usuario:', currentUserData);

                            if (currentUserData?.nombre) {
                                url.searchParams.set('name', currentUserData.nombre);
                            }

                            finalUrl = url.toString();
                            console.log('✅ DEBUG Calendly - URL FINAL:', finalUrl);
                        } catch (error) {
                            console.error('❌ DEBUG Calendly - Error:', error);
                        }
                    } else {
                        console.warn('⚠️ DEBUG Calendly - No hay email de usuario');
                    }
                } else {
                    console.warn('⚠️ DEBUG Calendly - No hay URL de Calendly configurada');
                }

                setCalendlyUrl(finalUrl);
                console.log('💾 DEBUG Calendly - URL guardada en estado:', finalUrl);
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
        if (monthsAgo >= 6) badges.push({ icon: '🚀', label: 'Early Adopter', color: '#10B981' });
        if (stats.apuntes >= 10) badges.push({ icon: '📚', label: 'Bookworm', color: '#10B981' });
        if (stats.apuntes >= 20) badges.push({ icon: '🥇', label: 'Top Contributor', color: '#F59E0B' });
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
                    <div style={{ fontSize: '4rem', marginBottom: 20 }}>😕</div>
                    <h2 style={{ margin: '0 0 12px 0', fontSize: 24, color: '#111827' }}>Mentor no encontrado</h2>
                    <p style={{ margin: '0 0 20px 0', color: '#6B7280' }}>Este perfil no existe o es privado</p>
                    <button onClick={() => navigate(-1)} style={backButtonStyle}>← Volver</button>
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
                        <div style={avatarWrapperStyle}>
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
                                    <span style={mentorVerifiedBadgeStyle}>
                                        <span style={{ fontSize: 16 }}>🎓</span> Mentor Verificado
                                    </span>
                                </div>
                                <p style={usernameStyle}>@{profile.username}</p>
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
                                {mentorInfo?.estrellas_mentor && (
                                    <div style={mentorRatingInlineStyle}>
                                        <span style={{ fontSize: 20 }}>⭐</span>
                                        <span style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{mentorInfo.estrellas_mentor.toFixed(1)}</span>
                                        <span style={{ fontSize: 14, color: '#666' }}>/ 5.0 · {mentorInfo.materias?.length || 0} materias</span>
                                    </div>
                                )}
                                <div style={metaInfoStyle}>
                                    <div style={metaItemStyle}>
                                        <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Mentor desde {formatMemberSince(profile.fecha_creado)}
                                    </div>
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
                                <div style={statsInlineStyle}>
                                    <StatInline number={stats?.seguidores || 0} label="seguidores" />
                                    <StatInline number={stats?.siguiendo || 0} label="siguiendo" />
                                    <StatInline number={stats?.apuntes || 0} label="apuntes" />
                                </div>
                            </div>
                            <div style={actionButtonsStyle}>
                                <button onClick={handleSeguir} disabled={loadingFollow} style={{ ...followButtonStyle, background: siguiendo ? '#F3F4F6' : '#10B981', color: siguiendo ? '#111827' : 'white', border: siguiendo ? '2px solid #D1D5DB' : '2px solid #10B981' }}>
                                    {loadingFollow ? <div style={buttonSpinnerStyle}></div> : siguiendo ? (
                                        <><svg style={{ width: 16, height: 16, marginRight: 6 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Siguiendo</>
                                    ) : (
                                        <><svg style={{ width: 16, height: 16, marginRight: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>Seguir</>
                                    )}
                                </button>

                                <button
                                    onClick={handleFavoriteMentor}
                                    disabled={loadingFavorite}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        border: '2px solid #10B981',
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
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill={isFavoriteMentor ? '#10B981' : 'none'}
                                        stroke="#10B981"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                    </svg>
                                </button>



                                <div style={{ position: 'relative' }}>
                                    <button onClick={handleShare} style={shareButtonStyle} title="Compartir perfil">
                                        <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                    </button>
                                    {showShareTooltip && <div style={tooltipStyle}>¡Link copiado!</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={tabsContainerStyle}>
                    {['mentorias', 'apuntes'].map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ ...tabButtonStyle, background: tab === t ? '#10B981' : 'transparent', color: tab === t ? 'white' : '#666', borderBottom: tab === t ? '3px solid #10B981' : '3px solid transparent' }}>
                            {t === 'mentorias' && `🎓 Mentorías`}
                            {t === 'apuntes' && `📚 Apuntes`}
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

                            {calendlyUrl && (
                                <button
                                    onClick={() => setShowCalendlyModal(true)}
                                    style={{
                                        background: '#10B981',
                                        color: '#fff',
                                        fontWeight: 700,
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 16,
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#059669';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#10B981';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                                    }}
                                >
                                    📅 Agendar Mentoría
                                </button>
                            )}
                        </div>

                        <div style={mentorCardStyle}>
                            {mentorInfo.estrellas_mentor && (
                                <div style={mentorRatingCardStyle}>
                                    <span style={{ fontSize: 32 }}>⭐</span>
                                    <div>
                                        <div style={{ fontSize: 36, fontWeight: 800, color: '#10B981' }}>
                                            {mentorInfo.estrellas_mentor.toFixed(1)}
                                        </div>
                                        <div style={{ fontSize: 14, color: '#666', fontWeight: 600 }}>
                                            Calificación promedio
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={mentorMateriasGridStyle}>
                                {mentorInfo.materias?.map((m) => (
                                    <div key={m.id_materia} style={mentorMateriaCardStyle}>
                                        <div style={mentorMateriaIconStyle}>📚</div>
                                        <div>
                                            <div style={mentorMateriaTitleStyle}>
                                                {m.materia.nombre_materia}
                                            </div>
                                            {m.materia.semestre && (
                                                <div style={mentorMateriaSemestreStyle}>
                                                    Semestre {m.materia.semestre}
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                            <svg style={{ width: 16, height: 16, marginLeft: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    )}
                                </div>
                                {recentNotes.length > 0 ? (
                                    <div style={carouselWrapperStyle}>
                                        {recentNotes.length > 3 && (
                                            <button onClick={() => scrollCarousel('left')} style={{ ...carouselArrowStyle, left: -20 }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}>‹</button>
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
                                            <button onClick={() => scrollCarousel('right')} style={{ ...carouselArrowStyle, right: -20 }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%) scale(1)'}>›</button>
                                        )}
                                    </div>
                                ) : (
                                    <div style={emptyStateStyle}>
                                        <div style={emptyIconStyle}>📚</div>
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
                                        <svg style={{ width: 16, height: 16, marginRight: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        Volver
                                    </button>
                                </div>
                                {userSubjects.length > 0 && (
                                    <div style={filtersContainerStyle}>
                                        <span style={filterLabelStyle}>
                                            <svg style={{ width: 16, height: 16, marginRight: 6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                            Filtrar por materia:
                                        </span>
                                        <button onClick={() => handleFilterBySubject(null)} style={{ ...filterChipStyle, background: selectedSubject === null ? '#10B981' : 'white', color: selectedSubject === null ? 'white' : '#666', border: selectedSubject === null ? '2px solid #10B981' : '2px solid #E5E7EB' }}>Todas</button>
                                        {userSubjects.map(materia => (
                                            <button key={materia.id_materia} onClick={() => handleFilterBySubject(materia.id_materia)} style={{ ...filterChipStyle, background: selectedSubject === materia.id_materia ? '#10B981' : 'white', color: selectedSubject === materia.id_materia ? 'white' : '#666', border: selectedSubject === materia.id_materia ? '2px solid #10B981' : '2px solid #E5E7EB' }}>{materia.nombre_materia}</button>
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
                                        <div style={emptyIconStyle}>🔍</div>
                                        <h3 style={emptyTitleStyle}>No se encontraron apuntes</h3>
                                        <p style={emptyDescStyle}>{selectedSubject ? 'No hay apuntes para esta materia.' : 'Este mentor no tiene apuntes.'}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {showCalendlyModal && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '20px'
                        }}
                        onClick={() => setShowCalendlyModal(false)}
                    >
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                width: '100%',
                                maxWidth: '900px',
                                height: '85vh',
                                maxHeight: '700px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header limpio con info */}
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                color: 'white'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                                            📅 Agendar Mentoría
                                        </h3>
                                        <p style={{ margin: '4px 0 0 0', fontSize: 13, opacity: 0.9 }}>
                                            Tu email ya está pre-cargado ✓
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCalendlyModal(false)}
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: 32,
                                            height: 32,
                                            fontSize: 18,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Iframe Calendly */}
                            <iframe
                                src={calendlyUrl}
                                style={{
                                    border: 'none',
                                    width: '100%',
                                    height: '100%',
                                    flex: 1
                                }}
                                title="Agendar Mentoría"
                            />
                        </div>
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

const pageStyle = { minHeight: '100vh', background: '#F0FDF4', paddingBottom: 40 };
const containerStyle = { maxWidth: 1128, margin: '0 auto', padding: '0 16px' };
const centerStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' };
const spinnerStyle = { width: 40, height: 40, border: '3px solid #f3f4f6', borderTop: '3px solid #10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };
const buttonSpinnerStyle = { width: 16, height: 16, border: '2px solid #f3f4f6', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 0.6s linear infinite' };
const coverContainerStyle = { background: 'white', borderRadius: '8px 8px 0 0', overflow: 'hidden', marginTop: 16, boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' };
const coverPhotoStyle = { height: 120, background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)', position: 'relative' };
const profileHeaderWrapperStyle = { padding: '0 24px 24px 24px', position: 'relative' };
const avatarWrapperStyle = { width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', marginTop: -60, marginBottom: 16, background: 'white' };
const avatarImageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const avatarPlaceholderStyle = { width: '100%', height: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 'bold', color: 'white' };
const profileInfoContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' };
const profileInfoLeftStyle = { flex: 1, minWidth: 280 };
const nameStyle = { margin: 0, fontSize: 28, fontWeight: 700, color: '#000000E6', letterSpacing: '-0.5px' };
const usernameStyle = { margin: '4px 0 12px 0', fontSize: 16, color: '#666', fontWeight: 500 };
const mentorVerifiedBadgeStyle = { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' };
const badgesContainerStyle = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 };
const badgeStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'white', border: '2px solid', transition: 'all 0.2s ease' };
const mentorRatingInlineStyle = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 16px', background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', borderRadius: 12, border: '2px solid #A7F3D0', width: 'fit-content' };
const metaInfoStyle = { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 };
const metaItemStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#666' };
const emailContainerStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#666', marginBottom: 12 };
const statsInlineStyle = { display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' };
const actionButtonsStyle = { display: 'flex', gap: 10, alignItems: 'flex-start' };
const followButtonStyle = { padding: '10px 24px', borderRadius: 24, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 140, height: 40, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)' };
const shareButtonStyle = { width: 40, height: 40, borderRadius: '50%', border: '2px solid #D1D5DB', background: 'white', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const tooltipStyle = { position: 'absolute', top: '100%', right: 0, marginTop: 8, padding: '8px 12px', background: '#111827', color: 'white', borderRadius: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100 };
const tabsContainerStyle = { background: 'white', borderRadius: '0 0 8px 8px', display: 'flex', gap: 4, padding: '0 24px', borderTop: '1px solid #E5E7EB', boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' };
const tabButtonStyle = { padding: '16px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 6 };
const sectionHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 };
const sectionTitleStyle = { margin: 0, fontSize: 22, fontWeight: 700, color: '#000000E6', letterSpacing: '-0.3px' };
const sectionSubtitleStyle = { margin: '4px 0 0 0', fontSize: 14, color: '#666' };
const verMasButtonStyle = { padding: '10px 20px', background: 'white', color: '#10B981', border: '2px solid #10B981', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const backToRecentButtonStyle = { padding: '10px 20px', background: 'white', color: '#666', border: '2px solid #E5E7EB', borderRadius: 24, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center' };
const carouselWrapperStyle = { position: 'relative', paddingBottom: 20 };
const carouselContainerStyle = { display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' };
const carouselItemStyle = { minWidth: 280, flexShrink: 0 };
const carouselArrowStyle = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'white', border: '2px solid #10B981', color: '#10B981', fontSize: 28, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: 'all 0.2s ease', zIndex: 10 };
const filtersContainerStyle = { display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' };
const filterLabelStyle = { fontSize: 14, fontWeight: 600, color: '#666', display: 'flex', alignItems: 'center' };
const filterChipStyle = { padding: '8px 16px', borderRadius: 20, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease', border: '2px solid' };
const notesGridStyle = { display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' };const emptyStateStyle = { textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 8, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' };
const emptyIconStyle = { fontSize: '4rem', marginBottom: 16, opacity: 0.5 };
const emptyTitleStyle = { margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: '#111827' };
const emptyDescStyle = { margin: 0, color: '#666', fontSize: 15 };
const mentorCardStyle = { background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)' };
const mentorRatingCardStyle = { display: 'flex', alignItems: 'center', gap: 20, padding: 24, background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', borderRadius: 12, marginBottom: 24, border: '2px solid #A7F3D0' };
const mentorMateriasGridStyle = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' };
const mentorMateriaCardStyle = { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 8, transition: 'all 0.2s ease' };
const mentorMateriaIconStyle = { fontSize: 28, width: 48, height: 48, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10B981' };
const mentorMateriaTitleStyle = { fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3 };
const mentorMateriaSemestreStyle = { fontSize: 13, color: '#666', marginTop: 2 };
const backButtonStyle = { padding: '12px 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: 24, fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' };
const modalContentStyle = { background: 'white', borderRadius: 16, padding: '32px 24px 24px 24px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' };
const modalAvatarContainerStyle = { width: 80, height: 80, margin: '0 auto 16px auto', borderRadius: '50%', overflow: 'hidden', border: '3px solid #10B981' };
const modalAvatarStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const modalAvatarPlaceholderStyle = { width: '100%', height: '100%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: 'white' };
const modalTitleStyle = { margin: '0 0 24px 0', fontSize: 18, fontWeight: 600, color: '#111827' };
const modalButtonsStyle = { display: 'flex', flexDirection: 'column', gap: 10 };
const modalConfirmButtonStyle = { padding: '12px 24px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' };
const modalCancelButtonStyle = { padding: '12px 24px', background: 'transparent', color: '#6B7280', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' };
