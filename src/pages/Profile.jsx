import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        apuntesSubidos: 0,
        reseñasEscritas: 0,
        seguidores: 0,
        siguiendo: 0
    });

    useEffect(() => {
        fetchProfile();
        fetchRealStats();
    }, []);

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

        } catch (err) {
            console.error('Error cargando perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRealStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log("No hay usuario autenticado");
                return;
            }

            // Obtener el ID numérico del usuario usando auth_id
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)  // ← Campo correcto: auth_id
                .single();

            if (usuarioError || !usuarioData) {
                console.log("No se pudo obtener el usuario:", usuarioError);
                setStats({ apuntes: 0, reseñas: 0 });
                return;
            }

            const usuarioId = usuarioData.id_usuario;

            console.log("Usuario ID numérico:", usuarioId);

            // Consulta para apuntes
            const { count: apuntesCount, error: apuntesError } = await supabase
                .from('apunte')
                .select('*', { count: 'exact', head: true })
                .eq('id_usuario', usuarioId);

            // Consultas para reseñas desde las tablas base
            const [evaluaResult, calificaResult] = await Promise.all([
                supabase
                    .from('evalua')  // Reseñas de profesores
                    .select('*', { count: 'exact', head: true })
                    .eq('id_usuario', usuarioId),
                supabase
                    .from('califica')  // Reseñas de mentores
                    .select('*', { count: 'exact', head: true })
                    .eq('id_usuario', usuarioId)
            ]);

            // Manejar errores y calcular totals
            const totalApuntes = apuntesError ? 0 : (apuntesCount || 0);
            const totalReseñas = (evaluaResult.error ? 0 : (evaluaResult.count || 0)) +
                (calificaResult.error ? 0 : (calificaResult.count || 0));

            console.log("Resultados:", {
                totalApuntes,
                totalReseñas,
                evaluaCount: evaluaResult.count || 0,
                calificaCount: calificaResult.count || 0
            });

            setStats({
                apuntesSubidos: totalApuntes,
                reseñasEscritas: totalReseñas,
                seguidores: 0,
                siguiendo: 0
            });

        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            setStats({ apuntes: 0, reseñas: 0 });
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

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}> {/*el max with cambia el ancho de la pag*/}
                {/* Header del Perfil - BLOQUE AZUL GRANDE */}
                <Card style={profileHeaderStyle}>
                    <div style={headerContentStyle}>
                        {/* Sección izquierda: Avatar e información */}
                        <div style={leftSectionStyle}>
                            <div style={avatarStyle}>
                                {profile?.foto ? (
                                    <img
                                        src={profile.foto}
                                        alt={profile.nombre}
                                        style={avatarImageStyle}
                                    />
                                ) : (
                                    <div style={avatarPlaceholderStyle}>
                                        {(profile?.username?.[0] || profile?.nombre?.[0] || 'U').toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div style={profileInfoStyle}>
                                <h1 style={profileNameStyle}>{profile?.nombre || 'Usuario'}</h1>
                                <p style={profileUsernameStyle}>@{profile?.username || 'usuario'}</p>
                                <p style={profileEmailStyle}>{profile?.correo}</p>

                                {/* Créditos */}
                                <div style={creditsContainerStyle}>
                                    <span style={creditsTextStyle}>{profile?.creditos ?? 10} créditos</span>
                                </div>

                                {/* Estadísticas en el header */}
                                <div style={headerStatsStyle}>
                                    <div style={headerStatItemStyle}>
                                        <div style={headerStatNumberStyle}>{stats.seguidores}</div>
                                        <div style={headerStatLabelStyle}>Seguidores</div>
                                    </div>
                                    <div style={headerStatItemStyle}>
                                        <div style={headerStatNumberStyle}>{stats.siguiendo}</div>
                                        <div style={headerStatLabelStyle}>Siguiendo</div>
                                    </div>
                                </div>

                                {/* Botón Editar Perfil */}
                                <div style={actionsStyle}>
                                    <EditProfileButton />
                                </div>
                            </div>
                        </div>

                        {/* Sección derecha: Mi Contenido DENTRO DEL BLOQUE AZUL - MÁS GRANDE */}
                        <div style={rightSectionStyle}>
                            <Card style={contentStatsCardStyle}>
                                <h3 style={sectionTitleStyle}>Mi Contenido</h3>
                                <div style={contentStatsGridStyle}>
                                    <div style={contentStatItemStyle}>
                                        <div style={contentStatNumberStyle}>{stats.apuntesSubidos}</div>
                                        <div style={contentStatLabelStyle}>Apuntes Subidos</div>
                                    </div>
                                    <div style={contentStatItemStyle}>
                                        <div style={contentStatNumberStyle}>{stats.reseñasEscritas}</div>
                                        <div style={contentStatLabelStyle}>Reseñas Escritas</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Card>

                {/* Actividad Reciente - COMO NOTIFICACIONES */}
                <Card style={activityCardStyle}>
                    <h3 style={sectionTitleStyle}>Actividad Reciente</h3>
                    <div style={activityStyle}>
                        {/* Notificación de créditos - SIEMPRE VISIBLE */}
                        <div style={notificationItemStyle}>
                            <div style={notificationIconStyle}>💰</div>
                            <div style={notificationContentStyle}>
                                <div style={notificationTextStyle}>
                                    Recibiste <strong>10 créditos</strong> de bienvenida
                                </div>
                                <div style={notificationTimeStyle}>Hace unos momentos</div>
                            </div>
                            <div style={notificationBadgeStyle}>Nuevo</div>
                        </div>

                        {stats.apuntesSubidos > 0 ? (
                            <div style={notificationItemStyle}>
                                <div style={notificationIconStyle}>📚</div>
                                <div style={notificationContentStyle}>
                                    <div style={notificationTextStyle}>
                                        Tienes <strong>{stats.apuntesSubidos} apuntes</strong> subidos a la comunidad
                                    </div>
                                    <div style={notificationTimeStyle}>Actividad continua</div>
                                </div>
                            </div>
                        ) : (
                            <div style={notificationItemStyle}>
                                <div style={notificationIconStyle}>📚</div>
                                <div style={notificationContentStyle}>
                                    <div style={notificationTextStyle}>
                                        <strong>Comienza a compartir</strong> tus apuntes
                                    </div>
                                    <div style={notificationTimeStyle}>
                                        <Button
                                            variant="primary"
                                            size="small"
                                            onClick={() => window.location.href = '/upload'}
                                            style={notificationButtonStyle}
                                        >
                                            Subir primer apunte
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {stats.reseñasEscritas > 0 ? (
                            <div style={notificationItemStyle}>
                                <div style={notificationIconStyle}>⭐</div>
                                <div style={notificationContentStyle}>
                                    <div style={notificationTextStyle}>
                                        Has escrito <strong>{stats.reseñasEscritas} reseñas</strong>
                                    </div>
                                    <div style={notificationTimeStyle}>Tu opinión cuenta</div>
                                </div>
                            </div>
                        ) : (
                            <div style={notificationItemStyle}>
                                <div style={notificationIconStyle}>⭐</div>
                                <div style={notificationContentStyle}>
                                    <div style={notificationTextStyle}>
                                        <strong>Califica apuntes</strong> que hayas usado
                                    </div>
                                    <div style={notificationTimeStyle}>
                                        <Button
                                            variant="primary"
                                            size="small"
                                            onClick={() => window.location.href = '/reviews'}
                                            style={notificationButtonStyle}
                                        >
                                            Escribir reseña
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={notificationItemStyle}>
                            <div style={notificationIconStyle}>🎓</div>
                            <div style={notificationContentStyle}>
                                <div style={notificationTextStyle}>
                                    <strong>Conviértete en mentor</strong> de la comunidad
                                </div>
                                <div style={notificationTimeStyle}>
                                    <Button
                                        variant="outline"
                                        size="small"
                                        onClick={() => window.location.href = '/become-mentor'}
                                        style={notificationButtonStyle}
                                    >
                                        Ser mentor
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Notificación de bienvenida */}
                        <div style={notificationItemStyle}>
                            <div style={notificationIconStyle}>👋</div>
                            <div style={notificationContentStyle}>
                                <div style={notificationTextStyle}>
                                    <strong>¡Bienvenido a KERANA!</strong> Tu viaje comienza aquí
                                </div>
                                <div style={notificationTimeStyle}>Recién llegado</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Componente del botón Editar Perfil
function EditProfileButton() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={() => window.location.href = '/edit-profile'}
            style={isHovered ? editButtonHoverStyle : editButtonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            Editar Perfil
        </button>
    );
}

// Estilos
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '14px 12px', // ACHICADO
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
};

const spinnerStyle = {
    width: 32, // ACHICADO
    height: 32, // ACHICADO
    border: '2px solid #f3f4f6', // ACHICADO
    borderTop: '2px solid #2563eb', // ACHICADO
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

// HEADER - BLOQUE AZUL GRANDE (ACHICADO)
const profileHeaderStyle = {
    padding: '22px', // ACHICADO
    marginBottom: '15px', // ACHICADO
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    color: 'white',
    borderRadius: '18px', // ACHICADO
    border: '2px solid rgba(255,255,255,0.2)',
};

const headerContentStyle = {
    display: 'flex',
    gap: '24px', // ACHICADO
    alignItems: 'flex-start',
};

const leftSectionStyle = {
    flex: 1,
    display: 'flex',
    gap: '20px', // ACHICADO
    alignItems: 'flex-start',
};

// AQUÍ SE AGREGA EL ANCHO PARA "MI CONTENIDO" - CAMBIA ESTE VALOR PARA AJUSTAR
const rightSectionStyle = {
    width: 480, // AGREGADO - PUEDES CAMBIAR ESTE NÚMERO (380, 400, 450, etc.)
    flexShrink: 0,
};

const avatarStyle = {
    width: 80, // ACHICADO
    height: 80, // ACHICADO
    borderRadius: '50%',
    overflow: 'hidden',
    border: '4px solid rgba(255,255,255,0.3)', // ACHICADO
    flexShrink: 0,
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
    fontSize: '32px', // ACHICADO
    fontWeight: 'bold',
    color: 'white',
};

const profileInfoStyle = {
    flex: 1,
};

const profileNameStyle = {
    margin: '0 0 6px 0', // ACHICADO
    fontSize: '28px', // ACHICADO
    fontWeight: '800',
};

const profileUsernameStyle = {
    margin: '0 0 6px 0', // ACHICADO
    fontSize: '16px', // ACHICADO
    opacity: 0.9,
};

const profileEmailStyle = {
    margin: '0 0 12px 0', // ACHICADO
    fontSize: '14px', // ACHICADO
    opacity: 0.8,
};

// Créditos
const creditsContainerStyle = {
    marginBottom: '16px', // ACHICADO
};

// Estadísticas en el header
const headerStatsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px', // ACHICADO
    flexWrap: 'wrap',
    marginBottom: '16px', // ACHICADO
};

const headerStatItemStyle = {
    textAlign: 'center',
};

const headerStatNumberStyle = {
    fontSize: '22px', // ACHICADO
    fontWeight: '800',
    marginBottom: '2px', // ACHICADO
};

const headerStatLabelStyle = {
    fontSize: '12px', // ACHICADO
    opacity: 0.9,
    fontWeight: '600',
};

const actionsStyle = {
    display: 'flex',
    gap: '10px', // ACHICADO
};

// Botón Editar Perfil
const editButtonStyle = {
    padding: '10px 20px', // ACHICADO
    borderRadius: '6px', // ACHICADO
    border: '2px solid white',
    background: 'transparent',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px', // ACHICADO
    transition: 'all 0.2s ease',
};

const editButtonHoverStyle = {
    ...editButtonStyle,
    background: 'white',
    color: '#2563eb',
};

// MI CONTENIDO - DENTRO DEL BLOQUE AZUL (MÁS GRANDE)
const contentStatsCardStyle = {
    padding: '20px', // ACHICADO pero más ancho por el rightSectionStyle
    background: 'white',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    height: '100%', // Para que ocupe todo el espacio disponible
};

// ACTIVIDAD RECIENTE - ABAJO DEL BLOQUE AZUL (ACHICADO)
const activityCardStyle = {
    padding: '24px', // ACHICADO
    background: 'white',
    borderRadius: '12px', // ACHICADO
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const sectionTitleStyle = {
    margin: '0 0 16px 0', // ACHICADO
    fontSize: '18px', // ACHICADO
    fontWeight: '700',
    color: '#1e293b',
    borderBottom: '1px solid #e2e8f0', // ACHICADO
    paddingBottom: '8px', // ACHICADO
};

// ESTADÍSTICAS DE CONTENIDO (MÁS GRANDES)
const contentStatsGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
};

const contentStatItemStyle = {
    textAlign: 'center',
    padding: '20px 16px', // ACHICADO
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
};

const contentStatNumberStyle = {
    fontSize: '32px', // MANTENIDO GRANDE
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: '6px', // ACHICADO
};

const contentStatLabelStyle = {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '600',
};

// ACTIVIDAD RECIENTE (ACHICADO)
const activityStyle = {
    display: 'grid',
    gap: '16px', // ACHICADO
};

const activityItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px', // ACHICADO
    padding: '16px', // ACHICADO
    background: '#f8fafc',
    borderRadius: '8px', // ACHICADO
    border: '1px solid #e2e8f0',
};

const activityIconStyle = {
    fontSize: '20px', // ACHICADO
    flexShrink: 0,
    marginTop: '2px',
};

const activityTextStyle = {
    fontWeight: '600',
    color: '#334155',
    fontSize: '14px', // ACHICADO
    marginBottom: '4px',
};

const activityTimeStyle = {
    fontSize: '12px', // ACHICADO
    color: '#64748b',
};
// NUEVOS ESTILOS PARA NOTIFICACIONES
const notificationItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginBottom: '8px',
    position: 'relative',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
};

const notificationIconStyle = {
    fontSize: '18px',
    flexShrink: 0,
    marginTop: '2px',
    background: '#f1f5f9',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const notificationContentStyle = {
    flex: 1,
};

const notificationTextStyle = {
    fontWeight: '600',
    color: '#334155',
    fontSize: '14px',
    marginBottom: '4px',
};

const notificationTimeStyle = {
    fontSize: '12px',
    color: '#64748b',
};

const notificationBadgeStyle = {
    background: '#dc2626',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    position: 'absolute',
    top: '12px',
    right: '12px',
};

const notificationButtonStyle = {
    marginTop: '8px',
};

//Estilo de creditos
const creditsTextStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '20px',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
};