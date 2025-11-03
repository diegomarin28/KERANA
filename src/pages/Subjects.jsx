import { useEffect, useState, useMemo } from "react";
import { subjectsAPI } from "../api/database";
import CourseCard from "../components/CourseCard";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faSearch, faSpinner, faFilter } from '@fortawesome/free-solid-svg-icons';

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("all");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const { data, error } = await subjectsAPI.getAllSubjects();
                if (error) throw new Error(error.message || "Error cargando materias");

                if (Array.isArray(data) && data.length) {
                    if (!alive) return;
                    setSubjects(normalize(data));
                } else {
                    const { data: simple, error: e2 } = await subjectsAPI.getAllSubjectsSimple();
                    if (e2) throw new Error(e2.message || "Error cargando materias (simple)");
                    if (!alive) return;
                    setSubjects(normalizeSimple(simple));
                }
            } catch (e) {
                if (!alive) return;
                setErr(e?.message || "No se pudo cargar Asignaturas");
                setSubjects([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    // Get unique semesters for filter (ordenado numéricamente)
    const semesters = useMemo(() => {
        const uniqueSemesters = [...new Set(subjects.map(s => s.semestre).filter(Boolean))];
        return uniqueSemesters
            .map(s => String(s).trim())
            .sort((a, b) => Number(a) - Number(b));
    }, [subjects]);

    // Normalizar texto para búsqueda sin tildes
    const normalizeText = (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // Filter subjects based on search and semester
    const filteredSubjects = useMemo(() => {
        return subjects.filter(subject => {
            const searchNormalized = normalizeText(searchTerm);
            const nombreNormalized = normalizeText(subject.nombre);
            const matchesSearch = nombreNormalized.includes(searchNormalized);
            const matchesSemester = selectedSemester === "all" || subject.semestre == selectedSemester;
            return matchesSearch && matchesSemester;
        });
    }, [subjects, searchTerm, selectedSemester]);

    // Group by semester for display (ordenado numéricamente)
    const groupedSubjects = useMemo(() => {
        const groups = {};
        filteredSubjects.forEach(subject => {
            const semester = subject.semestre || "Sin semestre";
            if (!groups[semester]) {
                groups[semester] = [];
            }
            groups[semester].push(subject);
        });

        // Sort semesters numerically, with "Sin semestre" last
        return Object.entries(groups).sort(([a], [b]) => {
            if (a === "Sin semestre") return 1;
            if (b === "Sin semestre") return -1;
            return parseInt(a) - parseInt(b);
        });
    }, [filteredSubjects]);

    // Transform subjects to CourseCard format
    const transformToCourseCard = (subject) => ({
        id: subject.id,
        tipo: 'materia',
        titulo: subject.nombre,
        subtitulo: subject.semestre ? `Semestre ${subject.semestre}` : undefined,
        conteo: subject.conteo ? {
            apuntes: subject.conteo.apuntes,
            profesores: subject.conteo.profesores,
            mentores: subject.conteo.mentores
        } : undefined
    });

    // Get selected semester label
    const getSelectedLabel = () => {
        if (selectedSemester === "all") return "Todos los semestres";
        return `Semestre ${selectedSemester}`;
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setSelectedSemester('all');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.semester-dropdown')) {
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
                    Cargando materias...
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
                            icon={faBookOpen}
                            style={{ fontSize: 18, color: '#fff' }}
                        />
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: 700,
                        color: '#13346b'
                    }}>
                        Materias
                    </h1>
                </div>
                <p style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#64748b'
                }}>
                    Explorá todas las asignaturas de la universidad
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
                            placeholder="Buscar materias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: 910,
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

                    {/* Filtro de Semestre */}
                    <div
                        className="semester-dropdown"
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
                                minWidth: 160
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
                            <span style={{ flex: 1, textAlign: 'left' }}>
                                {getSelectedLabel()}
                            </span>
                            <svg
                                style={{
                                    width: 14,
                                    height: 14,
                                    color: '#64748b',
                                    transition: 'transform 0.2s ease',
                                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
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
                                left: 0,
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: 12,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                minWidth: 200,
                                zIndex: 1000,
                                overflow: 'hidden',
                                animation: 'slideDown 0.2s ease'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedSemester("all");
                                        setDropdownOpen(false);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        border: "none",
                                        background: selectedSemester === "all" ? "#f0f9ff" : "#fff",
                                        color: selectedSemester === "all" ? "#2563eb" : "#0f172a",
                                        fontWeight: selectedSemester === "all" ? 600 : 500,
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
                                        if (selectedSemester !== "all") {
                                            e.target.style.background = "#f8fafc";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedSemester !== "all") {
                                            e.target.style.background = "#fff";
                                        }
                                    }}
                                >
                                    Todos los semestres
                                    {selectedSemester === "all" && (
                                        <svg style={{ width: 16, height: 16, color: "#2563eb" }} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>

                                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

                                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                                    {semesters.map(semester => (
                                        <button
                                            key={semester}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSemester(semester);
                                                setDropdownOpen(false);
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                border: "none",
                                                background: selectedSemester == semester ? "#f0f9ff" : "#fff",
                                                color: selectedSemester == semester ? "#2563eb" : "#0f172a",
                                                fontWeight: selectedSemester == semester ? 600 : 500,
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
                                                if (selectedSemester != semester) {
                                                    e.target.style.background = "#f8fafc";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedSemester != semester) {
                                                    e.target.style.background = "#fff";
                                                }
                                            }}
                                        >
                                            Semestre {semester}
                                            {selectedSemester == semester && (
                                                <svg style={{ width: 16, height: 16, color: "#2563eb" }} fill="currentColor" viewBox="0 0 20 20">
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
                    {(searchTerm || selectedSemester !== 'all') && (
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
                Mostrando {filteredSubjects.length} materias
            </p>

            {/* Empty state */}
            {filteredSubjects.length === 0 ? (
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
                            icon={faBookOpen}
                            style={{ fontSize: 32, color: '#94a3b8' }}
                        />
                    </div>
                    <h3 style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 8px 0'
                    }}>
                        No se encontraron materias
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
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {groupedSubjects.map(([semester, semesterSubjects]) => (
                        <div key={semester}>
                            <h2 style={{
                                margin: "0 0 16px 0",
                                fontSize: 20,
                                fontWeight: 600,
                                color: "#0f172a",
                                paddingBottom: 8,
                                borderBottom: "2px solid #e5e7eb"
                            }}>
                                {semester === "Sin semestre" ? "Otras Materias" : `Semestre ${semester}`}
                                <span style={{
                                    marginLeft: 8,
                                    fontSize: 14,
                                    color: "#64748b",
                                    fontWeight: 500
                                }}>
                                    ({semesterSubjects.length})
                                </span>
                            </h2>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: 16
                            }}>
                                {semesterSubjects.map(s => (
                                    <CourseCard
                                        key={s.id}
                                        course={transformToCourseCard(s)}
                                        onFav={null}
                                    />
                                ))}
                            </div>
                        </div>
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

// Normaliza la vista "materias_con_contenido"
function normalize(rows) {
    return rows.map(r => ({
        id: r.id_materia ?? r.id ?? r.materia_id,
        nombre: r.nombre_materia ?? r.nombre ?? r.materia_nombre,
        semestre: r.semestre ?? undefined,
        conteo: {
            apuntes: r.total_apuntes ?? r.apuntes ?? 0,
            profesores: r.total_profesores ?? r.profesores ?? 0,
            mentores: r.total_mentores ?? r.mentores ?? 0,
        }
    }));
}

// Normaliza la tabla "materia"
function normalizeSimple(rows) {
    return rows.map(r => ({
        id: r.id_materia ?? r.id,
        nombre: r.nombre_materia ?? r.nombre,
        semestre: r.semestre ?? undefined,
    }));
}