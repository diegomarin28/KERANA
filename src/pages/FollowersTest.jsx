// src/pages/FollowersTest.jsx
// Página temporal para probar el sistema de seguidores

import { useState, useEffect } from 'react';
import FollowButton from '../components/FollowButton';
import { useSeguidores } from '../hooks/useSeguidores';
import { supabase } from '../supabase';

export default function FollowersTest() {
    const [usuarios, setUsuarios] = useState([]);
    const [miId, setMiId] = useState(null);
    const [stats, setStats] = useState({ seguidores: 0, siguiendo: 0 });
    const { obtenerContadores } = useSeguidores();

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Obtener mi ID
            const { data: miIdData } = await supabase.rpc('obtener_usuario_actual_id');
            setMiId(miIdData);

            // Obtener algunos usuarios de ejemplo
            const { data: usuariosData } = await supabase
                .from('usuario')
                .select('id_usuario, nombre, username, foto')
                .neq('id_usuario', miIdData) // No mostrarme a mí mismo
                .limit(10);

            setUsuarios(usuariosData || []);

            // Cargar mis stats
            if (miIdData) {
                const statsData = await obtenerContadores(miIdData);
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    const handleFollowChange = async (newState) => {
        console.log('Estado cambiado a:', newState);
        // Recargar stats
        if (miId) {
            const statsData = await obtenerContadores(miId);
            setStats(statsData);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 20px',
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
            }}>
                {/* Header */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        color: '#1e293b',
                        margin: '0 0 8px 0',
                    }}>
                        🧪 Test de Seguidores
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#64748b',
                        margin: '0 0 24px 0',
                    }}>
                        Página temporal para probar el sistema
                    </p>

                    {/* Stats */}
                    <div style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                    }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#2563eb',
                            }}>
                                {stats.seguidores}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#64748b',
                                fontWeight: '500',
                            }}>
                                Seguidores
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#2563eb',
                            }}>
                                {stats.siguiendo}
                            </div>
                            <div style={{
                                fontSize: '14px',
                                color: '#64748b',
                                fontWeight: '500',
                            }}>
                                Siguiendo
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de usuarios */}
                <div style={{
                    display: 'grid',
                    gap: '12px',
                }}>
                    {usuarios.length === 0 ? (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '40px',
                            textAlign: 'center',
                            color: '#64748b',
                        }}>
                            Cargando usuarios...
                        </div>
                    ) : (
                        usuarios.map((usuario) => (
                            <div
                                key={usuario.id_usuario}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                }}
                            >
                                {/* Avatar */}
                                {usuario.foto ? (
                                    <img
                                        src={usuario.foto}
                                        alt={usuario.nombre}
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '2px solid #e5e7eb',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: '#fff',
                                        display: 'grid',
                                        placeItems: 'center',
                                        fontSize: '20px',
                                        fontWeight: '700',
                                    }}>
                                        {usuario.nombre?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#1e293b',
                                    }}>
                                        {usuario.nombre}
                                    </div>
                                    {usuario.username && (
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#64748b',
                                        }}>
                                            @{usuario.username}
                                        </div>
                                    )}
                                </div>

                                {/* Botón */}
                                <FollowButton
                                    usuarioId={usuario.id_usuario}
                                    onFollowChange={handleFollowChange}
                                    size="medium"
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Botón para recargar */}
                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                }}>
                    <button
                        onClick={cargarDatos}
                        style={{
                            padding: '12px 24px',
                            background: '#ffffff',
                            color: '#2563eb',
                            border: '2px solid #2563eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        🔄 Recargar datos
                    </button>
                </div>
            </div>
        </div>
    );
}