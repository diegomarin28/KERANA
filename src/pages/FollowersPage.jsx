import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { FollowersList } from '../components/FollowersList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserCheck, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function FollowersPage() {
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('me-siguen');
    const [counts, setCounts] = useState({ seguidores: 0, siguiendo: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserId();
    }, []);

    useEffect(() => {
        if (!userId) return;

        const loadCounts = async () => {
            const { count: seguidoresCount } = await supabase
                .from('seguidores')
                .select('*', { count: 'exact', head: true })
                .eq('seguido_id', userId)
                .eq('estado', 'activo');

            const { count: siguiendoCount } = await supabase
                .from('seguidores')
                .select('*', { count: 'exact', head: true })
                .eq('seguidor_id', userId)
                .eq('estado', 'activo');

            setCounts({
                seguidores: seguidoresCount || 0,
                siguiendo: siguiendoCount || 0
            });
        };

        loadCounts();
    }, [userId]);

    const fetchUserId = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/');
                return;
            }

            const { data } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('auth_id', user.id)
                .single();

            if (data) {
                setUserId(data.id_usuario);
            }
        } catch (err) {
            console.error('Error obteniendo usuario:', err);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !userId) {
        return (
            <div style={pageStyle}>
                <div style={centerStyle}>
                    <div style={spinnerStyle}></div>
                    <p style={{ marginTop: 16, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <button
                        onClick={() => navigate('/profile')}
                        style={backButtonStyle}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 8 }} />
                        Volver
                    </button>
                    <h1 style={titleStyle}>Seguidores</h1>
                </div>

                {/* Tabs */}
                <div style={tabsStyle}>
                    {[
                        {
                            id: 'me-siguen',
                            label: 'Seguidores',
                            icon: faUsers,
                            count: counts.seguidores
                        },
                        {
                            id: 'sigo',
                            label: 'Siguiendo',
                            icon: faUserCheck,
                            count: counts.siguiendo
                        }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                ...tabButtonStyle,
                                background: tab === t.id ? '#2563EB' : 'white',
                                color: tab === t.id ? 'white' : '#374151',
                                border: tab === t.id ? '2px solid #2563EB' : '2px solid #D1D5DB'
                            }}
                        >
                            <FontAwesomeIcon icon={t.icon} style={{ marginRight: 8 }} />
                            {t.label} ({t.count})
                        </button>
                    ))}
                </div>

                {/* Contenido */}
                <Card style={cardStyle}>
                    {tab === 'me-siguen' && (
                        <FollowersList userId={userId} type="seguidores" />
                    )}
                    {tab === 'sigo' && (
                        <FollowersList userId={userId} type="siguiendo" />
                    )}
                </Card>
            </div>
        </div>
    );
}

const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 12px',
    fontFamily: 'Inter, sans-serif',
};

const centerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
};

const spinnerStyle = {
    width: 32,
    height: 32,
    border: '2px solid #f3f4f6',
    borderTop: '2px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
};

const backButtonStyle = {
    padding: '10px 18px',
    borderRadius: 10,
    border: '2px solid #e2e8f0',
    background: 'white',
    color: '#374151',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 16,
    fontFamily: 'Inter, sans-serif',
    display: 'inline-flex',
    alignItems: 'center',
};

const titleStyle = {
    margin: '0 0 24px 0',
    fontSize: 32,
    fontWeight: 800,
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
};

const tabsStyle = {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center',
    flexWrap: 'wrap'
};

const tabButtonStyle = {
    padding: '12px 24px',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid',
    fontFamily: 'Inter, sans-serif',
    display: 'inline-flex',
    alignItems: 'center',
};

const cardStyle = {
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};