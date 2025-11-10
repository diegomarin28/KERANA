import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Card } from '../components/UI/Card';
import { MentorCard } from '../components/MentorCard';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faGraduationCap, faFilter, faCalendarAlt, faChevronDown, faList, faCalendarDay, faStar, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import MentorCalendarModal from '../components/MentorCalendarModal';
import { slotsAPI } from '../api/slots.js';

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
    const [selectedMentorForCalendar, setSelectedMentorForCalendar] = useState(null);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    // Estado para dropdown
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        getCurrentUserId();
        loadMentors();
    }, []);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

            // Obtener mentores
            const { data: mentorsData, error: mentorsError } = await supabase
                .from('mentor')
                .select('id_mentor, estrellas_mentor, descripcion, id_usuario, acepta_virtual')
                .neq('id_usuario', currentUserData || 0)
                .order('estrellas_mentor', { ascending: false, nullsFirst: false })
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
                        .select('nombre, username, foto')
                        .eq('id_usuario', m.id_usuario)
                        .maybeSingle();

                    const { data: materias } = await supabase
                        .from('mentor_materia')
                        .select('materia(id_materia, nombre_materia)')
                        .eq('id_mentor', m.id_mentor);

                    // Obtener rating calculado desde la tabla rating (igual que MentorCard)
                    const { data: reviewsData } = await supabase
                        .from('rating')
                        .select('estrellas, tags')
                        .eq('tipo', 'mentor')
                        .eq('ref_id', m.id_mentor);

                    let ratingPromedio = 0;
                    let numReviews = 0;

                    if (reviewsData && reviewsData.length > 0) {
                        const sum = reviewsData.reduce((acc, r) => acc + (r.estrellas || 0), 0);
                        ratingPromedio = +(sum / reviewsData.length).toFixed(1);
                        numReviews = reviewsData.length;
                    }

                    return {
                        id_mentor: m.id_mentor,
                        id_usuario: m.id_usuario,
                        mentor_nombre: usuario?.nombre || 'Mentor',
                        username: usuario?.username,
                        foto: usuario?.foto,
                        estrellas_mentor: ratingPromedio,
                        num_reviews: numReviews,
                        descripcion: m.descripcion,
                        materias: materias?.map(mm => mm.materia.nombre_materia) || [],
                        materiasCompletas: materias?.map(mm => ({
                            id: mm.materia.id_materia,
                            nombre: mm.materia.nombre_materia
                        })) || [],
                        siguiendo: siguiendoIds.has(m.id_usuario)
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

    const handleOpenCalendarView = () => {
        setShowCalendarView(true);
        setDropdownOpen(false);
    };

    const handleOpenMentorCalendar = (mentor) => {
        setSelectedMentorForCalendar(mentor);
        setShowCalendarModal(true);
    };

    const handleCloseCalendarModal = () => {
        setShowCalendarModal(false);
        setSelectedMentorForCalendar(null);
    };

    const handleNavigateGlobalCalendar = () => {
        navigate('/calendario-global');
        setDropdownOpen(false);
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
                        background: '#0d9488',
                        borderRadius: '12px',
                        padding: '20px 24px',
                        marginBottom: '24px',
                        boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.3)',
                            height: '28px',
                            width: '150px',
                            borderRadius: '6px',
                            marginBottom: '8px'
                        }} />
                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            height: '18px',
                            width: '200px',
                            borderRadius: '4px'
                        }} />
                    </div>

                    {/* Filters Skeleton */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr',
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
                {/* Header Mejorado */}
                <div style={{
                    background: '#0d9488',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
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
                                    Conectá con {mentors.length} mentores que pueden ayudarte
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dropdown para Calendarios - Debajo del Header */}
                {filteredMentors.length > 0 && (
                    <div style={{
                        marginBottom: '24px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <div style={{ position: 'relative' }} ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    padding: '14px 28px',
                                    background: '#0d9488',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(13, 148, 136, 0.4)';
                                    e.currentTarget.style.background = '#14b8a6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(13, 148, 136, 0.3)';
                                    e.currentTarget.style.background = '#0d9488';
                                }}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '18px' }} />
                                Agendar Mentoría
                                <FontAwesomeIcon
                                    icon={faChevronDown}
                                    style={{
                                        fontSize: '14px',
                                        transition: 'transform 0.2s ease',
                                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                    overflow: 'hidden',
                                    minWidth: '280px',
                                    zIndex: 100,
                                    border: '2px solid #e2e8f0',
                                    animation: 'slideDown 0.2s ease'
                                }}>
                                    <button
                                        onClick={handleOpenCalendarView}
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            background: 'white',
                                            border: 'none',
                                            borderBottom: '1px solid #f1f5f9',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            fontFamily: 'Inter, sans-serif',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faList}
                                            style={{
                                                fontSize: '16px',
                                                color: '#0d9488',
                                                width: '20px'
                                            }}
                                        />
                                        <div>
                                            <div>Ver lista de mentores</div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#64748b',
                                                fontWeight: 500,
                                                marginTop: '2px'
                                            }}>
                                                {filteredMentors.length} {filteredMentors.length === 1 ? 'mentor disponible' : 'mentores disponibles'}
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={handleNavigateGlobalCalendar}
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            background: 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            fontFamily: 'Inter, sans-serif',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: '#0f172a',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faCalendarDay}
                                            style={{
                                                fontSize: '16px',
                                                color: '#0d9488',
                                                width: '20px'
                                            }}
                                        />
                                        <div>
                                            <div>Ver calendario global</div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#64748b',
                                                fontWeight: 500,
                                                marginTop: '2px'
                                            }}>
                                                Todos los horarios disponibles
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Barra de Búsqueda y Filtros */}
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
                                e.target.style.borderColor = '#0d9488';
                                e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.1)';
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
                                e.target.style.borderColor = '#0d9488';
                                e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.1)';
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
                                    background: '#0d9488',
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
                                    e.currentTarget.style.background = '#14b8a6';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#0d9488';
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
                                        color: '#0d9488',
                                        border: '2px solid #0d9488',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#0d9488';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.color = '#0d9488';
                                    }}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            rowGap: '48px',
                            columnGap: '32px'
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
                                background: '#0d9488',
                                color: 'white'
                            }}>
                                <div>
                                    <h2 style={{
                                        margin: '0 0 6px 0',
                                        fontSize: '22px',
                                        fontWeight: 700
                                    }}>
                                        <FontAwesomeIcon icon={faCalendarDays} /> Mentores Disponibles
                                    </h2>
                                    <div style={{
                                        fontSize: '14px',
                                        opacity: 0.95,
                                        fontWeight: 500
                                    }}>
                                        {filteredMentors.length} mentores disponibles
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
                                    rowGap: '30px',
                                    columnGap: '20px'
                                }}>
                                    {filteredMentors.map(mentor => (
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
                                            onClick={() => {
                                                handleOpenMentorCalendar(mentor);
                                                setShowCalendarView(false);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#0d9488';
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(13, 148, 136, 0.2)';
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
                                                        background: '#0d9488',
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
                                                                background: '#ccfbf1',
                                                                color: '#0d9488',
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
                                                <FontAwesomeIcon
                                                    icon={faStar}
                                                    style={{
                                                        color: mentor.estrellas_mentor > 0 ? '#fbbf24' : '#d1d5db',
                                                        fontSize: '18px'
                                                    }}
                                                />
                                                <span style={{
                                                    fontWeight: 700,
                                                    fontSize: '16px',
                                                    color: mentor.estrellas_mentor > 0 ? '#111827' : '#9ca3af'
                                                }}>
                                                    {mentor.estrellas_mentor > 0 ? mentor.estrellas_mentor.toFixed(1) : '0.0'}
                                                </span>
                                                {mentor.num_reviews > 0 && (
                                                    <span style={{
                                                        fontSize: '14px',
                                                        color: '#6b7280',
                                                        fontWeight: 500
                                                    }}>
                                                        ({mentor.num_reviews})
                                                    </span>
                                                )}
                                            </div>

                                            {/* Botón */}
                                            <div style={{
                                                padding: '12px 16px',
                                                background: '#0d9488',
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
                                                    <FontAwesomeIcon icon={faCalendarDays} />
                                                    Ver calendario y agendar
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredMentors.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '60px 20px'
                                    }}>
                                        <div style={{
                                            fontSize: '64px',
                                            marginBottom: '16px'
                                        }}>
                                            <FontAwesomeIcon icon={faCalendarDays} />
                                        </div>
                                        <h3 style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            color: '#0f172a'
                                        }}>
                                            No hay mentores disponibles
                                        </h3>
                                        <p style={{
                                            color: '#6b7280',
                                            margin: 0,
                                            fontWeight: 500
                                        }}>
                                            Intenta con otros criterios de búsqueda
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Modal de Calendario Personalizado */}
                {showCalendarModal && selectedMentorForCalendar && (
                    <MentorCalendarModal
                        open={showCalendarModal}
                        onClose={handleCloseCalendarModal}
                        mentorId={selectedMentorForCalendar.id_mentor}
                        mentorName={selectedMentorForCalendar.mentor_nombre}
                        mentorMaterias={selectedMentorForCalendar.materiasCompletas}
                        supabase={supabase}
                        slotsAPI={slotsAPI}
                        currentUserId={currentUserId}
                    />
                )}
            </div>

            {/* Keyframe para animación */}
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}