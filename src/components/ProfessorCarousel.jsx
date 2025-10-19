import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StarDisplay from './StarDisplay';

// Tags disponibles
const AVAILABLE_TAGS = [
    { id: 'muy-claro', label: '✨ Muy claro' },
    { id: 'querido', label: '🎓 Querido por los estudiantes' },
    { id: 'apasionado', label: '🔥 Apasionado' },
    { id: 'disponible', label: '💬 Siempre disponible' },
    { id: 'ordenado', label: '📋 Muy ordenado' },
    { id: 'dinamico', label: '⚡ Clases dinámicas' },
    { id: 'cercano', label: '🤝 Cercano a los alumnos' },
    { id: 'califica-duro', label: '📊 Califica duro' },
    { id: 'mucha-tarea', label: '📖 Mucha tarea' },
    { id: 'participacion', label: '🎤 La participación importa' },
    { id: 'confuso', label: '🤔 Confuso' },
    { id: 'lejano', label: '🚪 Lejano a los alumnos' },
    { id: 'examenes-dificiles', label: '📝 Exámenes difíciles' }
];

export default function ProfessorCarousel({ profesores, profesoresByRating }) {
    const scrollRef = useRef(null);
    const navigate = useNavigate();
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const element = scrollRef.current;
        element?.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        return () => {
            element?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [profesores]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 280;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Ordenar profesores alfabéticamente
    const sortedProfesores = [...profesores].sort((a, b) =>
        a.profesor_nombre.localeCompare(b.profesor_nombre)
    );

    return (
        <div style={{ marginBottom: 40, position: 'relative' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                Profesores que dictan esta materia
            </h2>

            <div style={{ position: 'relative' }}>
                {/* Flecha izquierda */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        style={{
                            position: 'absolute',
                            left: -50,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#fff',
                            border: '2px solid #d1d5db',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            zIndex: 10,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#2563eb';
                            e.target.style.color = '#fff';
                            e.target.style.borderColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.color = '#000';
                            e.target.style.borderColor = '#d1d5db';
                        }}
                    >
                        ‹
                    </button>
                )}

                {/* Contenedor de scroll */}
                <div
                    ref={scrollRef}
                    style={{
                        display: 'flex',
                        gap: 16,
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        scrollSnapType: 'x mandatory',
                        paddingRight: 20,
                        paddingLeft: 0,
                        marginRight: -20,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                    onScroll={checkScroll}
                >
                    {sortedProfesores.map(profesor => {
                        const rating = profesoresByRating[profesor.id_profesor] || {};
                        const promedio = rating.promedio || 0;
                        const cantidad = rating.cantidad || 0;
                        const topTags = rating.topTags || [];

                        return (
                            <div
                                key={profesor.id_profesor}
                                onClick={() => navigate(`/profesores/${profesor.id_profesor}`)}
                                style={{
                                    minWidth: 260,
                                    padding: 20,
                                    background: '#fff',
                                    borderRadius: 12,
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    scrollSnapAlign: 'start',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Foto/Iniciales */}
                                <div style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    background: profesor.foto ? 'transparent' : '#dbeafe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    margin: '0 auto'
                                }}>
                                    {profesor.foto ? (
                                        <img
                                            src={profesor.foto}
                                            alt={profesor.profesor_nombre}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            fontSize: 24,
                                            fontWeight: 700,
                                            color: '#1e40af'
                                        }}>
                                            {profesor.profesor_nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Nombre */}
                                <h3 style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    color: '#1f2937'
                                }}>
                                    {profesor.profesor_nombre}
                                </h3>

                                {/* Rating */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 4,
                                    paddingTop: 8,
                                    borderTop: '1px solid #f3f4f6'
                                }}>
                                    <StarDisplay rating={promedio} size={20} />
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <span style={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: '#1f2937'
                                        }}>
                                            {promedio > 0 ? promedio.toFixed(1) : '—'}
                                        </span>
                                        {cantidad > 0 && (
                                            <span style={{
                                                fontSize: 12,
                                                color: '#6b7280'
                                            }}>
                                                ({cantidad})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Top 3 Tags */}
                                {topTags.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        paddingTop: 8,
                                        borderTop: '1px solid #f3f4f6'
                                    }}>
                                        {topTags.map((tagId) => {
                                            const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                                            if (!tag) return null;
                                            return (
                                                <div
                                                    key={tagId}
                                                    style={{
                                                        padding: '4px 8px',
                                                        background: '#f3f4f6',
                                                        borderRadius: 8,
                                                        fontSize: 11,
                                                        color: '#374151',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {tag.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Flecha derecha */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        style={{
                            position: 'absolute',
                            right: -50,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#fff',
                            border: '2px solid #d1d5db',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            zIndex: 10,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#2563eb';
                            e.target.style.color = '#fff';
                            e.target.style.borderColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.color = '#000';
                            e.target.style.borderColor = '#d1d5db';
                        }}
                    >
                        ›
                    </button>
                )}
            </div>

            <style>
                {`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}
            </style>
        </div>
    );
}