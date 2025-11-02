import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { professorAPI } from '../api/database';
import ProfessorCard from '../components/ProfessorCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faSearch, faSpinner, faFilter, faSortAmountDown } from '@fortawesome/free-solid-svg-icons';

export default function Professors() {
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMateria, setSelectedMateria] = useState('todas');
    const [ordenarPor, setOrdenarPor] = useState('nombre'); // 'nombre' | 'rating'
    const [itemsToShow, setItemsToShow] = useState(12);
    const navigate = useNavigate();

    useEffect(() => {
        loadProfessors();
    }, []);

    const loadProfessors = async () => {
        try {
            const { data, error } = await professorAPI.getAllProfessors();

            if (error) {
                console.error('Error cargando profesores:', error);
                return;
            }

            setProfessors(data || []);
        } catch (err) {
            console.error('Error cargando profesores:', err);
        } finally {
            setLoading(false);
        }
    };

    // Normalizar texto para búsqueda sin tildes
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
        professors.forEach(prof => {
            prof.materias?.forEach(m => materiasSet.add(m));
        });
        return Array.from(materiasSet).sort();
    }, [professors]);

    // Filtrar y ordenar profesores
    const filteredAndSortedProfessors = useMemo(() => {
        let result = [...professors];

        // Filtro por búsqueda
        if (searchTerm) {
            const searchNormalized = normalizeText(searchTerm);
            result = result.filter(prof => {
                const nombreMatch = normalizeText(prof.profesor_nombre).includes(searchNormalized);
                const materiaMatch = prof.materias?.some(m =>
                    normalizeText(m).includes(searchNormalized)
                );
                return nombreMatch || materiaMatch;
            });
        }

        // Filtro por materia
        if (selectedMateria !== 'todas') {
            result = result.filter(prof =>
                prof.materias?.includes(selectedMateria)
            );
        }

        // Ordenar
        if (ordenarPor === 'nombre') {
            result.sort((a, b) => a.profesor_nombre.localeCompare(b.profesor_nombre));
        } else if (ordenarPor === 'rating') {
            result.sort((a, b) => (b.rating_promedio || 0) - (a.rating_promedio || 0));
        }

        return result;
    }, [professors, searchTerm, selectedMateria, ordenarPor]);

    // Profesores a mostrar (con límite)
    const displayedProfessors = filteredAndSortedProfessors.slice(0, itemsToShow);
    const hasMore = filteredAndSortedProfessors.length > itemsToShow;

    const handleLoadMore = () => {
        setItemsToShow(prev => prev + 12);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedMateria('todas');
        setOrdenarPor('nombre');
        setItemsToShow(12);
    };

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
                    Cargando profesores...
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
                            icon={faChalkboardTeacher}
                            style={{ fontSize: 18, color: '#fff' }}
                        />
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: 700,
                        color: '#13346b'
                    }}>
                        Profesores
                    </h1>
                </div>
                <p style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#64748b'
                }}>
                    Encontrá y calificá a tus profesores
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
                        flex: '1 1 300px',
                        minWidth: 200
                    }}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                fontSize: 13
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o materia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 36px 9px 36px',
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
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={{
                                    position: 'absolute',
                                    right: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: 4,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    transition: 'color 0.2s ease',
                                    lineHeight: 1
                                }}
                                onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* Label Filtros */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0
                    }}>
                        <FontAwesomeIcon icon={faFilter} style={{ color: '#64748b', fontSize: 12 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                            Filtros:
                        </span>
                    </div>

                    {/* Filtro por materia */}
                    <select
                        value={selectedMateria}
                        onChange={(e) => {
                            setSelectedMateria(e.target.value);
                            setItemsToShow(12);
                        }}
                        style={{
                            padding: '9px 10px',
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif',
                            color: '#0f172a',
                            cursor: 'pointer',
                            outline: 'none',
                            background: '#fff',
                            flexShrink: 0
                        }}
                    >
                        <option value="todas">Todas las materias</option>
                        {allMaterias.map(materia => (
                            <option key={materia} value={materia}>{materia}</option>
                        ))}
                    </select>

                    {/* Ordenar por */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0
                    }}>
                        <FontAwesomeIcon icon={faSortAmountDown} style={{ color: '#64748b', fontSize: 12 }} />
                        <select
                            value={ordenarPor}
                            onChange={(e) => {
                                setOrdenarPor(e.target.value);
                                setItemsToShow(12);
                            }}
                            style={{
                                padding: '9px 10px',
                                border: '1px solid #e5e7eb',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                                color: '#0f172a',
                                cursor: 'pointer',
                                outline: 'none',
                                background: '#fff'
                            }}
                        >
                            <option value="nombre">Nombre (A-Z)</option>
                            <option value="rating">Mejor calificados</option>
                        </select>
                    </div>

                    {/* Botón limpiar filtros */}
                    {(searchTerm || selectedMateria !== 'todas' || ordenarPor !== 'nombre') && (
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
                Mostrando {displayedProfessors.length} de {filteredAndSortedProfessors.length} profesores
            </p>

            {/* Empty state */}
            {filteredAndSortedProfessors.length === 0 ? (
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
                            icon={faChalkboardTeacher}
                            style={{ fontSize: 32, color: '#94a3b8' }}
                        />
                    </div>
                    <h3 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 8px 0'
                    }}>
                        No se encontraron profesores
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
                <>
                    {/* Grid de profesores */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 20,
                        marginBottom: hasMore ? 32 : 0
                    }}>
                        {displayedProfessors.map(prof => (
                            <ProfessorCard
                                key={prof.id_profesor}
                                professor={prof}
                            />
                        ))}
                    </div>

                    {/* Botón "Cargar más" */}
                    {hasMore && (
                        <div style={{ textAlign: 'center' }}>
                            <button
                                onClick={handleLoadMore}
                                style={{
                                    padding: '12px 28px',
                                    background: '#fff',
                                    border: '2px solid #2563eb',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#2563eb';
                                    e.target.style.color = '#fff';
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#fff';
                                    e.target.style.color = '#2563eb';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                Cargar más profesores
                            </button>
                            <p style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: '#94a3b8',
                                marginTop: 10
                            }}>
                                {filteredAndSortedProfessors.length - itemsToShow} profesores restantes
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}