import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { followersAPI } from '../api/followers';
import { ratingsAPI } from '../api/database';
import { useMentorStatus } from '../hooks/useMentorStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MisReseniasModal from '../components/MisReseniasModal';
import AuthModal_HacerResenia from '../components/AuthModal_HacerResenia';
import {
    faEdit,
    faFileAlt,
    faStar,
    faCreditCard,
    faGraduationCap,
    faUsers,
    faUserFriends,
    faRocket,
    faBook,
    faTrophy
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
    const [showReseniasModal, setShowReseniasModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRating, setEditingRating] = useState(null);

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

            const { count: totalReseñas } = await supabase
                .from('rating')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', id);

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

    const handleEditReview = (ratingData) => {
        setEditingRating(ratingData);
        setShowReseniasModal(false);

        // Esperar a que se cierre completamente antes de abrir el de edición
        setTimeout(() => {
            setShowEditModal(true);
        }, 400);
    };

    const handleSaveEdit = async (updatedData) => {
        try {
            const { error } = await ratingsAPI.updateRating(
                editingRating.ratingId,
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
            setEditingRating(null);

            // Esperar antes de reabrir "Mis Reseñas" si quieres
            // setTimeout(() => setShowReseniasModal(true), 300);
        } catch (error) {
            console.error('Error inesperado:', error);
        }
    };

    // ✨ NUEVO: Función para obtener badges
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#2563eb',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }}></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '12px',
                    }}>
                        No se pudo cargar el perfil
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#64748b',
                        marginBottom: '24px',
                    }}>
                        Intenta recargar la página
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Recargar
                    </button>
                </div>
            </div>
        );
    }

    const avatarSrc = getAppAvatarSrc(profile.foto);
    const fallbackInitial = (profile.nombre?.[0] || "U").toUpperCase();
    const badges = getBadges();

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            paddingBottom: '80px',
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* Hero con gradiente */}
            <div style={{
                background: 'linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)',
                height: '200px',
                position: 'relative',
            }}></div>

            {/* Contenido principal */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 20px',
            }}>
                {/* Card de perfil */}
                <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '32px',
                    marginTop: '-120px',
                    position: 'relative',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                }}>
                    {/* Botón Editar Perfil */}
                    <button
                        onClick={() => navigate('/edit-profile')}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            padding: '10px 20px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#1e40af';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#2563eb';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <FontAwesomeIcon icon={faEdit} />
                        Editar Perfil
                    </button>

                    {/* Avatar y datos principales */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '24px',
                        marginBottom: '32px',
                    }}>
                        {/* Avatar */}
                        <div
                            onClick={() => avatarSrc && setShowFullImage(true)}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '4px solid #fff',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                flexShrink: 0,
                                cursor: avatarSrc ? 'pointer' : 'default',
                                background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '48px',
                                fontWeight: 'bold',
                                color: '#fff',
                            }}
                        >
                            {avatarSrc && avatarOk ? (
                                <img
                                    src={avatarSrc}
                                    alt={profile.nombre}
                                    onError={() => setAvatarOk(false)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                fallbackInitial
                            )}
                        </div>

                        {/* Datos */}
                        <div style={{ flex: 1 }}>
                            {/* ✨ NUEVO: Badges de logros */}
                            {badges.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    flexWrap: 'wrap'
                                }}>
                                    {badges.map((badge, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                background: badge.color,
                                                color: '#fff',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                fontFamily: 'Inter, sans-serif'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={badge.icon} style={{ fontSize: '12px' }} />
                                            {badge.label}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <h1 style={{
                                margin: '0 0 8px 0',
                                fontSize: '32px',
                                fontWeight: 800,
                                color: '#0f172a',
                            }}>
                                {profile.nombre}
                            </h1>

                            <p style={{
                                margin: '0 0 12px 0',
                                fontSize: '16px',
                                color: '#64748b',
                                fontWeight: 500,
                            }}>
                                @{profile.username}
                            </p>

                            {profile.bio && (
                                <p style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '15px',
                                    color: '#475569',
                                    lineHeight: 1.6,
                                    fontWeight: 500,
                                }}>
                                    {profile.bio}
                                </p>
                            )}

                            {profile.linkedin && (
                                <a
                                    href={profile.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        background: '#0077b5',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#005885';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#0077b5';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FontAwesomeIcon icon={faLinkedin} />
                                    Ver perfil de LinkedIn
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '16px',
                        padding: '24px 0',
                        borderTop: '1px solid #e5e7eb',
                    }}>
                        <div
                            onClick={() => navigate('/followers')}
                            style={{
                                textAlign: 'center',
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
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#0f172a',
                                marginBottom: '4px',
                            }}>
                                {stats.seguidores}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}>
                                <FontAwesomeIcon icon={faUsers} style={{ fontSize: '14px' }} />
                                Seguidores
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/following')}
                            style={{
                                textAlign: 'center',
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
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#0f172a',
                                marginBottom: '4px',
                            }}>
                                {stats.siguiendo}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}>
                                <FontAwesomeIcon icon={faUserFriends} style={{ fontSize: '14px' }} />
                                Siguiendo
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/mis-creditos')}
                            style={{
                                textAlign: 'center',
                                padding: '12px',
                                cursor: 'pointer',  // ← AGREGAR
                                borderRadius: '12px',  // ← AGREGAR para el hover
                                transition: 'all 0.2s ease',  // ← AGREGAR para animación
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 800,
                                color: '#0f172a',
                                marginBottom: '4px',
                            }}>
                                {profile.creditos || 0}
                            </div>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}>
                                <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '14px', color: '#f59e0b' }} />
                                Créditos
                            </div>
                        </div>

                        {isMentor && (
                            <div style={{
                                textAlign: 'center',
                                padding: '12px',
                            }}>
                                <div style={{
                                    fontSize: '28px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    marginBottom: '4px',
                                }}>
                                    {stats.alumnosMentor}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}>
                                    <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: '14px', color: '#0d9488' }} />
                                    Alumnos
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cards de estadísticas detalladas */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    marginTop: '32px',
                }}>
                    {/* Apuntes Subidos */}
                    <div
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

                    {/* Reseñas Escritas - CLICKEABLE */}
                    <div
                        onClick={() => setShowReseniasModal(true)}
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

            {/* Modal de Mis Reseñas */}
            <MisReseniasModal
                open={showReseniasModal}
                onClose={() => setShowReseniasModal(false)}
                onEdit={handleEditReview}
            />

            {/* Modal de Edición */}
            {showEditModal && editingRating && (
                <AuthModal_HacerResenia
                    open={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingRating(null);
                    }}
                    onSave={handleSaveEdit}
                    preSelectedEntity={editingRating.selectedEntity}
                    initialData={editingRating}
                    isEditing={true}
                />
            )}


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