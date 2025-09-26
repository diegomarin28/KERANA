import { useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import { courseAPI, mentorAPI, notesAPI } from "../api/Database";

// Función para normalizar texto (quitar acentos y convertir a minúsculas)
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

export default function SearchResults() {
    const { search } = useLocation();
    const q = (new URLSearchParams(search).get("q") || "").trim();
    const [tab, setTab] = useState("todo");
    const [minRating, setMinRating] = useState(0);
    const [loading, setLoading] = useState(false);

    // Estados para datos reales
    const [courses, setCourses] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [notes, setNotes] = useState([]);

    // Cargar datos cuando cambie la query
    useEffect(() => {
        if (q.trim()) {
            searchAll(q);
        }
    }, [q]);

    const searchAll = async (query) => {
        setLoading(true);

        try {
            // Buscar en paralelo
            const [coursesRes, mentorsRes, notesRes] = await Promise.all([
                courseAPI.searchCourses({ searchTerm: query }),
                mentorAPI.searchMentors({ especialidad: query }),
                notesAPI.searchNotes(query)
            ]);

            setCourses(coursesRes.data || []);
            setMentors(mentorsRes.data || []);
            setNotes(notesRes.data || []);
        } catch (error) {
            console.error('Error buscando:', error);
        }

        setLoading(false);
    };

    // Filtrar resultados por rating mínimo
    const filteredResults = useMemo(() => {
        const filterByRating = (items, getRating) => {
            return items.filter(item => {
                const rating = getRating(item);
                return rating >= minRating;
            });
        };

        return {
            courses: filterByRating(courses, (c) => {
                if (!c.califica || c.califica.length === 0) return 0;
                const avg = c.califica.reduce((sum, r) => sum + r.puntuacion, 0) / c.califica.length;
                return avg;
            }),
            mentors: filterByRating(mentors, (m) => {
                if (!m.evalua || m.evalua.length === 0) return 0;
                const avg = m.evalua.reduce((sum, e) => sum + e.puntuacion, 0) / m.evalua.length;
                return avg;
            }),
            notes: filterByRating(notes, () => 4.0) // Por ahora sin ratings en apuntes
        };
    }, [courses, mentors, notes, minRating]);

    const show = (k) => tab === "todo" || tab === k;
    const total = filteredResults.courses.length + filteredResults.mentors.length + filteredResults.notes.length;

    return (
        <div className="container" style={{ padding: "18px 0 36px" }}>
            {/* Buscador en resultados */}
            <div style={{ marginBottom: "24px" }}>
                <SearchBar />
            </div>

            <div className="results-head">
                <h2 style={{ margin: 0 }}>
                    Resultados {q && <>para "<em>{q}</em>"</>}
                </h2>
                <span className="badge-chip">{total} items</span>

                <div className="tabs" style={{ marginLeft: "auto" }}>
                    {["todo","cursos","mentores","apuntes"].map(t => (
                        <button
                            key={t}
                            className={`tab ${tab===t ? "active" : ""}`}
                            onClick={()=>setTab(t)}
                        >
                            {t[0].toUpperCase()+t.slice(1)}
                        </button>
                    ))}
                    <select
                        value={minRating}
                        onChange={(e)=>setMinRating(Number(e.target.value))}
                        style={{
                            height: 38,
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            padding: "0 10px"
                        }}
                    >
                        {[0,3,3.5,4,4.5].map(v => (
                            <option key={v} value={v}>Min ★ {v}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid">
                    {Array.from({length:6}).map((_,i)=>
                        <div key={i} className="skel" style={{
                            height: 120,
                            backgroundColor: '#f3f4f6',
                            borderRadius: 8,
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                    )}
                </div>
            ) : total === 0 ? (
                <div className="empty" style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#6b7280'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                    <h3>No encontramos resultados</h3>
                    <p>Proba con otra palabra clave o baja el filtro de ★ mínima.</p>
                </div>
            ) : (
                <>
                    {/* CURSOS */}
                    {show("cursos") && filteredResults.courses.length > 0 && (
                        <section className="section">
                            <div className="section-title">
                                Cursos <span className="section-count">{filteredResults.courses.length}</span>
                            </div>
                            <div className="grid">
                                {filteredResults.courses.map(c => {
                                    const avgRating = c.califica?.length > 0
                                        ? c.califica.reduce((sum, r) => sum + r.puntuacion, 0) / c.califica.length
                                        : 0;

                                    return (
                                        <ResultCard
                                            key={c.id}
                                            title={c.titulo}
                                            subtitle={`${c.usuario?.nombre} • ${c.materia?.nombre} • $${c.precio}`}
                                            rating={avgRating}
                                            pill={c.modalidad}
                                            to={`/cursos/${c.id}`}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* MENTORES */}
                    {show("mentores") && filteredResults.mentors.length > 0 && (
                        <section className="section">
                            <div className="section-title">
                                Mentores <span className="section-count">{filteredResults.mentors.length}</span>
                            </div>
                            <div className="grid">
                                {filteredResults.mentors.map(m => {
                                    const avgRating = m.evalua?.length > 0
                                        ? m.evalua.reduce((sum, e) => sum + e.puntuacion, 0) / m.evalua.length
                                        : 0;

                                    return (
                                        <ResultCard
                                            key={m.id}
                                            title={m.usuario?.nombre}
                                            subtitle={`${m.especialidad} • $${m.precio_hora}/hora`}
                                            rating={avgRating}
                                            pill="Mentor"
                                            to={`/mentores/${m.id}`}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* APUNTES */}
                    {show("apuntes") && filteredResults.notes.length > 0 && (
                        <section className="section">
                            <div className="section-title">
                                Apuntes <span className="section-count">{filteredResults.notes.length}</span>
                            </div>
                            <div className="grid">
                                {filteredResults.notes.map(a => (
                                    <ResultCard
                                        key={a.id}
                                        title={a.titulo}
                                        subtitle={`${a.profesor_nombre} • ${a.materia_nombre}`}
                                        rating={4.0} // Por ahora sin ratings reales
                                        pill="PDF"
                                        to={`/apuntes/${a.id}`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Si todas las categorías están vacías */}
                    {filteredResults.courses.length === 0 &&
                        filteredResults.mentors.length === 0 &&
                        filteredResults.notes.length === 0 && (
                            <div className="empty" style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#6b7280'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📚</div>
                                <h3>No hay resultados con ese filtro</h3>
                                <p>Intenta bajar el rating mínimo o cambiar los términos de búsqueda</p>
                            </div>
                        )}
                </>
            )}
        </div>
    );
}