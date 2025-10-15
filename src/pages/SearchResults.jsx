import { useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import SearchBar from "../components/SearchBar";
import { searchAPI } from "../api/database";
import SubjectCard from "../components/SubjectCard";
import ProfessorCard from "../components/ProfessorCard";
import NoteCard from "../components/NoteCard";
import { UserCard } from "../components/UserCard";
import { MentorCard } from "../components/MentorCard";
import { supabase } from "../supabase";

export default function SearchResults() {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const q = (params.get("q") || "").trim();

    // Normalización singular → plural
    // SearchBar manda singular (materia, profesor, apunte, usuario, mentor)
    // Nosotros normalizamos a plural internamente
    const _raw = (params.get("type") || "todos").toLowerCase();
    const _map = {
        // Plural (default)
        todos: "todos",
        materias: "materias",
        profesores: "profesores",
        apuntes: "apuntes",
        usuarios: "usuarios",
        mentores: "mentores",
        // Singular → plural
        materia: "materias",
        profesor: "profesores",
        apunte: "apuntes",
        usuario: "usuarios",
        mentor: "mentores",
    };
    const type = _map[_raw] || "todos";

    // Estado de pestaña (ya con 'type' normalizado a plural)
    const [tab, setTab] = useState(type);
    const [loading, setLoading] = useState(false);

    const [subjects, setSubjects] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [notes, setNotes] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (q) fetchAll(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);



    const fetchAll = async (query) => {
        setLoading(true);
        console.log("🔍 Buscando:", query);
        try {
            const { data, error } = await searchAPI.searchAll(query);
            console.log("📦 Resultado searchAPI:", { data, error });

            if (error) throw new Error(error.message || JSON.stringify(error));

            console.log("📊 Datos parseados:", {
                materias: data?.materias?.length || 0,
                profesores: data?.profesores?.length || 0,
                mentores: data?.mentores?.length || 0,
                apuntes: data?.apuntes?.length || 0,
                usuarios: data?.usuarios?.length || 0,
            });

            setSubjects(data?.materias ?? []);
            setNotes(data?.apuntes ?? []);
            setProfessors(data?.profesores ?? []);
            setMentors(data?.mentores ?? []);
            setUsers(data?.usuarios ?? []);
        } catch (e) {
            console.error("❌ Error en fetchAll:", e);
            setSubjects([]);
            setNotes([]);
            setProfessors([]);
            setMentors([]);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const getCurrentUserId = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('No hay usuario autenticado');
                    return;
                }

                const { data, error } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .maybeSingle(); // ← Cambiar .single() por .maybeSingle()

                if (error) {
                    console.error('Error en query:', error);
                    return;
                }

                if (data) setCurrentUserId(data.id_usuario);
            } catch (err) {
                console.error('Error obteniendo usuario actual:', err);
            }
        };
        getCurrentUserId();
    }, []);

    const filtered = useMemo(() => {
        const removeDuplicates = (items, getId) => {
            const seen = new Set();
            return items.filter((item) => {
                const id = getId(item);
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        };

        return {
            subjects: removeDuplicates(subjects, (s) => s.id_materia ?? s.id),
            professors: removeDuplicates(professors, (p) => p.id_profesor ?? p.id),
            mentors: removeDuplicates(mentors, (m) => m.id_mentor ?? m.id).filter(
                (m) => m.id_usuario !== currentUserId
            ),
            notes: removeDuplicates(notes, (n) => n.id_apunte ?? n.id),
            users: removeDuplicates(users, (u) => u.id_usuario ?? u.id).filter(
                (u) => u.id_usuario !== currentUserId
            ),
        };
    }, [subjects, professors, mentors, notes, users, currentUserId]);

    useEffect(() => {
        if (filtered.mentors.length > 0) {
            console.log('Mentores:', filtered.mentors[0]);
            console.log('currentUserId:', currentUserId);
        }
    }, [filtered.mentors, currentUserId]);

    // Usamos plural para los tabs y la lógica de show
    const show = (k) => tab === "todos" || tab === k;
    const total =
        filtered.subjects.length +
        filtered.professors.length +
        filtered.mentors.length +
        filtered.notes.length +
        filtered.users.length;

    const counts = {
        todos: total,
        materias: filtered.subjects.length,
        profesores: filtered.professors.length,
        mentores: filtered.mentors.length,
        apuntes: filtered.notes.length,
        usuarios: filtered.users.length,
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#F9FAFB",
                padding: "20px 0 40px 0",
            }}
        >
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <SearchBar />

                    <div style={{ textAlign: "center", marginTop: 32, marginBottom: 24 }}>
                        <h1
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: 28,
                                fontWeight: 700,
                                color: "#111827",
                            }}
                        >
                            {q ? `Resultados para "${q}"` : "Buscar en Kerana"}
                        </h1>
                        <p style={{ margin: 0, fontSize: 16, color: "#6B7280" }}>
                            {total > 0
                                ? `${total} resultados encontrados`
                                : "Encuentra profesores, materias, usuarios y apuntes"}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 24,
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    {["todos", "materias", "profesores", "mentores", "apuntes", "usuarios"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: "10px 20px",
                                borderRadius: 8,
                                background: tab === t ? "#2563EB" : "white",
                                color: tab === t ? "white" : "#374151",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                                border: tab === t ? "1px solid #2563EB" : "1px solid #D1D5DB",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            {t === "todos" && "🔍 Todos"}
                            {t === "materias" && "📖 Materias"}
                            {t === "profesores" && "👨‍🏫 Profesores"}
                            {t === "apuntes" && "📄 Apuntes"}
                            {t === "usuarios" && "👤 Usuarios"}
                            {t === "mentores" && "🎓 Mentores"}

                            {counts[t] > 0 && (
                                <span
                                    style={{
                                        background: tab === t ? "rgba(255,255,255,0.2)" : "#6B7280",
                                        color: "white",
                                        padding: "2px 8px",
                                        borderRadius: 12,
                                        fontSize: 12,
                                        fontWeight: 600,
                                    }}
                                >
                                    {counts[t]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Resultados */}
                {loading ? (
                    <div
                        style={{
                            display: "grid",
                            gap: 16,
                            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                        }}
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    height: 120,
                                    background: "white",
                                    borderRadius: 12,
                                    animation: "pulse 1.5s ease-in-out infinite",
                                    border: "1px solid #E5E7EB",
                                }}
                            />
                        ))}
                    </div>
                ) : total === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            background: "white",
                            borderRadius: 12,
                            border: "1px solid #E5E7EB",
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
                        <h3 style={{ margin: "0 0 12px 0", color: "#111827" }}>
                            No encontramos resultados
                        </h3>
                        <p style={{ margin: 0, color: "#6B7280", fontSize: 16 }}>
                            {q
                                ? `No hay resultados para "${q}". Prueba con otros términos.`
                                : "Comienza buscando en el campo de arriba."}
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gap: 16,
                            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                        }}
                    >
                        {/* Materias */}
                        {show("materias") &&
                            filtered.subjects.map((m) => (
                                <SubjectCard key={`materia-${m.id_materia}`} subject={m} />
                            ))}

                        {/* Profesores */}
                        {show("profesores") &&
                            filtered.professors.map((p, index) => (
                                <ProfessorCard
                                    key={`profesor-${p.id_profesor}-${index}`}
                                    professor={p}
                                />
                            ))}

                        {/* Apuntes */}
                        {show("apuntes") &&
                            filtered.notes.map((a, index) => (
                                <NoteCard key={`apunte-${a.id_apunte}-${index}`} note={a} />
                            ))}

                        {/* Usuarios */}
                        {show("usuarios") &&
                            filtered.users.map((user, index) => (
                                <UserCard
                                    key={`usuario-${user.id_usuario}-${index}`}
                                    usuario={user}
                                />
                            ))}

                        {/* Mentores */}
                        {show("mentores") &&
                            filtered.mentors.map((m, index) => (
                                <MentorCard
                                    key={`mentor-${m.id_mentor}-${index}`}
                                    mentor={m}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}