import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Card } from '../components/ui/Card';
import { FollowersList } from '../components/FollowersList';

export default function FollowersPage() {
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('me-siguen'); // 'me-siguen' | 'sigo'
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserId();
    }, []);

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
                    <p style={{ marginTop: 16, color: '#64748b' }}>Cargando...</p>
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
                        ← Volver
                    </button>
                    <h1 style={titleStyle}>Seguidores</h1>
                </div>

                {/* Tabs */}
                <div style={tabsStyle}>
                    {[
                        { id: 'me-siguen', label: '👥 Me siguen' },
                        { id: 'sigo', label: '✔️ Sigo' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                ...tabButtonStyle,
                                background: tab === t.id ? '#2563EB' : 'white',
                                color: tab === t.id ? 'white' : '#374151',
                                border: tab === t.id ? '1px solid #2563EB' : '1px solid #D1D5DB'
                            }}
                        >
                            {t.label}
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

// ESTILOS
const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    padding: '20px 12px',
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
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #D1D5DB',
    background: 'white',
    color: '#111827',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: 16,
};

const titleStyle = {
    margin: '0 0 24px 0',
    fontSize: 32,
    fontWeight: 800,
    color: '#111827',
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
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid'
};

const cardStyle = {
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};