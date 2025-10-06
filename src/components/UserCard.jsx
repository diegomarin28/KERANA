// src/components/UserCard.jsx
import { useState, useEffect } from 'react';
import { useSeguidores } from '../hooks/useSeguidores';

export const UserCard = ({ usuario }) => {
    const [siguiendo, setSiguiendo] = useState(false);
    const [cargando, setCargando] = useState(false);
    const { seguirUsuario, dejarSeguir, obtenerMiUsuarioId } = useSeguidores();

    useEffect(() => {
        verificarSiSigo();
    }, [usuario.id_usuario]);

    const verificarSiSigo = async () => {
        try {
            const miId = await obtenerMiUsuarioId();
            if (!miId) return;

            const { data } = await supabase
                .from('seguidores')
                .select('id')
                .eq('seguidor_id', miId)
                .eq('seguido_id', usuario.id_usuario)
                .eq('estado', 'activo')
                .single();

            setSiguiendo(!!data);
        } catch (error) {
            console.error('Error verificando seguimiento:', error);
        }
    };

    const manejarSeguir = async () => {
        try {
            setCargando(true);

            if (siguiendo) {
                await dejarSeguir(usuario.id_usuario);
                setSiguiendo(false);
            } else {
                await seguirUsuario(usuario.id_usuario);
                setSiguiendo(true);
            }
        } catch (error) {
            console.error('Error al seguir/dejar de seguir:', error);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{
            background: "white",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease"
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                <img
                    src={usuario.avatar_url || '/default-avatar.png'}
                    alt={usuario.nombre}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        objectFit: 'cover'
                    }}
                />
                <div style={{ flex: 1 }}>
                    <h3 style={{
                        margin: "0 0 4px 0",
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#111827"
                    }}>
                        {usuario.nombre}
                    </h3>
                    <p style={{
                        margin: "0 0 8px 0",
                        color: "#6B7280",
                        fontSize: 14
                    }}>
                        {usuario.correo}
                    </p>
                    {usuario.bio && (
                        <p style={{
                            margin: "0 0 8px 0",
                            color: "#4B5563",
                            fontSize: 14,
                            lineHeight: 1.4
                        }}>
                            {usuario.bio}
                        </p>
                    )}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{
                            fontSize: 12,
                            color: "#6B7280"
                        }}>
                            {usuario.seguidores_count || 0} seguidores
                        </span>
                        {usuario.es_mentor && (
                            <span style={{
                                background: "#10B981",
                                color: "white",
                                padding: "2px 8px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600
                            }}>
                                Mentor
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={manejarSeguir}
                disabled={cargando}
                style={{
                    width: '100%',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #2563EB',
                    background: siguiendo ? 'white' : '#2563EB',
                    color: siguiendo ? '#2563EB' : 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
            >
                {cargando ? '...' : (siguiendo ? 'Siguiendo' : 'Seguir')}
            </button>
        </div>
    );
};