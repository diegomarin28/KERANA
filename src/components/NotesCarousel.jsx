import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import ApunteCard from './ApunteCard';

export default function NotesCarousel({ notes, currentUserId }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const isMobile = window.innerWidth <= 375;

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && currentIndex < notes.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
        if (isRightSwipe && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const goToPrevious = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex(prev => Math.min(notes.length - 1, prev + 1));
    };

    if (!notes || notes.length === 0) return null;

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            padding: '0',
        }}>
            {/* Contenedor del carousel */}
            <div
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                    display: 'flex',
                    transform: `translateX(-${currentIndex * 100}%)`,
                    transition: 'transform 0.3s ease-in-out',
                    width: '100%',
                    touchAction: 'pan-y',
                }}
            >
                {notes.map((note, index) => (
                    <div
                        key={`carousel-note-${note.id_apunte || index}`}
                        style={{
                            minWidth: '100%',
                            width: '100%',
                            padding: '0 16px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{
                            width: '100%',
                            maxWidth: '320px',
                        }}>
                            <ApunteCard
                                note={{
                                    id_apunte: note.id_apunte,
                                    titulo: note.titulo,
                                    descripcion: note.descripcion || '',
                                    creditos: note.creditos,
                                    estrellas: note.rating_promedio || 0,
                                    usuario: { nombre: note.usuario_nombre || 'Anónimo' },
                                    materia: { nombre_materia: note.nombre_materia || 'Sin materia' },
                                    signedUrl: note.signedUrl,
                                    thumbnail_path: note.thumbnail_path,
                                    likes_count: note.likes_count || 0,
                                    id_usuario: note.id_usuario
                                }}
                                currentUserId={currentUserId}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Botones de navegación - solo en desktop */}
            {!isMobile && notes.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        disabled={currentIndex === 0}
                        aria-label="Anterior"
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 'none',
                            background: currentIndex === 0 ? '#e5e7eb' : '#fff',
                            color: currentIndex === 0 ? '#9ca3af' : '#0f172a',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <FontAwesomeIcon icon={faChevronLeft} />
                    </button>

                    <button
                        onClick={goToNext}
                        disabled={currentIndex === notes.length - 1}
                        aria-label="Siguiente"
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            border: 'none',
                            background: currentIndex === notes.length - 1 ? '#e5e7eb' : '#fff',
                            color: currentIndex === notes.length - 1 ? '#9ca3af' : '#0f172a',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            cursor: currentIndex === notes.length - 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                </>
            )}

            {/* Indicadores de posición */}
            {notes.length > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 20,
                    padding: '0 16px',
                }}>
                    {notes.map((_, index) => (
                        <button
                            key={`indicator-${index}`}
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`Ir al apunte ${index + 1}`}
                            style={{
                                width: currentIndex === index ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                border: 'none',
                                background: currentIndex === index ? '#2563eb' : '#cbd5e1',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                padding: 0,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Contador de posición en móvil */}
            {isMobile && notes.length > 1 && (
                <div style={{
                    textAlign: 'center',
                    marginTop: 12,
                    fontSize: 13,
                    color: '#64748b',
                    fontWeight: 500,
                }}>
                    {currentIndex + 1} / {notes.length}
                </div>
            )}
        </div>
    );
}