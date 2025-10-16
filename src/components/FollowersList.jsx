import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { followersAPI } from '../api/followers';

// ============================================
// ESTILOS (DEFINIDOS PRIMERO)
// ============================================
const containerStyle = {
    display: 'grid',
    gap: 12
};

const personItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    background: '#fff',
    borderRadius: 10,
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
};

const avatarContainerStyle = {
    position: 'relative',
    width: 48,
    height: 48,
    flexShrink: 0,
};

const personAvatarStyle = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #e5e7eb',
    transition: 'border-color 0.2s ease',
};

const personAvatarPlaceholderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 18,
    border: '3px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const personInfoStyle = {
    flex: 1,
    minWidth: 0,
};

const personNameStyle = {
    fontWeight: 700,
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const personUsernameStyle = {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
};

const arrowStyle = {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 700,
    transition: 'transform 0.2s ease, color 0.2s ease',
    flexShrink: 0,
};

const skeletonStyle = {
    height: 70,
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    borderRadius: 10,
    animation: 'shimmer 1.5s ease-in-out infinite',
};

const emptyStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    background: '#f8fafc',
    borderRadius: 12,
    border: '2px dashed #cbd5e1',
};

// Agregar animación shimmer
if (typeof document !== 'undefined' && !document.getElementById('followers-animations')) {
    const style = document.createElement('style');
    style.id = 'followers-animations';
    style.textContent = `
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// COMPONENTE
// ============================================
export function FollowersList({ userId, type = 'seguidores' }) {
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadLista();
    }, [userId, type]);

    const loadLista = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let data;
            if (type === 'seguidores') {
                const result = await followersAPI.obtenerSeguidores(userId);
                data = result.data || [];
            } else {
                const result = await followersAPI.obtenerSiguiendo(userId);
                data = result.data || [];
            }
            setLista(data);
        } catch (error) {
            console.error(`Error cargando ${type}:`, error);
            setLista([]);
        } finally {
            setLoading(false);
        }
    };

    const getPersona = (item) => {
        return type === 'seguidores' ? item.seguidor : item.seguido;
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={skeletonStyle}></div>
                ))}
            </div>
        );
    }

    if (lista.length === 0) {
        return (
            <div style={emptyStyle}>
                <span style={{ fontSize: 32, marginBottom: 12 }}>
                    {type === 'seguidores'}
                </span>
                <p style={{ color: '#6B7280', margin: 0 }}>
                    {type === 'seguidores'
                        ? 'No tienes seguidores aún'
                        : 'No sigues a nadie aún'}
                </p>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            {lista.map(item => {
                const persona = getPersona(item);
                const avatarSrc = persona.foto?.trim();
                const hasValidAvatar = avatarSrc && (avatarSrc.startsWith('http://') || avatarSrc.startsWith('https://'));
                const initial = (persona.nombre?.[0] || persona.username?.[0] || 'U').toUpperCase();

                return (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/user/${persona.username || persona.id_usuario}`)}
                        style={personItemStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f9ff';
                            e.currentTarget.style.borderColor = '#2563eb';
                            e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        {/* Avatar único */}
                        <div style={avatarContainerStyle}>
                            {hasValidAvatar ? (
                                <img
                                    src={avatarSrc}
                                    alt={persona.nombre}
                                    style={personAvatarStyle}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const placeholder = e.target.nextElementSibling;
                                        if (placeholder) placeholder.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div style={{
                                ...personAvatarPlaceholderStyle,
                                display: hasValidAvatar ? 'none' : 'flex'
                            }}>
                                {initial}
                            </div>
                        </div>

                        {/* Info del usuario */}
                        <div style={personInfoStyle}>
                            <div style={personNameStyle}>{persona.nombre}</div>
                            <div style={personUsernameStyle}>@{persona.username}</div>
                        </div>

                        {/* Flecha indicadora */}
                        <div style={arrowStyle}>→</div>
                    </div>
                );
            })}
        </div>
    );
}