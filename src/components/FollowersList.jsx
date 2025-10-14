import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { followersAPI } from '../api/followers';

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
                    {type === 'seguidores' ? '👥' : '✔️'}
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
                return (
                    <div
                        key={item.id}
                        onClick={() => navigate(`/profile/${persona.username || persona.id_usuario}`)}
                        style={personItemStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f9ff';
                            e.currentTarget.style.borderColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        {persona.foto ? (
                            <img
                                src={persona.foto}
                                alt={persona.nombre}
                                style={personAvatarStyle}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : null}
                        {!persona.foto || true && (
                            <div style={personAvatarPlaceholderStyle}>
                                {(persona.nombre?.[0] || 'U').toUpperCase()}
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <div style={personNameStyle}>{persona.nombre}</div>
                            <div style={personUsernameStyle}>@{persona.username}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ESTILOS
const containerStyle = {
    display: 'grid',
    gap: 12
};

const personItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

const personAvatarStyle = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e2e8f0'
};

const personAvatarPlaceholderStyle = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0
};

const personNameStyle = {
    fontWeight: 600,
    color: '#111827',
    fontSize: 14
};

const personUsernameStyle = {
    fontSize: 12,
    color: '#6B7280'
};

const skeletonStyle = {
    height: 50,
    background: '#e2e8f0',
    borderRadius: 8,
    animation: 'pulse 1.5s ease-in-out infinite'
};

const emptyStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px dashed #e2e8f0'
};