import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBook,
    faSearch,
    faSpinner,
    faFileAlt,
    faFilter
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../supabase';
import ApunteCard from "../components/ApunteCard";

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMateria, setSelectedMateria] = useState('todas');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [signedUrls, setSignedUrls] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        loadUserAndNotes();
    }, []);

    const loadUserAndNotes = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: usuarioData } = await supabase
                    .from("usuario")
                    .select("id_usuario")
                    .eq("auth_id", user.id)
                    .maybeSingle();

                if (usuarioData) setCurrentUserId(usuarioData.id_usuario);
            }
        } catch (err) {
            console.error('Error cargando usuario:', err);
        }

        await loadNotes();
    };

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('apunte')
                .select(`
                    id_apunte,
                    id_usuario,
                    titulo,
                    descripcion,
                    creditos,
                    estrellas,
                    created_at,
                    file_path,
                    usuario:id_usuario(nombre),
                    materia:id_materia(nombre_materia),
                    thumbnail_path
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Contar likes
            const apIds = (data || []).map(n => n.id_apunte);
            let likesCountMap = {};
            if (apIds.length > 0) {
                const { data: likesData, error: likesError } = await supabase
                    .from('likes')
                    .select('id_apunte')
                    .eq('tipo', 'like')
                    .in('id_apunte', apIds);
                if (likesError) console.error('Error cargando likes:', likesError);

                likesData?.forEach(like => {
                    likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
                });
            }

            const notesWithLikes = (data || []).map(note => ({
                ...note,
                likes_count: likesCountMap[note.id_apunte] || 0,
            }));

            setNotes(notesWithLikes);

            // Signed URLs
            if (data && data.length > 0) {
                const urls = {};
                for (const note of data) {
                    if (note.file_path) {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('apuntes')
                            .createSignedUrl(note.file_path, 3600);
                        if (!signedError && signedData) urls[note.id_apunte] = signedData.signedUrl;
                    }
                }
                setSignedUrls(urls);
            }
        } catch (err) {
            console.error('Error cargando apuntes:', err);
        } finally {
            setLoading(false);
        }
    };

    // Función para normalizar texto (quitar tildes)
    const normalizeText = (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // Obtener todas las materias únicas
    const allMaterias = useMemo(() => {
        const materiasSet = new Set();
        notes.forEach(note => {
            if (note.materia?.nombre_materia) {
                materiasSet.add(note.materia.nombre_materia);
            }
        });
        return Array.from(materiasSet).sort();
    }, [notes]);

    // Filtrar apuntes
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const searchNormalized = normalizeText(searchTerm);
            const matchesSearch =
                normalizeText(note.titulo).includes(searchNormalized) ||
                normalizeText(note.materia?.nombre_materia).includes(searchNormalized) ||
                normalizeText(note.usuario?.nombre).includes(searchNormalized);

            const matchesMateria =
                selectedMateria === 'todas' ||
                note.materia?.nombre_materia === selectedMateria;

            return matchesSearch && matchesMateria;
        });
    }, [notes, searchTerm, selectedMateria]);

    // Get selected materia label
    const getSelectedLabel = () => {
        if (selectedMateria === 'todas') return 'Todas las materias';
        return selectedMateria;
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedMateria('todas');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.materia-dropdown')) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [dropdownOpen]);

    if (loading) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 16
            }}>
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    style={{ fontSize: 40, color: '#2563eb' }}
                />
                <p style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: '#64748b',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    Cargando apuntes...
                </p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: 20,
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                marginBottom: 20,
                background: '#ffffff',
                padding: '20px',
                borderRadius: 16,
                border: '1px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        background: '#2563eb',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon
                            icon={faBook}
                            style={{ fontSize: 18, color: '#fff' }}
                        />
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: 700,
                        color: '#13346b'
                    }}>
                        Apuntes
                    </h1>
                </div>
                <p style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#64748b'
                }}>
                    Encontrá apuntes compartidos por otros estudiantes
                </p>
            </header>

            {/* Buscador + Filtros en misma fila */}
            <div style={{
                background: '#fff',
                padding: 14,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                marginBottom: 16
            }}>
                <div style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {/* Buscador */}
                    <div style={{
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            style={{
                                position: 'absolute',
                                left: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                fontSize: 14,
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar apuntes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: 895,
                                padding: '10px 14px 10px 38px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                background: '#fff'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#2563eb';
                                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Espaciador para empujar filtros a la derecha */}
                    <div style={{ flex: 1 }}></div>

                    {/* Filtro de Materia */}
                    <div
                        className="materia-dropdown"
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0
                        }}
                    >
                        <FontAwesomeIcon icon={faFilter} style={{ color: '#64748b', fontSize: 12 }} />
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{
                                padding: '9px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                                color: '#0f172a',
                                cursor: 'pointer',
                                outline: 'none',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s ease',
                                minWidth: 180,
                                maxWidth: 250
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = '#cbd5e1';
                                e.target.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.background = '#fff';
                            }}
                        >
                            <span style={{
                                flex: 1,
                                textAlign: 'left',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {getSelectedLabel()}
                            </span>
                            <svg
                                style={{
                                    width: 14,
                                    height: 14,
                                    color: '#64748b',
                                    transition: 'transform 0.2s ease',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    flexShrink: 0
                                }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown */}
                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                right: 0,
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                minWidth: 220,
                                maxWidth: 300,
                                zIndex: 1000,
                                overflow: 'hidden',
                                animation: 'slideDown 0.2s ease'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMateria('todas');
                                        setDropdownOpen(false);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        border: "none",
                                        background: selectedMateria === 'todas' ? "#f0f9ff" : "#fff",
                                        color: selectedMateria === 'todas' ? "#2563eb" : "#0f172a",
                                        fontWeight: selectedMateria === 'todas' ? 600 : 500,
                                        fontSize: 14,
                                        fontFamily: 'Inter, sans-serif',
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedMateria !== 'todas') {
                                            e.target.style.background = "#f8fafc";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedMateria !== 'todas') {
                                            e.target.style.background = "#fff";
                                        }
                                    }}
                                >
                                    Todas las materias
                                    {selectedMateria === 'todas' && (
                                        <svg style={{ width: 16, height: 16, color: "#2563eb" }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>

                                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

                                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                                    {allMaterias.map(materia => (
                                        <button
                                            key={materia}
                                            type="button"
                                            onClick={() => {
                                                setSelectedMateria(materia);
                                                setDropdownOpen(false);
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                border: "none",
                                                background: selectedMateria === materia ? "#f0f9ff" : "#fff",
                                                color: selectedMateria === materia ? "#2563eb" : "#0f172a",
                                                fontWeight: selectedMateria === materia ? 600 : 500,
                                                fontSize: 14,
                                                fontFamily: 'Inter, sans-serif',
                                                textAlign: "left",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedMateria !== materia) {
                                                    e.target.style.background = "#f8fafc";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedMateria !== materia) {
                                                    e.target.style.background = "#fff";
                                                }
                                            }}
                                        >
                                            <span style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {materia}
                                            </span>
                                            {selectedMateria === materia && (
                                                <svg style={{ width: 16, height: 16, color: "#2563eb", flexShrink: 0, marginLeft: 8 }} fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botón limpiar filtros */}
                    {(searchTerm || selectedMateria !== 'todas') && (
                        <button
                            onClick={resetFilters}
                            style={{
                                padding: '9px 14px',
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif',
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = '#ef4444';
                                e.target.style.color = '#ef4444';
                                e.target.style.background = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = '#e5e7eb';
                                e.target.style.color = '#64748b';
                                e.target.style.background = '#fff';
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Contador de resultados */}
            <p style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
                marginBottom: 16
            }}>
                Mostrando {filteredNotes.length} apuntes
            </p>

            {/* Empty state */}
            {filteredNotes.length === 0 ? (
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 60,
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: '#f1f5f9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <FontAwesomeIcon
                            icon={faFileAlt}
                            style={{ fontSize: 32, color: '#94a3b8' }}
                        />
                    </div>
                    <h3 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 8px 0'
                    }}>
                        No se encontraron apuntes
                    </h3>
                    <p style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: '#64748b',
                        margin: '0 0 20px 0'
                    }}>
                        Intentá con otros filtros o términos de búsqueda
                    </p>
                    <button
                        onClick={resetFilters}
                        style={{
                            padding: '12px 24px',
                            background: '#2563eb',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 600,
                            color: '#fff',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#1d4ed8';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#2563eb';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20
                }}>
                    {filteredNotes.map(note => (
                        <ApunteCard
                            key={note.id_apunte}
                            note={{
                                ...note,
                                signedUrl: signedUrls[note.id_apunte] || null,
                                thumbnail_path: note.thumbnail_path
                            }}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}

            {/* Keyframes CSS */}
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}