import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { followersAPI } from '../api/followers';
import { useMentorStatus } from '../hooks/useMentorStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faFileAlt,
    faStar,
    faCreditCard,
    faGraduationCap,
    faUsers,
    faUserFriends
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [stats, setStats] = useState({
        apuntesSubidos: 0,
        reseñasEscritas: 0,
        seguidores: 0,
        siguiendo: 0,
        alumnosMentor: 0
    });
    const [avatarOk, setAvatarOk] = useState(true);
    const [showFullImage, setShowFullImage] = useState(false);
    const navigate = useNavigate();
    const { isMentor, loading: mentorLoading } = useMentorStatus(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const seguidoresChannel = supabase
            .channel('profile-seguidores')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'seguidores',
                    filter: `seguidor_id=eq.${userId}`
                },
                () => loadFollowStats()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'seguidores',
                    filter: `seguido_id=eq.${userId}`
                },
                () => loadFollowStats()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(seguidoresChannel);
        };
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('usuario')
                .select('*')
                .eq('correo', user.email)
                .maybeSingle();

            if (error) throw error;
            setProfile(data);

            const { data: usuarioData } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (usuarioData) {
                setUserId(usuarioData.id_usuario);
                fetchRealStats(usuarioData.id_usuario);
            }
        } catch (err) {
            console.error('Error cargando perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRealStats = async (id) => {
        try {
            const { count: apuntesCount } = await supabase
                .from('apunte')
                .select('*', { count: 'exact', head: true })
                .eq('id_usuario', id);

            const [evaluaResult, calificaResult] = await Promise.all([
                supabase
                    .from('evalua')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_usuario', id),
                supabase
                    .from('califica')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_usuario', id)
            ]);

            const totalReseñas =
                (evaluaResult.error ? 0 : (evaluaResult.count || 0)) +
                (calificaResult.error ? 0 : (calificaResult.count || 0));

            const { seguidores, siguiendo } = await followersAPI.obtenerContadores(id);

            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_mentor')
                .eq('id_usuario', id)
                .maybeSingle();

            let alumnosMentor = 0;
            if (mentorData) {
                const { data: sesionesData } = await supabase
                    .from('mentor_sesion')
                    .select('id_alumno')
                    .eq('id_mentor', mentorData.id_mentor);

                if (sesionesData) {
                    const alumnosUnicos = new Set(sesionesData.map(s => s.id_alumno));
                    alumnosMentor = alumnosUnicos.size;
                }
            }

            setStats({
                apuntesSubidos: apuntesCount || 0,
                reseñasEscritas: totalReseñas,
                seguidores,
                siguiendo,
                alumnosMentor
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    const loadFollowStats = async () => {
        if (!userId) return;
        const { seguidores, siguiendo } = await followersAPI.obtenerContadores(userId);
        setStats(prev => ({
            ...prev,
            seguidores,
            siguiendo
        }));
    };

    function getAppAvatarSrc(raw) {
        const url = (raw || "").trim();
        const isHttp = /^https?:\/\//.test(url);
        const isSupabasePublic = isHttp && url.includes("/storage/v1/object/public/");
        return isSupabasePublic ? url : "";
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid #f1f5f9',
                        borderTop: '3px solid #2563eb',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 12px',
                    }} />
                    <p style={{
                        color: '#64748b',
                        fontSize: '14px',
                        fontWeight: 500
                    }}>
                        Cargando perfil...
                    </p>
                </div>
            </div>
        );
    }

    const avatarSrc = getAppAvatarSrc(profile?.foto);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            padding: 'clamp(24px, 4vw, 48px) 20px',
            fontFamily: 'Inter, sans-serif',
        }}>
            <div style={{
                maxWidth: '960px',
                margin: '0 auto'
            }}>
                {/* Header Card */}
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                    {/* Cover - AZUL LIMPIO */}
                    <div style={{
                        height: '120px',
                        background: '#13346b',
                    }} />

                    {/* Profile Info */}
                    <div style={{
                        padding: '0 32px 32px 32px',
                        marginTop: '-60px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '24px',
                            flexWrap: 'wrap',
                            marginBottom: '24px',
                        }}>
                            {/* Avatar Clickeable */}
                            <div
                                onClick={() => avatarSrc && setShowFullImage(true)}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '5px solid #fff',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    flexShrink: 0,
                                    cursor: avatarSrc ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (avatarSrc) {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.16)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                                }}
                            >
                                {avatarSrc && avatarOk ? (
                                    <img
                                        src={avatarSrc}
                                        alt={profile?.nombre || "Usuario"}
                                        onError={() => setAvatarOk(false)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '48px',
                                        fontWeight: 800,
                                        color: '#fff',
                                    }}>
                                        {(profile?.username?.[0] || profile?.nombre?.[0] || "U").toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Botón Editar */}
                            <button
                                onClick={() => navigate('/edit-profile')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1e40af';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#2563eb';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.2)';
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                Editar Perfil
                            </button>
                        </div>

                        {/* Badge Mentor ARRIBA del nombre */}
                        {isMentor && !mentorLoading && (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: '12px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                            }}>
                                <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: '12px' }} />
                                Mentor Verificado
                            </div>
                        )}

                        {/* Nombre */}
                        <h1 style={{
                            margin: '0 0 8px 0',
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#0f172a',
                            letterSpacing: '-0.02em',
                        }}>
                            {profile?.nombre || 'Usuario'}
                        </h1>

                        {/* Username */}
                        <p style={{
                            margin: '0 0 16px 0',
                            fontSize: '17px',
                            color: '#64748b',
                            fontWeight: 500,
                        }}>
                            @{profile?.username || 'usuario'}
                        </p>

                        {/* Bio */}
                        {profile?.bio && (
                            <p style={{
                                margin: '0 0 16px 0',
                                fontSize: '15px',
                                color: '#475569',
                                lineHeight: 1.7,
                                fontWeight: 400,
                                maxWidth: '600px',
                            }}>
                                {profile.bio}
                            </p>
                        )}

                        {/* LinkedIn */}
                        {profile?.linkedin && (
                            <a
                                href={profile.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    background: '#fff',
                                    border: '2px solid #0a66c2',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#0a66c2',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    marginBottom: '24px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#0a66c2';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 102, 194, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.color = '#0a66c2';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <FontAwesomeIcon icon={faLinkedin} style={{ fontSize: '16px' }} />
                                Ver perfil de LinkedIn
                            </a>
                        )}

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '16px',
                            paddingTop: '24px',
                            borderTop: '2px solid #f1f5f9',
                        }}>
                            {/* Seguidores */}
                            <div
                                onClick={() => navigate('/followers')}
                                style={{
                                    cursor: 'pointer',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    marginBottom: '4px',
                                }}>
                                    {stats.seguidores}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    <FontAwesomeIcon icon={faUsers} style={{ fontSize: '12px' }} />
                                    Seguidores
                                </div>
                            </div>

                            {/* Siguiendo */}
                            <div
                                onClick={() => navigate('/followers')}
                                style={{
                                    cursor: 'pointer',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    marginBottom: '4px',
                                }}>
                                    {stats.siguiendo}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    <FontAwesomeIcon icon={faUserFriends} style={{ fontSize: '12px' }} />
                                    Siguiendo
                                </div>
                            </div>

                            {/* Créditos - Clickeable */}
                            <div
                                onClick={() => navigate('/credits')}
                                style={{
                                    cursor: 'pointer',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fef3c7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{
                                    fontSize: '24px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    marginBottom: '4px',
                                }}>
                                    {profile?.creditos ?? 10}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#f59e0b',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '12px' }} />
                                    Créditos
                                </div>
                            </div>

                            {/* Alumnos si es mentor */}
                            {isMentor && !mentorLoading && stats.alumnosMentor > 0 && (
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                }}>
                                    <div style={{
                                        fontSize: '24px',
                                        fontWeight: 800,
                                        color: '#0f172a',
                                        marginBottom: '4px',
                                    }}>
                                        {stats.alumnosMentor}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#10b981',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}>
                                        <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: '12px' }} />
                                        {stats.alumnosMentor === 1 ? 'Alumno' : 'Alumnos'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '16px',
                }}>
                    {/* Apuntes Subidos - CLICKEABLE */}
                    <div
                        onClick={() => navigate('/my_papers')}
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '2px solid #f1f5f9',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                            e.currentTarget.style.borderColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                            e.currentTarget.style.borderColor = '#f1f5f9';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '24px',
                                flexShrink: 0,
                            }}>
                                <FontAwesomeIcon icon={faFileAlt} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    lineHeight: 1,
                                    marginBottom: '6px',
                                }}>
                                    {stats.apuntesSubidos}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                }}>
                                    Apuntes Subidos
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reseñas Escritas */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '24px',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease',
                    }}
                         onMouseEnter={(e) => {
                             e.currentTarget.style.transform = 'translateY(-4px)';
                             e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
                             e.currentTarget.style.borderColor = '#f59e0b';
                         }}
                         onMouseLeave={(e) => {
                             e.currentTarget.style.transform = 'translateY(0)';
                             e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                             e.currentTarget.style.borderColor = '#f1f5f9';
                         }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '24px',
                                flexShrink: 0,
                            }}>
                                <FontAwesomeIcon icon={faStar} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    lineHeight: 1,
                                    marginBottom: '6px',
                                }}>
                                    {stats.reseñasEscritas}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                }}>
                                    Reseñas Escritas
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Avatar Imagen Grande */}
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

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}