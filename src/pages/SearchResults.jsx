import { useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import { searchAPI } from "../api/Database";
import SearchHeader from "../components/SearchHeader";
import { Chip } from "../components/ui/Chip";
import { Button } from "../components/ui/Button";

export default function SearchResults() {
    const { search } = useLocation();
    const q = (new URLSearchParams(search).get("q") || "").trim();

    const [tab, setTab] = useState("todo");
    const [minRating, setMinRating] = useState(0);
    const [loading, setLoading] = useState(false);

    // Estados por categoría que sí existen en Database.js → searchAPI.searchAll
    const [subjects, setSubjects] = useState([]); // materias
    const [professors, setProfessors] = useState([]); // profesores
    const [mentors, setMentors] = useState([]); // mentores
    const [notes, setNotes] = useState([]); // apuntes

    useEffect(() => {
        if (q) fetchAll(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const fetchAll = async (query) => {
        setLoading(true);
        try {
            const { data, error } = await searchAPI.searchAll(query);
            if (error) throw new Error(error);

            setSubjects(data?.materias ?? []);
            setNotes(data?.apuntes ?? []);
            setProfessors(data?.profesores ?? []);
            setMentors(data?.mentores ?? []);
        } catch (e) {
            console.error("Error buscando:", e);
            setSubjects([]);
            setNotes([]);
            setProfessors([]);
            setMentors([]);
        } finally {
            setLoading(false);
        }
    };

    // Filtro por rating (★) donde tiene sentido
    const filtered = useMemo(() => {
        const byRating = (items, get) => items.filter((it) => (get(it) ?? 0) >= minRating);

        return {
            subjects, // Materias no tienen rating
            professors: byRating(professors, (p) => p.estrellas ?? 0),
            mentors: byRating(mentors, (m) => m.estrellas ?? 0),
            notes: byRating(notes, () => 4.0), // Por ahora fijo como tenías
        };
    }, [subjects, professors, mentors, notes, minRating]);

    const show = (k) => tab === "todo" || tab === k;
    const total =
        filtered.subjects.length +
        filtered.professors.length +
        filtered.mentors.length +
        filtered.notes.length;

    return (
        <div className="container" style={{ padding: "18px 0 36px" }}>
            <div style={{ marginBottom: 24 }}>
                <SearchBar />
                <SearchHeader title={q ? `Resultados para “${q}”` : "Explorar"} subtitle="Búsqueda" />
            </div>

            <div className="results-head" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0 }}>
                    Resultados {q && <>para "<em>{q}</em>"</>}
                </h2>
                <Chip tone="blue">{total} items</Chip>

                <div className="tabs" style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    {["todo", "materias", "profesores", "mentores", "apuntes"].map((t) => (
                        <Button
                            key={t}
                            variant={tab === t ? "secondary" : "ghost"}
                            onClick={() => setTab(t)}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </Button>
                    ))}
                    <select
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        style={{
                            height: 38,
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            padding: "0 10px",
                            marginLeft: 8,
                            background: "var(--surface)",
                            color: "var(--text)",
                        }}
                        title="Filtrar por ★ mínima"
                    >
                        {[0, 3, 3.5, 4, 4.5].map((v) => (
                            <option key={v} value={v}>
                                Min ★ {v}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="skel"
                            style={{
                                height: 120,
                                backgroundColor: "#f3f4f6",
                                borderRadius: 8,
                                animation: "pulse 1.5s ease-in-out infinite",
                            }}
                        />
                    ))}
                </div>
            ) : total === 0 ? (
                <div
                    className="empty"
                    style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: 20 }}>🔍</div>
                    <h3>No encontramos resultados</h3>
                    <p>Probá con otra palabra clave o bajá el filtro de ★ mínima.</p>
                </div>
            ) : (
                <>
                    {/* MATERIAS */}
                    {show("materias") && filtered.subjects.length > 0 && (
                        <section className="section">
                            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div>Materias</div>
                                <Chip tone="blue">{filtered.subjects.length}</Chip>
                            </div>
                            <div className="grid">
                                {filtered.subjects.map((m) => (
                                    <ResultCard
                                        key={m.id_materia ?? m.id}
                                        title={m.nombre_materia}
                                        subtitle={`Semestre ${m.semestre ?? "-"}`}
                                        rating={0}
                                        pill="Materia"
                                        to={`/materias/${m.id_materia ?? m.id}`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* PROFESORES */}
                    {show("profesores") && filtered.professors.length > 0 && (
                        <section className="section">
                            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div>Profesores</div>
                                <Chip tone="amber">{filtered.professors.length}</Chip>
                            </div>
                            <div className="grid">
                                {filtered.professors.map((p) => (
                                    <ResultCard
                                        key={p.id_profesor ?? p.id}
                                        title={`Prof. ${p.usuario?.nombre ?? "—"}`}
                                        subtitle={p.materia?.nombre_materia ?? ""}
                                        rating={p.estrellas ?? 0}
                                        pill="Profesor"
                                        to={`/profesores/${p.id_profesor ?? p.id}`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* MENTORES */}
                    {show("mentores") && filtered.mentors.length > 0 && (
                        <section className="section">
                            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div>Mentores</div>
                                <Chip tone="primary">{filtered.mentors.length}</Chip>
                            </div>
                            <div className="grid">
                                {filtered.mentors.map((m) => (
                                    <ResultCard
                                        key={m.id_mentor ?? m.id}
                                        title={`Mentor ${m.usuario?.nombre ?? "—"}`}
                                        subtitle={m.especialidad || "Mentor académico"}
                                        rating={m.estrellas ?? 0}
                                        pill="Mentor"
                                        to={`/mentores/${m.id_mentor ?? m.id}`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* APUNTES */}
                    {show("apuntes") && filtered.notes.length > 0 && (
                        <section className="section">
                            <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div>Apuntes</div>
                                <Chip tone="gray">{filtered.notes.length}</Chip>
                            </div>
                            <div className="grid">
                                {filtered.notes.map((a) => (
                                    <ResultCard
                                        key={a.id_apunte ?? a.id}
                                        title={a.titulo ?? "Apunte"}
                                        subtitle={a.materia_nombre ?? a.profesor_nombre ?? ""}
                                        rating={4.0} // placeholder como tenías
                                        pill="PDF"
                                        to={`/apuntes/${a.id_apunte ?? a.id}`}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
