import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { MentorCard } from '../components/MentorCard';
import { useNavigate } from 'react-router-dom';


export default function Mentors() {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [filterMateria, setFilterMateria] = useState('all');
    const [allMaterias, setAllMaterias] = useState([]);

    // Estados para modales del calendario
    const [showCalendarView, setShowCalendarView] = useState(false);
    const [selectedMentorCalendar, setSelectedMentorCalendar] = useState(null);

    useEffect(() => {
        getCurrentUserId();
        loadMentors();
    }, []);

    const getCurrentUserId = async () => {
        try {
            const { data } = await supabase.rpc('obtener_usuario_actual_id');
            setCurrentUserId(data);
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
        }
    };

    const loadMentors = async () => {
        try {
            setLoading(true);

            const { data: currentUserData } = await supabase.rpc('obtener_usuario_actual_id');

            // Obtener mentores con calendly_disponible
            const { data: mentorsData, error: mentorsError } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, descripcion, id_usuario, acepta_virtual')
                .neq('id_usuario', currentUserData || 0)
                .limit(50);

            if (mentorsError) throw mentorsError;

            const { data: seguimientosData } = currentUserData ? await supabase
                .from('seguidores')
                .select('seguido_id')
                .eq('seguidor_id', currentUserData)
                .eq('estado', 'activo') : { data: [] };

            const siguiendoIds = new Set(seguimientosData?.map(s => s.seguido_id) || []);

            const mentorsWithDetails = await Promise.all(
                (mentorsData || []).map(async (m) => {
                    const { data: usuario } = await supabase
                        .from('usuario')
                        .select('nombre, username, foto, calendly_url')
                        .eq('id_usuario', m.id_usuario)
                        .maybeSingle();

                    const { data: materias } = await supabase
                        .from('mentor_materia')
                        .select('materia(nombre_materia)')
                        .eq('id_mentor', m.id_mentor);

                    return {
                        id_mentor: m.id_mentor,
                        id_usuario: m.id_usuario,
                        mentor_nombre: usuario?.nombre || 'Mentor',
                        username: usuario?.username,
                        foto: usuario?.foto,
                        estrellas_mentor: m.estrellas_mentor || 0,
                        descripcion: m.descripcion,
                        materias: materias?.map(mm => mm.materia.nombre_materia) || [],
                        siguiendo: siguiendoIds.has(m.id_usuario),
                        calendlyUrl: usuario?.calendly_url,
                        calendlyDisponible: m.calendly_disponible !== false
                    };
                })
            );

            const materiasUnicas = [...new Set(
                mentorsWithDetails.flatMap(m => m.materias)
            )].sort();

            setAllMaterias(materiasUnicas);
            setMentors(mentorsWithDetails);
        } catch (err) {
            console.error('Error cargando mentores:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMentors = mentors.filter(m => {
        const matchesSearch = m.mentor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.materias.some(mat => mat.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMateria = filterMateria === 'all' || m.materias.includes(filterMateria);

        return matchesSearch && matchesMateria;
    });

    // Filtrar solo mentores con calendario activo
    const mentorsWithCalendly = filteredMentors.filter(m =>
        m.calendlyUrl && m.calendlyDisponible !== false
    );

    const handleOpenCalendarView = () => {
        setShowCalendarView(true);
    };

    const handleOpenMentorCalendar = (mentor) => {
        setSelectedMentorCalendar(mentor);
    };

    if (loading) {
        return (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ margin: '0 0 8px 0' }}>Mentores</h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                        Conecta con mentores que pueden ayudarte en tus materias
                    </p>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 20
                }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} style={{ padding: 20, height: 200, animation: 'pulse 1.5s ease-in-out infinite' }}>
                            <div style={{ background: '#f3f4f6', height: 60, borderRadius: '50%', width: 60, marginBottom: 12 }} />
                            <div style={{ background: '#f3f4f6', height: 20, borderRadius: 4, marginBottom: 8 }} />
                            <div style={{ background: '#f3f4f6', height: 16, borderRadius: 4, width: '60%' }} />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
            {/* Header con stats */}
            <div style={{
                marginBottom: 32,
                padding: 24,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderRadius: 16,
                color: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: 32, fontWeight: 800 }}>
                            🎓 Mentores
                        </h1>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: 16 }}>
                            Conecta con {mentors.length} mentores que pueden ayudarte
                        </p>
                    </div>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '12px 20px',
                        borderRadius: 12,
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{mentors.length}</div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>Mentores activos</div>
                    </div>
                </div>
            </div>

            {/* Banner de Calendarios Disponibles */}
            {mentorsWithCalendly.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 24,
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16
                }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 28 }}>📅</span>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'white' }}>
                                Ver calendarios y agendar
                            </h3>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, opacity: 0.95, color: 'white', lineHeight: 1.5 }}>
                            {filterMateria === 'all'
                                ? `${mentorsWithCalendly.length} mentores tienen horarios disponibles`
                                : `${mentorsWithCalendly.length} mentores de ${filterMateria} con calendario activo`
                            }
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            onClick={handleOpenCalendarView}
                            style={{
                                padding: '14px 28px',
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
                            }}
                        >
                            <span style={{ fontSize: 20 }}>🗓️</span>
                            Ver lista de mentores
                        </button>
                        <button
                            onClick={() => navigate('/calendario-global')}
                            style={{
                                padding: '14px 28px',
                                background: 'rgba(255,255,255,0.25)',
                                color: 'white',
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderRadius: 12,
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span style={{ fontSize: 20 }}>📅</span>
                            Ver calendario global
                        </button>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 12,
                marginBottom: 24
            }}>
                <input
                    type="text"
                    placeholder="🔍 Buscar por nombre o materia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10B981'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />

                <select
                    value={filterMateria}
                    onChange={(e) => setFilterMateria(e.target.value)}
                    style={{
                        padding: 12,
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        cursor: 'pointer',
                        outline: 'none',
                        background: 'white'
                    }}
                >
                    <option value="all">📚 Todas las materias</option>
                    {allMaterias.map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                    ))}
                </select>
            </div>

            {/* Resultados */}
            {filteredMentors.length === 0 ? (
                <Card style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 24 }}>No se encontraron mentores</h3>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: 16 }}>
                        {searchTerm || filterMateria !== 'all'
                            ? 'Intenta con otros criterios de búsqueda'
                            : 'Sé el primero en postularte como mentor'}
                    </p>
                    {(searchTerm || filterMateria !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterMateria('all');
                            }}
                            style={{
                                marginTop: 20,
                                padding: '10px 20px',
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </Card>
            ) : (
                <>
                    <div style={{
                        marginBottom: 16,
                        fontSize: 14,
                        color: '#6b7280',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>
                            Mostrando {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor' : 'mentores'}
                        </span>
                        {(searchTerm || filterMateria !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterMateria('all');
                                }}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    color: '#10B981',
                                    border: '1px solid #10B981',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 20
                    }}>
                        {filteredMentors.map(mentor => (
                            <MentorCard
                                key={mentor.id_mentor}
                                mentor={mentor}
                                onOpenCalendar={() => handleOpenMentorCalendar(mentor)}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Modal Vista de Calendarios (Grid) */}
            {showCalendarView && (
                <>
                    <div
                        onClick={() => setShowCalendarView(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 1000,
                            backdropFilter: 'blur(8px)'
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        borderRadius: 24,
                        padding: 0,
                        width: 'min(96vw, 1200px)',
                        maxHeight: 'min(92vh, 900px)',
                        zIndex: 1001,
                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '24px 32px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}>
                            <div>
                                <h2 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 700 }}>
                                    📅 Calendarios Disponibles
                                </h2>
                                <div style={{ fontSize: 14, opacity: 0.95 }}>
                                    {filterMateria === 'all'
                                        ? `${mentorsWithCalendly.length} mentores con calendario activo`
                                        : `${mentorsWithCalendly.length} mentores de ${filterMateria}`
                                    }
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCalendarView(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    fontSize: 28,
                                    cursor: 'pointer',
                                    color: 'white',
                                    padding: '4px 14px',
                                    borderRadius: 10,
                                    transition: 'background 0.2s',
                                    fontWeight: 300
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                ×
                            </button>
                        </div>

                        {/* Grid de mentores */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: 32
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: 20
                            }}>
                                {mentorsWithCalendly.map(mentor => (
                                    <div
                                        key={mentor.id_mentor}
                                        style={{
                                            background: 'white',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: 16,
                                            padding: 20,
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleOpenMentorCalendar(mentor)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = '#667eea';
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Avatar y nombre */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                            {mentor.foto ? (
                                                <img
                                                    src={mentor.foto}
                                                    alt={mentor.mentor_nombre}
                                                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: 24,
                                                    fontWeight: 700
                                                }}>
                                                    {mentor.mentor_nombre.charAt(0)}
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827', marginBottom: 2 }}>
                                                    {mentor.mentor_nombre}
                                                </div>
                                                <div style={{ color: '#6b7280', fontSize: 13 }}>
                                                    @{mentor.username}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Materias */}
                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {mentor.materias.map((mat, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            background: '#eff6ff',
                                                            color: '#1e40af',
                                                            padding: '4px 10px',
                                                            borderRadius: 6,
                                                            fontSize: 12,
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {mat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                                            <span style={{ color: '#fbbf24', fontSize: 16 }}>⭐</span>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{mentor.estrellas_mentor}</span>
                                        </div>

                                        {/* Botón */}
                                        <div style={{
                                            padding: '12px 16px',
                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                            color: 'white',
                                            borderRadius: 10,
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8
                                        }}>
                                            <span>📅</span>
                                            Ver calendario y agendar
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {mentorsWithCalendly.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60 }}>
                                    <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
                                    <h3 style={{ margin: '0 0 12px 0', fontSize: 20 }}>
                                        No hay calendarios disponibles
                                    </h3>
                                    <p style={{ color: '#6b7280', margin: 0 }}>
                                        {filterMateria === 'all'
                                            ? 'Los mentores aún no han configurado sus calendarios'
                                            : `No hay mentores de ${filterMateria} con calendario configurado`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Modal Calendario Individual */}
            {selectedMentorCalendar && (
                <>
                    <div
                        onClick={() => setSelectedMentorCalendar(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.7)',
                            zIndex: 1002,
                            backdropFilter: 'blur(8px)'
                        }}
                    />
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        borderRadius: 24,
                        padding: 0,
                        width: 'min(96vw, 1000px)',
                        height: 'min(92vh, 800px)',
                        zIndex: 1003,
                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 28px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            color: 'white'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {selectedMentorCalendar.foto ? (
                                    <img
                                        src={selectedMentorCalendar.foto}
                                        alt={selectedMentorCalendar.mentor_nombre}
                                        style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 20,
                                        fontWeight: 700
                                    }}>
                                        {selectedMentorCalendar.mentor_nombre.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700 }}>
                                        Agendar con {selectedMentorCalendar.mentor_nombre}
                                    </h2>
                                    <div style={{ fontSize: 13, opacity: 0.95 }}>
                                        {selectedMentorCalendar.materias.join(', ')}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMentorCalendar(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    fontSize: 28,
                                    cursor: 'pointer',
                                    color: 'white',
                                    padding: '4px 14px',
                                    borderRadius: 10,
                                    transition: 'background 0.2s',
                                    fontWeight: 300
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                ×
                            </button>
                        </div>

                        {/* Iframe de Calendly */}
                        <div style={{ flex: 1, background: '#fafafa' }}>
                            <iframe
                                src={selectedMentorCalendar.calendlyUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 'none' }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}