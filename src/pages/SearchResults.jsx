import { useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHome,
    faBookOpen,
    faChalkboardTeacher,
    faFileAlt,
    faUser,
    faGraduationCap,
    faSearch,
    faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import SearchBar from "../components/SearchBar";
import { searchAPI } from "../api/database";
import CourseCard from "../components/CourseCard.jsx";
import ProfessorCard from "../components/ProfessorCard";
import ApunteCard from "../components/ApunteCard.jsx";
import { UserCard } from "../components/UserCard";
import { MentorCard } from "../components/MentorCard";
import { supabase } from "../supabase";

export default function SearchResults() {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const q = (params.get("q") || "").trim();

    const _raw = (params.get("type") || "todos").toLowerCase();
    const _map = {
        todos: "todos",
        materias: "materias",
        profesores: "profesores",
        apuntes: "apuntes",
        usuarios: "usuarios",
        mentores: "mentores",
        materia: "materias",
        profesor: "profesores",
        apunte: "apuntes",
        usuario: "usuarios",
        mentor: "mentores",
    };
    const type = _map[_raw] || "todos";

    const [tab, setTab] = useState(type);
    const [loading, setLoading] = useState(false);

    const [subjects, setSubjects] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [notes, setNotes] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (q) fetchAll(q);
    }, [q]);

    const fetchAll = async (query) => {
        setLoading(true);
        try {
            const { data, error } = await searchAPI.searchAll(query);

            if (error) throw new Error(error.message || JSON.stringify(error));

            setSubjects(data?.materias ?? []);
            setNotes(data?.apuntes ?? []);
            setMentors(data?.mentores ?? []);
            setUsers(data?.usuarios ?? []);

            const profs = data?.profesores ?? [];

            if (profs.length > 0) {
                const profesorIds = profs.map(p => p.id_profesor);

                const { data: imparteData } = await supabase
                    .from('imparte')
                    .select('id_profesor, materia(nombre_materia)')
                    .in('id_profesor', profesorIds);

                const materiasMap = {};
                imparteData?.forEach(item => {
                    if (!materiasMap[item.id_profesor]) {
                        materiasMap[item.id_profesor] = [];
                    }
                    if (item.materia?.nombre_materia) {
                        materiasMap[item.id_profesor].push(item.materia.nombre_materia);
                    }
                });

                const profsConMaterias = profs.map(p => ({
                    ...p,
                    materias: materiasMap[p.id_profesor] || []
                }));

                setProfessors(profsConMaterias);
            } else {
                setProfessors([]);
            }

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
                if (!user) return;

                const { data, error } = await supabase
                    .from('usuario')
                    .select('id_usuario')
                    .eq('auth_id', user.id)
                    .maybeSingle();

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

    const tabsConfig = [
        { key: "todos", label: "Todos", icon: faHome },
        { key: "materias", label: "Materias", icon: faBookOpen },
        { key: "profesores", label: "Profesores", icon: faChalkboardTeacher },
        { key: "mentores", label: "Mentores", icon: faGraduationCap },
        { key: "apuntes", label: "Apuntes", icon: faFileAlt },
        { key: "usuarios", label: "Usuarios", icon: faUser },
    ];

    const sectionsConfig = [
        {
            key: "materias",
            label: "Materias",
            icon: faBookOpen,
            data: filtered.subjects,
            Component: CourseCard,
            getProps: (m) => ({
                course: {
                    tipo: 'materia',
                    id: m.id_materia,
                    titulo: m.nombre_materia,
                    subtitulo: m.semestre ? `Semestre: ${m.semestre}` : '',
                    conteo: {
                        apuntes: m.total_apuntes ?? 0,
                        profesores: m.total_profesores ?? 0,
                        mentores: m.total_mentores ?? 0
                    }
                }
            })
        },
        {
            key: "apuntes",
            label: "Apuntes",
            icon: faFileAlt,
            data: filtered.notes,
            Component: ApunteCard,
            getProps: (a) => ({
                note: a,
                currentUserId: currentUserId
            })
        },
        {
            key: "mentores",
            label: "Mentores",
            icon: faGraduationCap,
            data: filtered.mentors,
            Component: MentorCard,
            getProps: (m) => ({ mentor: m })
        },
        {
            key: "usuarios",
            label: "Usuarios",
            icon: faUser,
            data: filtered.users,
            Component: UserCard,
            getProps: (u) => ({ usuario: u })
        },
        {
            key: "profesores",
            label: "Profesores",
            icon: faChalkboardTeacher,
            data: filtered.professors,
            Component: ProfessorCard,
            getProps: (p) => ({ professor: p })
        },
    ];

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#F9FAFB",
                padding: "20px 0 40px 0",
                fontFamily: 'Inter, sans-serif'
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
                                fontFamily: 'Inter, sans-serif'
                            }}
                        >
                            {q ? `Resultados para "${q}"` : "Buscar en Kerana"}
                        </h1>
                        <p style={{
                            margin: 0,
                            fontSize: 16,
                            color: "#6B7280",
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500
                        }}>
                            {total > 0
                                ? `${total} resultado${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}`
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
                    {tabsConfig.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: "10px 20px",
                                borderRadius: 10,
                                background: tab === t.key ? "#2563EB" : "white",
                                color: tab === t.key ? "white" : "#374151",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                                border: tab === t.key ? "2px solid #2563EB" : "2px solid #D1D5DB",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => {
                                if (tab !== t.key) {
                                    e.currentTarget.style.borderColor = "#2563EB";
                                    e.currentTarget.style.background = "#EFF6FF";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (tab !== t.key) {
                                    e.currentTarget.style.borderColor = "#D1D5DB";
                                    e.currentTarget.style.background = "white";
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={t.icon} style={{ fontSize: 14 }} />
                            {t.label}

                            {counts[t.key] > 0 && (
                                <span
                                    style={{
                                        background: tab === t.key ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                                        color: tab === t.key ? "white" : "#374151",
                                        padding: "2px 8px",
                                        borderRadius: 12,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily: 'Inter, sans-serif'
                                    }}
                                >
                                    {counts[t.key]}
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
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
                            padding: "80px 20px",
                            background: "white",
                            borderRadius: 16,
                            border: "2px solid #E5E7EB",
                        }}
                    >
                        <div style={{
                            width: 80,
                            height: 80,
                            margin: "0 auto 24px",
                            background: "#F3F4F6",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <FontAwesomeIcon
                                icon={faSearch}
                                style={{
                                    fontSize: 32,
                                    color: "#9CA3AF"
                                }}
                            />
                        </div>
                        <h3 style={{
                            margin: "0 0 12px 0",
                            color: "#111827",
                            fontSize: 20,
                            fontWeight: 700,
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            No se encontraron resultados
                        </h3>
                        <p style={{
                            margin: 0,
                            color: "#6B7280",
                            fontSize: 15,
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif'
                        }}>
                            {q
                                ? `No hay resultados para "${q}". Intenta con otros términos de búsqueda.`
                                : "Comienza escribiendo en el buscador para encontrar profesores, materias, apuntes y más."}
                        </p>
                    </div>
                ) : (
                    <>
                        {tab !== "todos" && counts[tab] === 0 && (
                            <div style={{
                                background: '#FEF3C7',
                                border: '2px solid #FDE68A',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <FontAwesomeIcon
                                    icon={faExclamationCircle}
                                    style={{
                                        fontSize: 18,
                                        color: '#D97706',
                                        flexShrink: 0
                                    }}
                                />
                                <span style={{
                                    color: '#92400E',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    No se encontraron {tabsConfig.find(t => t.key === tab)?.label.toLowerCase()} para "{q}"
                                </span>
                            </div>
                        )}

                        {tab === "todos" ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                                {sectionsConfig.map((section) => {
                                    if (section.data.length === 0) return null;

                                    return (
                                        <div key={section.key} style={{ marginBottom: 48 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                marginBottom: 16,
                                                paddingBottom: 12,
                                                borderBottom: '2px solid #E5E7EB'
                                            }}>
                                                <FontAwesomeIcon
                                                    icon={section.icon}
                                                    style={{
                                                        fontSize: 20,
                                                        color: '#13346b'
                                                    }}
                                                />
                                                <h2 style={{
                                                    margin: 0,
                                                    fontSize: 20,
                                                    fontWeight: 700,
                                                    color: '#13346b',
                                                    fontFamily: 'Inter, sans-serif'
                                                }}>
                                                    {section.label}
                                                </h2>
                                                <span style={{
                                                    background: '#EFF6FF',
                                                    color: '#1E40AF',
                                                    padding: '4px 12px',
                                                    borderRadius: 12,
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    fontFamily: 'Inter, sans-serif'
                                                }}>
                                                    {section.data.length}
                                                </span>
                                            </div>

                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 16,
                                                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                                }}
                                            >
                                                {section.data.map((item, index) => {
                                                    const Component = section.Component;
                                                    const props = section.getProps(item);
                                                    return (
                                                        <Component
                                                            key={`${section.key}-${item.id_materia || item.id_profesor || item.id_mentor || item.id_apunte || item.id_usuario}-${index}`}
                                                            {...props}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "grid",
                                    gap: 16,
                                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                    marginBottom: 48
                                }}
                            >
                                {show("materias") &&
                                    filtered.subjects.map((m) => (
                                        <CourseCard
                                            key={`materia-${m.id_materia}`}
                                            course={{
                                                tipo: 'materia',
                                                id: m.id_materia,
                                                titulo: m.nombre_materia,
                                                subtitulo: m.semestre ? `Semestre: ${m.semestre}` : '',
                                                conteo: {
                                                    apuntes: m.total_apuntes ?? 0,
                                                    profesores: m.total_profesores ?? 0,
                                                    mentores: m.total_mentores ?? 0
                                                }
                                            }}
                                        />
                                    ))}

                                {show("profesores") &&
                                    filtered.professors.map((p, index) => (
                                        <ProfessorCard
                                            key={`profesor-${p.id_profesor}-${index}`}
                                            professor={p}
                                        />
                                    ))}

                                {/* ✅ ACTUALIZADO: Ahora pasa currentUserId */}
                                {show("apuntes") &&
                                    filtered.notes.map((a, index) => (
                                        <ApunteCard key={a.id_apunte} note={a} currentUserId={currentUserId} />
                                    ))}

                                {show("usuarios") &&
                                    filtered.users.map((user, index) => (
                                        <UserCard
                                            key={`usuario-${user.id_usuario}-${index}`}
                                            usuario={user}
                                        />
                                    ))}

                                {show("mentores") &&
                                    filtered.mentors.map((m, index) => (
                                        <MentorCard
                                            key={`mentor-${m.id_mentor}-${index}`}
                                            mentor={m}
                                        />
                                    ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}