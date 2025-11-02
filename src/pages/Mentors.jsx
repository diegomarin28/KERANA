import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { MentorCard } from '../components/MentorCard';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGraduationCap, faFilter } from '@fortawesome/free-solid-svg-icons';

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
                .select('id_mentor, estrellas_mentor, descripcion, id_usuario, calendly_disponible')
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
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    maxWidth: 'min(1200px, 92vw)',
                    margin: '0 auto',
                    padding: '32px 20px'
                }}>
                    {/* Header Skeleton */}
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        padding: '48px 32px',
                        marginBottom: '32px',
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.3)',
                            height: '40px',
                            width: '200px',
                            borderRadius: '8px',
                            marginBottom: '12px'
                        }} />
                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            height: '20px',
                            width: '300px',
                            borderRadius: '6px'
                        }} />
                    </div>

                    {/* Filters Skeleton */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '16px',
                        marginBottom: '32px'
                    }}>
                        <div style={{
                            background: '#f3f4f6',
                            height: '48px',
                            borderRadius: '12px'
                        }} />
                        <div style={{
                            background: '#f3f4f6',
                            height: '48px',
                            borderRadius: '12px'
                        }} />
                    </div>

                    {/* Cards Skeleton */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '24px'
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Card key={i} style={{
                                padding: '24px',
                                height: '280px',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}>
                                <div style={{
                                    background: '#f3f4f6',
                                    height: '80px',
                                    width: '80px',
                                    borderRadius: '50%',
                                    marginBottom: '16px'
                                }} />
                                <div style={{
                                    background: '#f3f4f6',
                                    height: '24px',
                                    borderRadius: '6px',
                                    marginBottom: '12px'
                                }} />
                                <div style={{
                                    background: '#f3f4f6',
                                    height: '20px',
                                    borderRadius: '6px',
                                    width: '60%'
                                }} />
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                maxWidth: 'min(1200px, 92vw)',
                margin: '0 auto',
                padding: '32px 20px'
            }}>
                {/* Header Hero Mejorado */}
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <FontAwesomeIcon
                                icon={faGraduationCap}
                                style={{
                                    fontSize: '24px',
                                    color: 'white'
                                }}
                            />
                            <div>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: 'white'
                                }}>
                                    Mentores
                                </h1>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: 'rgba(255,255,255,0.9)',
                                    fontWeight: 500
                                }}>
                                    {mentors.length} mentores activos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Calendarios Disponibles */}
                {mentorsWithCalendly.length > 0 && (
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                            }}>
                                <span style={{ fontSize: '28px' }}>📅</span>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    color: 'white'
                                }}>
                                    Ver calendarios y agendar
                                </h3>
                            </div>
                            <p style={{
                                margin: 0,
                                fontSize: '14px',
                                opacity: 0.95,
                                color: 'white',
                                lineHeight: 1.5,
                                fontWeight: 500
                            }}>
                                {filterMateria === 'all'
                                    ? `${mentorsWithCalendly.length} mentores tienen horarios disponibles`
                                    : `${mentorsWithCalendly.length} mentores de ${filterMateria} con calendario activo`
                                }
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={handleOpenCalendarView}
                                style={{
                                    padding: '14px 28px',
                                    background: 'white',
                                    color: '#10b981',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                    fontFamily: 'Inter, sans-serif'
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
                                <span style={{ fontSize: '20px' }}>🗓️</span>
                                Ver lista de mentores
                            </button>
                            <button
                                onClick={() => navigate('/calendario-global')}
                                style={{
                                    padding: '14px 28px',
                                    background: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                    border: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    backdropFilter: 'blur(10px)',
                                    fontFamily: 'Inter, sans-serif'
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
                                <span style={{ fontSize: '20px' }}>📅</span>
                                Ver calendario global
                            </button>
                        </div>
                    </div>
                )}

                {/* Barra de Búsqueda y Filtros Mejorados */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {/* Barra de búsqueda con focus verde */}
                    <div style={{ position: 'relative' }}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                fontSize: '16px',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o materia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 500,
                                color: '#0f172a',
                                background: 'white',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#10b981';
                                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Select de materias */}
                    <div style={{ position: 'relative' }}>
                        <FontAwesomeIcon
                            icon={faFilter}
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                fontSize: '16px',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}
                        />
                        <select
                            value={filterMateria}
                            onChange={(e) => setFilterMateria(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 48px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 500,
                                color: '#0f172a',
                                background: 'white',
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif',
                                boxSizing: 'border-box',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 16px center'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#10b981';
                                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            <option value="all">Todas las materias</option>
                            {allMaterias.map(mat => (
                                <option key={mat} value={mat}>{mat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Resultados */}
                {filteredMentors.length === 0 ? (
                    <Card style={{
                        padding: '80px 32px',
                        textAlign: 'center',
                        border: '2px solid #f1f5f9'
                    }}>
                        <div style={{
                            fontSize: '64px',
                            marginBottom: '24px'
                        }}>
                            🔍
                        </div>
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#0f172a'
                        }}>
                            No se encontraron mentores
                        </h3>
                        <p style={{
                            color: '#64748b',
                            margin: '0 0 24px 0',
                            fontSize: '16px',
                            lineHeight: 1.6,
                            fontWeight: 500
                        }}>
                            {searchTerm || filterMateria !== 'all'
                                ? 'Intentá con otros criterios de búsqueda'
                                : 'Sé el primero en postularte como mentor'}
                        </p>
                        {(searchTerm || filterMateria !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterMateria('all');
                                }}
                                style={{
                                    padding: '12px 28px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#059669';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#10b981';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </Card>
                ) : (
                    <>
                        <div style={{
                            marginBottom: '20px',
                            fontSize: '14px',
                            color: '#64748b',
                            fontWeight: 600,
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
                                        padding: '8px 16px',
                                        background: 'white',
                                        color: '#10b981',
                                        border: '2px solid #10b981',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#10b981';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.color = '#10b981';
                                    }}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '24px'
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
                            borderRadius: '24px',
                            padding: 0,
                            width: 'min(96vw, 1200px)',
                            maxHeight: 'min(92vh, 900px)',
                            zIndex: 1001,
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '24px 32px',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white'
                            }}>
                                <div>
                                    <h2 style={{
                                        margin: '0 0 6px 0',
                                        fontSize: '22px',
                                        fontWeight: 700
                                    }}>
                                        📅 Calendarios Disponibles
                                    </h2>
                                    <div style={{
                                        fontSize: '14px',
                                        opacity: 0.95,
                                        fontWeight: 500
                                    }}>
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
                                        fontSize: '28px',
                                        cursor: 'pointer',
                                        color: 'white',
                                        padding: '4px 14px',
                                        borderRadius: '10px',
                                        transition: 'background 0.2s ease',
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
                                padding: '32px'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {mentorsWithCalendly.map(mentor => (
                                        <div
                                            key={mentor.id_mentor}
                                            style={{
                                                background: 'white',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '16px',
                                                padding: '20px',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleOpenMentorCalendar(mentor)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#10b981';
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Avatar y nombre */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                marginBottom: '16px'
                                            }}>
                                                {mentor.foto ? (
                                                    <img
                                                        src={mentor.foto}
                                                        alt={mentor.mentor_nombre}
                                                        style={{
                                                            width: '56px',
                                                            height: '56px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '56px',
                                                        height: '56px',
                                                        borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontSize: '24px',
                                                        fontWeight: 700
                                                    }}>
                                                        {mentor.mentor_nombre.charAt(0)}
                                                    </div>
                                                )}
                                                <div style={{
                                                    flex: 1,
                                                    minWidth: 0
                                                }}>
                                                    <div style={{
                                                        fontWeight: 700,
                                                        fontSize: '16px',
                                                        color: '#111827',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {mentor.mentor_nombre}
                                                    </div>
                                                    <div style={{
                                                        color: '#6b7280',
                                                        fontSize: '13px',
                                                        fontWeight: 500
                                                    }}>
                                                        @{mentor.username}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Materias */}
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '6px'
                                                }}>
                                                    {mentor.materias.map((mat, idx) => (
                                                        <span
                                                            key={idx}
                                                            style={{
                                                                background: '#d1fae5',
                                                                color: '#059669',
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {mat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Rating */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                marginBottom: '16px'
                                            }}>
                                                <span style={{
                                                    color: '#fbbf24',
                                                    fontSize: '16px'
                                                }}>
                                                    ⭐
                                                </span>
                                                <span style={{
                                                    fontWeight: 600,
                                                    fontSize: '14px'
                                                }}>
                                                    {mentor.estrellas_mentor}
                                                </span>
                                            </div>

                                            {/* Botón */}
                                            <div style={{
                                                padding: '12px 16px',
                                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                                color: 'white',
                                                borderRadius: '10px',
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}>
                                                <span>📅</span>
                                                Ver calendario y agendar
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {mentorsWithCalendly.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '60px 20px'
                                    }}>
                                        <div style={{
                                            fontSize: '64px',
                                            marginBottom: '16px'
                                        }}>
                                            📅
                                        </div>
                                        <h3 style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#0f172a'
                                        }}>
                                            No hay calendarios disponibles
                                        </h3>
                                        <p style={{
                                            color: '#6b7280',
                                            margin: 0,
                                            fontWeight: 500
                                        }}>
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
                            borderRadius: '24px',
                            padding: 0,
                            width: 'min(96vw, 1000px)',
                            height: 'min(92vh, 800px)',
                            zIndex: 1003,
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '20px 28px',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    {selectedMentorCalendar.foto ? (
                                        <img
                                            src={selectedMentorCalendar.foto}
                                            alt={selectedMentorCalendar.mentor_nombre}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            fontWeight: 700
                                        }}>
                                            {selectedMentorCalendar.mentor_nombre.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h2 style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '20px',
                                            fontWeight: 700
                                        }}>
                                            Agendar con {selectedMentorCalendar.mentor_nombre}
                                        </h2>
                                        <div style={{
                                            fontSize: '13px',
                                            opacity: 0.95,
                                            fontWeight: 500
                                        }}>
                                            {selectedMentorCalendar.materias.join(', ')}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedMentorCalendar(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        fontSize: '28px',
                                        cursor: 'pointer',
                                        color: 'white',
                                        padding: '4px 14px',
                                        borderRadius: '10px',
                                        transition: 'background 0.2s ease',
                                        fontWeight: 300
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Iframe de Calendly */}
                            <div style={{
                                flex: 1,
                                background: '#fafafa'
                            }}>
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
        </div>
    );
}