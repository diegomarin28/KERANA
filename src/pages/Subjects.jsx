// src/pages/Subjects.jsx
import { useEffect, useState, useMemo } from "react";
import { subjectsAPI } from "../api/Database";

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("all");

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

    // Get unique semesters for filter
    const semesters = useMemo(() => {
        const uniqueSemesters = [...new Set(subjects.map(s => s.semestre).filter(Boolean))].sort();
        return uniqueSemesters;
    }, [subjects]);

    // Filter subjects based on search and semester
    const filteredSubjects = useMemo(() => {
        return subjects.filter(subject => {
            const matchesSearch = subject.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSemester = selectedSemester === "all" || subject.semestre == selectedSemester;
            return matchesSearch && matchesSemester;
        });
    }, [subjects, searchTerm, selectedSemester]);

    // Group by semester for display
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

    if (loading) {
        return (
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
        );
    }

    return (
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
                gap: 60,
                marginBottom: 24
            }}>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Buscar materias..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
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

                <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    style={{
                        padding: "7px 14px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 14,
                        background: "#fff",
                        minWidth: 140,
                        outline: "none",
                        cursor: "pointer"
                    }}
                >
                    <option value="all">Todos los semestres</option>
                    {semesters.map(semester => (
                        <option key={semester} value={semester}>
                            Semestre {semester}
                        </option>
                    ))}
                </select>
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
                                color: "#374151",
                                paddingBottom: 8,
                                borderBottom: "2px solid #f3f4f6"
                            }}>
                                {semester === "Sin semestre" ? "Otras Materias" : `Semestre ${semester}`}
                                <span style={{
                                    marginLeft: 8,
                                    fontSize: 14,
                                    color: "#6b7280",
                                    fontWeight: "normal"
                                }}>
                                    ({semesterSubjects.length})
                                </span>
                            </h2>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: 16
                            }}>
                                {semesterSubjects.map(s => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            window.location.assign(`/cursos/${s.id}`);
                                        }}
                                        style={{
                                            all: "unset",
                                            display: "block",
                                            background: "#ffffff",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 12,
                                            padding: 16,
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            textAlign: "left"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,.08)";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.borderColor = "#2563eb";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = "none";
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.borderColor = "#e5e7eb";
                                        }}
                                    >
                                        <div style={{
                                            fontWeight: 600,
                                            fontSize: 16,
                                            marginBottom: 8,
                                            color: "#111827"
                                        }}>
                                            {s.nombre}
                                        </div>

                                        {typeof s.semestre !== "undefined" && (
                                            <div style={{
                                                color: "#6b7280",
                                                fontSize: 14,
                                                marginBottom: 12
                                            }}>
                                                Semestre: {s.semestre}
                                            </div>
                                        )}

                                        {"conteo" in s && (
                                            <div style={{
                                                display: "flex",
                                                gap: 12,
                                                fontSize: 12,
                                                color: "#374151"
                                            }}>
                                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <span style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: "#2563eb"
                                                    }} />
                                                    Apuntes: <b>{s.conteo.apuntes}</b>
                                                </span>
                                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <span style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: "#10b981"
                                                    }} />
                                                    Profes: <b>{s.conteo.profesores}</b>
                                                </span>
                                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <span style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: "50%",
                                                        background: "#f59e0b"
                                                    }} />
                                                    Mentores: <b>{s.conteo.mentores}</b>
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
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