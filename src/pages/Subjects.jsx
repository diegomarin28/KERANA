// src/pages/Subjects.jsx
import { useEffect, useState, useMemo } from "react";
import { subjectsAPI } from "../api/database";
import CourseCard from "../components/CourseCard";

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
        return uniqueSemesters.sort((a, b) => parseInt(a) - parseInt(b));
    }, [subjects]);

    // Filter subjects based on search and semester
    const filteredSubjects = useMemo(() => {
        return subjects.filter(subject => {
            const matchesSearch = subject.nombre.toLowerCase().includes(searchTerm.toLowerCase());
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
            <>
                <style>
                    {`
                        @keyframes spin {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
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
                    `}
                </style>
                <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12
                    }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            border: "3px solid #f3f4f6",
                            borderTop: "3px solid #2563eb",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                        }} />
                        <div>Cargando asignaturas…</div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
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
                `}
            </style>
            <div style={{ width: "min(1080px, 92vw)", margin: "0 auto", padding: "24px 0" }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ margin: "0 0 8px 0" }}>Asignaturas</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                        {subjects.length} materia{subjects.length !== 1 ? 's' : ''} disponible{subjects.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {err && (
                    <div style={{
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        padding: "12px 16px",
                        marginBottom: 24
                    }}>
                        {err} — mostrando vista simple si hay datos.
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 16,
                    marginBottom: 24
                }}>
                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Buscar materias..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "94%",
                                padding: "12px 16px 12px 40px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                fontSize: 14,
                                outline: "none",
                                transition: "all 0.2s ease"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#2563eb";
                                e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e5e7eb";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                        <svg
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 18,
                                height: 18,
                                color: "#9ca3af"
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Custom Dropdown */}
                    <div className="semester-dropdown" style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{
                                padding: "12px 40px 12px 16px",
                                border: "2px solid #e5e7eb",
                                borderRadius: 12,
                                fontSize: 14,
                                fontWeight: 500,
                                background: "#fff",
                                minWidth: 180,
                                outline: "none",
                                cursor: "pointer",
                                boxShadow: dropdownOpen ? "0 0 0 3px rgba(37, 99, 235, 0.1)" : "0 2px 8px rgba(0, 0, 0, 0.06)",
                                transition: "all 0.2s ease",
                                color: "#0f172a",
                                textAlign: "left",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderColor: dropdownOpen ? "#2563eb" : "#e5e7eb"
                            }}
                            onMouseEnter={(e) => {
                                if (!dropdownOpen) {
                                    e.target.style.borderColor = "#2563eb";
                                    e.target.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.15)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!dropdownOpen) {
                                    e.target.style.borderColor = "#e5e7eb";
                                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
                                }
                            }}
                        >
                            {getSelectedLabel()}
                            <svg
                                style={{
                                    width: 12,
                                    height: 12,
                                    color: "#64748b",
                                    transition: "transform 0.2s ease",
                                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                                }}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    left: 0,
                                    right: 0,
                                    background: "#fff",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: 12,
                                    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
                                    zIndex: 1000,
                                    overflow: "hidden",
                                    animation: "slideDown 0.2s ease"
                                }}
                            >
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
                </div>

                {filteredSubjects.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "48px 24px",
                        color: "#6b7280"
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>
                            No se encontraron materias
                        </h3>
                        <p>Probá con otros términos de búsqueda o otro semestre</p>
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
            </div>
        </>
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