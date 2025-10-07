// src/components/UserCard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← Agregado
import { supabase } from '../supabase'; // ← Agregado
import { useSeguidores } from '../hooks/useSeguidores';

export const UserCard = ({ usuario }) => {
    const [siguiendo, setSiguiendo] = useState(false);
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate(); // ← Agregado
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
                .maybeSingle(); // ← Cambiar .single() por .maybeSingle()

            setSiguiendo(!!data);
        } catch (error) {
            console.error('Error verificando seguimiento:', error);
        }
    };

    const manejarSeguir = async (e) => {
        e.stopPropagation();
        try {
            setCargando(true);

            if (siguiendo) {
                await dejarSeguir(usuario.id_usuario);
                setSiguiendo(false);
            } else {
                const resultado = await seguirUsuario(usuario.id_usuario);
                setSiguiendo(resultado.estado); // 'pendiente' o 'activo'
            }
        } catch (error) {
            console.error('Error al seguir:', error);
        } finally {
            setCargando(false);
        }
    };

    const irAlPerfil = () => {
        navigate(`/profile/${usuario.username || usuario.id_usuario}`);
    };

    return (
        <div
            onClick={irAlPerfil} // ← Click en la card navega al perfil
            style={{
                background: "white",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
                cursor: "pointer" // ← Agregar cursor pointer
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                {usuario.foto ? (
                    <img
                        src={usuario.foto}
                        alt={usuario.nombre}
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #E5E7EB'
                        }}
                    />
                ) : (
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        border: '2px solid #E5E7EB'
                    }}>
                        {(usuario.nombre?.[0] || 'U').toUpperCase()}
                    </div>
                )}
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
                        @{usuario.username}
                    </p>
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
                    background: siguiendo === 'activo' ? 'white' :
                        siguiendo === 'pendiente' ? '#FCD34D' : '#2563EB',
                    color: siguiendo === 'activo' ? '#2563EB' :
                        siguiendo === 'pendiente' ? '#78350F' : 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: cargando ? 'not-allowed' : 'pointer',
                    opacity: cargando ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                }}
            >
                {cargando ? 'Procesando...' :
                    siguiendo === 'activo' ? 'Siguiendo' :
                        siguiendo === 'pendiente' ? 'Pendiente' : 'Seguir'}
            </button>
        </div>
    );
};