import { useRef, useState, useEffect } from 'react';

export default function SubjectCarousel({ materias, materiasByRating }) {
    const scrollRef = useRef(null);
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
    }, [materias]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 220;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const renderStars = (rating) => {
        return (
            <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                    <span key={i} style={{
                        fontSize: 14,
                        color: i < Math.floor(rating) ? '#f59e0b' : i < rating ? '#f59e0b' : '#e5e7eb'
                    }}>
                        {i < Math.floor(rating) ? '★' : i < rating ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div style={{ marginBottom: 40, position: 'relative' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                Materias que dicta
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
                        marginRight: -20
                    }}
                    onScroll={checkScroll}
                >
                    {materias.map(materia => {
                        const rating = materiasByRating[materia.id];
                        const promedio = rating?.promedio || 0;
                        const cantidad = rating?.cantidad || 0;

                        return (
                            <div
                                key={materia.id}
                                style={{
                                    minWidth: 200,
                                    height: 160,
                                    padding: 16,
                                    background: '#fff',
                                    borderRadius: 12,
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    scrollSnapAlign: 'start',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
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
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        marginBottom: 8,
                                        color: '#1f2937',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {materia.nombre}
                                    </h3>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    paddingTop: 8,
                                    borderTop: '1px solid #f3f4f6'
                                }}>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        Evaluación en esta materia:
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        justifyContent: 'space-between'
                                    }}>
                                        {renderStars(promedio)}
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#1f2937'
                                        }}>
                                            {promedio > 0 ? promedio.toFixed(1) : '—'}
                                        </span>
                                    </div>
                                    {cantidad > 0 && (
                                        <div style={{
                                            fontSize: 11,
                                            color: '#9ca3af'
                                        }}>
                                            {cantidad} evaluación{cantidad !== 1 ? 'es' : ''}
                                        </div>
                                    )}
                                </div>
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
        </div>
    );
}