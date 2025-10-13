import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useSeguidores } from '../hooks/useSeguidores';

export function MentorCard({ mentor }) {
    const [siguiendo, setSiguiendo] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [materias, setMaterias] = useState([]);
    const navigate = useNavigate();
    const { seguirUsuario, dejarSeguir, obtenerMiUsuarioId } = useSeguidores();

    useEffect(() => {
        verificarSiSigo();
        cargarMaterias();
    }, [mentor.id_mentor]);

    const verificarSiSigo = async () => {
        try {
            const miId = await obtenerMiUsuarioId();
            if (!miId) return;

            // Buscar en seguidores por el id_usuario del mentor (no id_mentor)
            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_usuario')
                .eq('id_mentor', mentor.id_mentor)
                .single();

            if (!mentorData) return;

            const { data } = await supabase
                .from('seguidores')
                .select('id')
                .eq('seguidor_id', miId)
                .eq('seguido_id', mentorData.id_usuario)
                .eq('estado', 'activo')
                .maybeSingle();

            setSiguiendo(!!data);
        } catch (error) {
            console.error('Error verificando seguimiento:', error);
        }
    };

    const cargarMaterias = async () => {
        try {
            const { data } = await supabase
                .from('mentor_materia')
                .select('materia(nombre_materia)')
                .eq('id_mentor', mentor.id_mentor)
                .limit(3);

            if (data) {
                setMaterias(data.map(m => m.materia.nombre_materia));
            }
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    };

    const manejarSeguir = async (e) => {
        e.stopPropagation();
        try {
            setCargando(true);

            // Obtener id_usuario del mentor
            const { data: mentorData } = await supabase
                .from('mentor')
                .select('id_usuario')
                .eq('id_mentor', mentor.id_mentor)
                .single();

            if (!mentorData) return;

            if (siguiendo) {
                await dejarSeguir(mentorData.id_usuario);
                setSiguiendo(false);
            } else {
                const resultado = await seguirUsuario(mentorData.id_usuario);
                setSiguiendo(resultado.estado === 'activo');
            }
        } catch (error) {
            console.error('Error al seguir:', error);
        } finally {
            setCargando(false);
        }
    };

    const irAlPerfil = () => {
        navigate(`/profile/${mentor.username || mentor.id_mentor}`);
    };

    const estrellas = mentor.estrellas_mentor || mentor.rating_promedio || 0;

    return (
        <div
            onClick={irAlPerfil}
            style={{
                background: "white",
                borderRadius: 12,
                padding: 20,
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
                cursor: "pointer"
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
                {mentor.foto ? (
                    <img
                        src={mentor.foto}
                        alt={mentor.mentor_nombre}
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #10B981'
                        }}
                    />
                ) : (
                    <div style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        border: '3px solid #D1FAE5'
                    }}>
                        {(mentor.mentor_nombre?.[0] || 'M').toUpperCase()}
                    </div>
                )}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#111827"
                        }}>
                            {mentor.mentor_nombre}
                        </h3>
                        <span style={{
                            background: "#10B981",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600
                        }}>
                            🎓 MENTOR
                        </span>
                    </div>
                    {mentor.username && (
                        <p style={{
                            margin: "0 0 8px 0",
                            color: "#6B7280",
                            fontSize: 14
                        }}>
                            @{mentor.username}
                        </p>
                    )}

                    {/* Estrellas */}
                    {estrellas > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ color: '#F59E0B', fontSize: 16 }}>⭐</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                {estrellas.toFixed(1)}
                            </span>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>
                                calificación
                            </span>
                        </div>
                    )}

                    {/* Materias */}
                    {materias.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {materias.map((materia, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        background: '#EFF6FF',
                                        color: '#1E40AF',
                                        padding: '3px 8px',
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 600
                                    }}
                                >
                                    {materia}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={manejarSeguir}
                disabled={cargando}
                style={{
                    width: '100%',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: siguiendo ? '1px solid #10B981' : '1px solid #10B981',
                    background: siguiendo ? 'white' : '#10B981',
                    color: siguiendo ? '#10B981' : 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: cargando ? 'not-allowed' : 'pointer',
                    opacity: cargando ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    if (!cargando) {
                        e.target.style.transform = 'scale(1.02)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                }}
            >
                {cargando ? 'Procesando...' : siguiendo ? 'Siguiendo' : 'Seguir'}
            </button>
        </div>
    );
}