import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import PDFThumbnail from './PDFThumbnail';
import StarDisplay from './StarDisplay';

export default function NotesModal({ materiaId, materiaNombre, onClose }) {
    const navigate = useNavigate();
    const [apuntes, setApuntes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'detail'
    const [selectedNote, setSelectedNote] = useState(null);
    const [sortBy, setSortBy] = useState('fecha'); // 'fecha', 'nombre', 'autor', 'rating', 'precio'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' o 'desc'

    useEffect(() => {
        loadApuntes();
    }, [materiaId]);

    const loadApuntes = async () => {
        try {
            setLoading(true);

            const { data: apuntesData, error: apuntesError } = await supabase
                .from('apunte')
                .select(`
                    id_apunte,
                    titulo,
                    descripcion,
                    creditos,
                    file_path,
                    created_at,
                    id_usuario,
                    usuario:id_usuario(nombre, username)
                `)
                .eq('id_materia', materiaId)
                .order('created_at', { ascending: false });

            if (apuntesError) throw apuntesError;

            if (apuntesData) {
                // Obtener ratings y likes para cada apunte
                const apuntesConRatings = await Promise.all(
                    apuntesData.map(async (apunte) => {
                        // Signed URL para thumbnail
                        let signedUrl = null;
                        if (apunte.file_path) {
                            const { data: signedData, error: signedError } = await supabase.storage
                                .from('apuntes')
                                .createSignedUrl(apunte.file_path, 3600);
                            if (!signedError && signedData) {
                                signedUrl = signedData.signedUrl;
                            }
                        }

                        // Contar likes
                        const { data: likesData } = await supabase
                            .from('likes')
                            .select('tipo')
                            .eq('id_apunte', apunte.id_apunte)
                            .eq('tipo', 'like');

                        const likesCount = likesData?.length || 0;

                        // Contar ratings/reviews
                        const { data: ratingsData } = await supabase
                            .from('rating')
                            .select('estrellas')
                            .eq('tipo', 'apunte')
                            .eq('ref_id', apunte.id_apunte);

                        const reviewsCount = ratingsData?.length || 0;
                        const avgRating = reviewsCount > 0
                            ? ratingsData.reduce((sum, r) => sum + r.estrellas, 0) / reviewsCount
                            : 0;

                        return {
                            ...apunte,
                            signedUrl,
                            likesCount,
                            reviewsCount,
                            avgRating
                        };
                    })
                );

                setApuntes(apuntesConRatings);
            }
        } catch (err) {
            console.error('Error cargando apuntes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const sortedApuntes = [...apuntes].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'nombre':
                comparison = a.titulo.localeCompare(b.titulo);
                break;
            case 'autor':
                comparison = (a.usuario?.nombre || '').localeCompare(b.usuario?.nombre || '');
                break;
            case 'fecha':
                comparison = new Date(a.created_at) - new Date(b.created_at);
                break;
            case 'rating':
                comparison = a.avgRating - b.avgRating;
                break;
            case 'precio':
                comparison = a.creditos - b.creditos;
                break;
            default:
                comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const handleNoteClick = (apunte) => {
        if (viewMode === 'grid') {
            navigate(`/apuntes/${apunte.id_apunte}`);
        } else {
            setSelectedNote(apunte);
        }
    };

    const handleUploadClick = () => {
        navigate('/upload');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}
             onClick={onClose}
        >
            <div
                style={{
                    width: '90vw',
                    height: '90vh',
                    background: '#fff',
                    borderRadius: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del modal */}
                <div style={{
                    padding: 24,
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                            Apuntes de {materiaNombre}
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
                            {apuntes.length} apunte{apuntes.length !== 1 ? 's' : ''} disponible{apuntes.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {/* Botones de vista */}
                        <div style={{
                            display: 'flex',
                            gap: 4,
                            background: '#f3f4f6',
                            padding: 4,
                            borderRadius: 8
                        }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '8px 16px',
                                    background: viewMode === 'grid' ? '#fff' : 'transparent',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: viewMode === 'grid' ? '#1f2937' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🔲 Cuadrícula
                            </button>
                            <button
                                onClick={() => setViewMode('detail')}
                                style={{
                                    padding: '8px 16px',
                                    background: viewMode === 'detail' ? '#fff' : 'transparent',
                                    border: 'none',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: viewMode === 'detail' ? '#1f2937' : '#6b7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                📋 Detalle
                            </button>
                        </div>

                        {/* Botón cerrar */}
                        <button
                            onClick={onClose}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: '#f3f4f6',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20,
                                color: '#374151',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#e5e7eb';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Contenido del modal */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 24
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                border: '3px solid #f3f4f6',
                                borderTop: '3px solid #2563eb',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }} />
                            <p style={{ marginTop: 16, color: '#6b7280' }}>Cargando apuntes...</p>
                        </div>
                    ) : apuntes.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 60
                        }}>
                            <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
                            <h3 style={{ margin: '0 0 12px 0', color: '#1f2937' }}>
                                Aún no hay apuntes
                            </h3>
                            <p style={{ margin: 0, color: '#6b7280' }}>
                                Sé el primero en compartir apuntes de esta materia
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 16
                        }}>
                            {sortedApuntes.map((apunte) => (
                                <div
                                    key={apunte.id_apunte}
                                    onClick={() => handleNoteClick(apunte)}
                                    style={{
                                        background: '#fff',
                                        borderRadius: 12,
                                        border: '1px solid #e5e7eb',
                                        padding: 12,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '3/4',
                                        background: '#f3f4f6',
                                        borderRadius: 8,
                                        overflow: 'hidden'
                                    }}>
                                        {apunte.signedUrl ? (
                                            <PDFThumbnail
                                                url={apunte.signedUrl}
                                                width={200}
                                                height={267}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 48
                                            }}>
                                                📄
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <h4 style={{
                                        margin: 0,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {apunte.titulo}
                                    </h4>

                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        Por {apunte.usuario?.nombre || 'Anónimo'}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingTop: 8,
                                        borderTop: '1px solid #f3f4f6'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <StarDisplay rating={apunte.avgRating} size={14} />
                                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                ({apunte.reviewsCount})
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color: '#2563eb'
                                        }}>
                                            {apunte.creditos} 💰
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                        {new Date(apunte.created_at).toLocaleDateString('es-UY')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Vista de detalle */
                        <div>
                            {/* Header de ordenamiento */}
                            <div style={{
                                display: 'flex',
                                gap: 12,
                                marginBottom: 16,
                                padding: '12px 16px',
                                background: '#f9fafb',
                                borderRadius: 8,
                                alignItems: 'center',
                                overflowX: 'auto'
                            }}>
                                <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, minWidth: 80 }}>
                                    Ordenar por:
                                </span>
                                {[
                                    { key: 'nombre', label: 'Nombre' },
                                    { key: 'autor', label: 'Autor' },
                                    { key: 'fecha', label: 'Fecha' },
                                    { key: 'rating', label: 'Rating' },
                                    { key: 'precio', label: 'Precio' }
                                ].map((option) => (
                                    <button
                                        key={option.key}
                                        onClick={() => handleSort(option.key)}
                                        style={{
                                            padding: '6px 12px',
                                            background: sortBy === option.key ? '#2563eb' : '#fff',
                                            color: sortBy === option.key ? '#fff' : '#374151',
                                            border: `1px solid ${sortBy === option.key ? '#2563eb' : '#d1d5db'}`,
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {option.label} {sortBy === option.key && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </button>
                                ))}
                            </div>

                            {/* Tabla de apuntes */}
                            <div style={{
                                overflowX: 'auto',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12
                            }}>
                                <div style={{ minWidth: 800 }}>
                                    {/* Header de la tabla */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.8fr',
                                        gap: 16,
                                        padding: '12px 16px',
                                        background: '#f9fafb',
                                        borderBottom: '1px solid #e5e7eb',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: '#6b7280'
                                    }}>
                                        <div>Nombre</div>
                                        <div>Autor</div>
                                        <div>Fecha</div>
                                        <div>Rating</div>
                                        <div>Reseñas</div>
                                        <div>Precio</div>
                                    </div>

                                    {/* Filas de apuntes */}
                                    {sortedApuntes.map((apunte) => (
                                        <div
                                            key={apunte.id_apunte}
                                            onClick={() => handleNoteClick(apunte)}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 0.8fr',
                                                gap: 16,
                                                padding: '16px',
                                                borderBottom: '1px solid #f3f4f6',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#f9fafb';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = selectedNote?.id_apunte === apunte.id_apunte ? '#eff6ff' : '#fff';
                                            }}
                                        >
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: '#1f2937',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {apunte.titulo}
                                            </div>
                                            <div style={{ fontSize: 14, color: '#6b7280' }}>
                                                {apunte.usuario?.nombre || 'Anónimo'}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#6b7280' }}>
                                                {new Date(apunte.created_at).toLocaleDateString('es-UY')}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <StarDisplay rating={apunte.avgRating} size={14} />
                                                <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>
                                                    {apunte.avgRating.toFixed(1)}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 13, color: '#6b7280' }}>
                                                {apunte.reviewsCount}
                                            </div>
                                            <div style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: '#2563eb'
                                            }}>
                                                {apunte.creditos} 💰
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Panel de vista previa */}
                            {selectedNote && (
                                <div style={{
                                    marginTop: 24,
                                    padding: 24,
                                    background: '#f9fafb',
                                    borderRadius: 12,
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: 16
                                    }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>
                                                {selectedNote.titulo}
                                            </h3>
                                            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                                                Por {selectedNote.usuario?.nombre || 'Anónimo'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedNote(null)}
                                            style={{
                                                padding: '6px 12px',
                                                background: '#fff',
                                                border: '1px solid #d1d5db',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                fontSize: 13
                                            }}
                                        >
                                            Cerrar vista previa
                                        </button>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: 24,
                                        alignItems: 'flex-start'
                                    }}>
                                        {/* Thumbnail */}
                                        <div style={{
                                            width: 200,
                                            flexShrink: 0
                                        }}>
                                            {selectedNote.signedUrl ? (
                                                <PDFThumbnail
                                                    url={selectedNote.signedUrl}
                                                    width={200}
                                                    height={267}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: 200,
                                                    height: 267,
                                                    background: '#e5e7eb',
                                                    borderRadius: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 64
                                                }}>
                                                    📄
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            {selectedNote.descripcion && (
                                                <div style={{ marginBottom: 16 }}>
                                                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>
                                                        Descripción
                                                    </h4>
                                                    <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                                                        {selectedNote.descripcion}
                                                    </p>
                                                </div>
                                            )}

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                gap: 16,
                                                marginBottom: 16
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                                        Rating promedio
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <StarDisplay rating={selectedNote.avgRating} size={16} />
                                                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                                                            {selectedNote.avgRating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                                        Reseñas
                                                    </div>
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                        {selectedNote.reviewsCount} reseña{selectedNote.reviewsCount !== 1 ? 's' : ''}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                                        Precio
                                                    </div>
                                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>
                                                        {selectedNote.creditos} 💰
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                                                        Publicado
                                                    </div>
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                                                        {new Date(selectedNote.created_at).toLocaleDateString('es-UY')}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/apuntes/${selectedNote.id_apunte}`)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 24px',
                                                    background: '#2563eb',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontSize: 14,
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#1e40af';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#2563eb';
                                                }}
                                            >
                                                Ver apunte completo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer fijo - Botón de subir apunte */}
                <div style={{
                    padding: 20,
                    borderTop: '1px solid #e5e7eb',
                    background: '#f9fafb'
                }}>
                    <button
                        onClick={handleUploadClick}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        📤 Subir tu apunte
                    </button>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}