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
    faCoins,
    faGraduationCap
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
        siguiendo: 0
    });
    const [avatarOk, setAvatarOk] = useState(true);
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

            setStats({
                apuntesSubidos: apuntesCount || 0,
                reseñasEscritas: totalReseñas,
                seguidores,
                siguiendo
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
                    {/* Cover */}
                    <div style={{
                        height: '100px',
                        background: 'linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)',
                    }} />

                    {/* Profile Info */}
                    <div style={{
                        padding: '0 24px 24px 24px',
                        marginTop: '-40px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '20px',
                            flexWrap: 'wrap',
                        }}>
                            {/* Avatar + Info */}
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'flex-start',
                                flex: 1,
                                minWidth: 0,
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '4px solid #fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    flexShrink: 0,
                                }}>
                                    {(() => {
                                        const avatarSrc = getAppAvatarSrc(profile?.foto);
                                        return avatarSrc && avatarOk ? (
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
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '32px',
                                                fontWeight: 800,
                                                color: '#fff',
                                            }}>
                                                {(profile?.username?.[0] || profile?.nombre?.[0] || "U").toUpperCase()}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Name + Username + Bio + Links + Stats */}
                                <div style={{ flex: 1, minWidth: 0, paddingTop: '8px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '4px',
                                    }}>
                                        <h1 style={{
                                            margin: 0,
                                            fontSize: '24px',
                                            fontWeight: 800,
                                            color: '#0f172a',
                                            letterSpacing: '-0.02em',
                                        }}>
                                            {profile?.nombre || 'Usuario'}
                                        </h1>
                                        {isMentor && !mentorLoading && (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '3px 8px',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: '#fff',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.3px',
                                            }}>
                                                <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: '10px' }} />
                                                Mentor
                                            </div>
                                        )}
                                    </div>

                                    <p style={{
                                        margin: '0 0 12px 0',
                                        fontSize: '15px',
                                        color: '#64748b',
                                        fontWeight: 500,
                                    }}>
                                        @{profile?.username || 'usuario'}
                                    </p>

                                    {/* Bio */}
                                    {profile?.bio && (
                                        <p style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '14px',
                                            color: '#475569',
                                            lineHeight: 1.6,
                                            fontWeight: 400,
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
                                                gap: '6px',
                                                padding: '6px 12px',
                                                background: '#f8fafc',
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                color: '#0a66c2',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease',
                                                marginBottom: '12px',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#0a66c2';
                                                e.currentTarget.style.color = '#fff';
                                                e.currentTarget.style.borderColor = '#0a66c2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.color = '#0a66c2';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faLinkedin} />
                                            LinkedIn
                                        </a>
                                    )}

                                    {/* Créditos Badge */}
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                        border: '2px solid #fcd34d',
                                        borderRadius: '20px',
                                        marginBottom: '12px',
                                    }}>
                                        <FontAwesomeIcon icon={faCoins} style={{
                                            color: '#f59e0b',
                                            fontSize: '14px'
                                        }} />
                                        <span style={{
                                            color: '#92400e',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                        }}>
                                            {profile?.creditos ?? 10} créditos
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '20px',
                                        flexWrap: 'wrap',
                                    }}>
                                        <div
                                            onClick={() => navigate('/followers')}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'opacity 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '0.7';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '16px',
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                marginRight: '4px',
                                            }}>
                                                {stats.seguidores}
                                            </span>
                                            <span style={{
                                                fontSize: '14px',
                                                color: '#64748b',
                                                fontWeight: 500,
                                            }}>
                                                seguidores
                                            </span>
                                        </div>

                                        <div
                                            onClick={() => navigate('/followers')}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'opacity 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '0.7';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '16px',
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                marginRight: '4px',
                                            }}>
                                                {stats.siguiendo}
                                            </span>
                                            <span style={{
                                                fontSize: '14px',
                                                color: '#64748b',
                                                fontWeight: 500,
                                            }}>
                                                siguiendo
                                            </span>
                                        </div>

                                        <div>
                                            <span style={{
                                                fontSize: '16px',
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                marginRight: '4px',
                                            }}>
                                                {stats.apuntesSubidos}
                                            </span>
                                            <span style={{
                                                fontSize: '14px',
                                                color: '#64748b',
                                                fontWeight: 500,
                                            }}>
                                                apuntes
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botón Editar */}
                            <button
                                onClick={() => navigate('/edit-profile')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 20px',
                                    background: '#2563eb',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    marginTop: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1e40af';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#2563eb';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} />
                                Editar Perfil
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px',
                }}>
                    {/* Apuntes Subidos */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '2px solid #f1f5f9',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease',
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
                         }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '18px',
                            }}>
                                <FontAwesomeIcon icon={faFileAlt} />
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#0f172a',
                                lineHeight: 1,
                            }}>
                                {stats.apuntesSubidos}
                            </div>
                        </div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#64748b',
                        }}>
                            Apuntes Subidos
                        </div>
                    </div>

                    {/* Reseñas Escritas */}
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
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
                         }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '18px',
                            }}>
                                <FontAwesomeIcon icon={faStar} />
                            </div>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#0f172a',
                                lineHeight: 1,
                            }}>
                                {stats.reseñasEscritas}
                            </div>
                        </div>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#64748b',
                        }}>
                            Reseñas Escritas
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}