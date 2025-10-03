import { useEffect, useRef, useState } from "react";
import { supabase } from '../supabase';

export default function SearchBar() {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recent, setRecent] = useState(() => {
        try { return JSON.parse(localStorage.getItem("kerana_recent") || "[]"); }
        catch { return []; }
    });
    const wrapRef = useRef(null);

    useEffect(() => {
        const onDocDown = (e) => {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("pointerdown", onDocDown);
        return () => document.removeEventListener("pointerdown", onDocDown);
    }, []);

    useEffect(() => {
        if (!q.trim()) {
            setSuggestions([]);
            return;
        }

        const searchSuggestions = async () => {
            setLoading(true);
            const term = q.trim();

            try {
                const results = [];

                const { data: materias, error: materiasError } = await supabase
                    .rpc('buscar_materias_sin_tildes', { termino: term });

                if (materiasError) {
                    console.error('Error buscando materias:', materiasError);
                } else if (materias) {
                    materias.forEach(m => {
                        results.push({
                            type: 'materia',
                            id: m.id_materia,
                            text: m.nombre_materia,
                            icon: '📖'
                        });
                    });
                }

                const { data: profesores, error: profesoresError } = await supabase
                    .rpc('buscar_profesores_sin_tildes', { termino: term });

                if (profesoresError) {
                    console.error('Error buscando profesores:', profesoresError);
                } else if (profesores) {
                    profesores.forEach(p => {
                        results.push({
                            type: 'profesor',
                            id: p.id_profesor,
                            text: p.profesor_nombre,
                            icon: '👨‍🏫'
                        });
                    });
                }

                const { data: apuntes, error: apuntesError } = await supabase
                    .rpc('buscar_apuntes_sin_tildes', { termino: term });

                if (apuntesError) {
                    console.error('Error buscando apuntes:', apuntesError);
                } else if (apuntes) {
                    apuntes.forEach(a => {
                        results.push({
                            type: 'apunte',
                            id: a.id_apunte,
                            text: a.titulo,
                            icon: '📄'
                        });
                    });
                }

                setSuggestions(results);

            } catch (err) {
                console.error('Error general en búsqueda:', err);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(() => {
            searchSuggestions();
        }, 300);

        return () => clearTimeout(debounce);
    }, [q]);

    const saveRecent = (term) => {
        const t = term.trim();
        if (!t) return;
        const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8);
        setRecent(next);
        localStorage.setItem("kerana_recent", JSON.stringify(next));
    };

    const removeRecent = (term) => {
        const next = recent.filter((x) => x !== term);
        setRecent(next);
        localStorage.setItem("kerana_recent", JSON.stringify(next));
    };

    const onSearch = (e) => {
        e?.preventDefault?.();
        const term = q.trim();
        if (!term) return;
        saveRecent(term);
        window.location.href = `/search?q=${encodeURIComponent(term)}`;
    };

    const goToSuggestion = (suggestion) => {
        saveRecent(suggestion.text);
        setOpen(false);

        if (suggestion.type === 'materia') {
            window.location.href = `/subjects/${suggestion.id}`;
        } else if (suggestion.type === 'profesor') {
            window.location.href = `/profesores/${suggestion.id}`;
        } else if (suggestion.type === 'apunte') {
            window.location.href = `/apuntes/${suggestion.id}`;
        }
    };

    const showRecent = !q.trim() && recent.length > 0;
    const showSuggestions = q.trim() && suggestions.length > 0;
    const showNoResults = q.trim() && !loading && suggestions.length === 0;

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "min(780px, 92vw)",
                margin: "0 auto",
            }}
        >
            <form
                onSubmit={onSearch}
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 0,
                    background: "#fff",
                    borderRadius: open ? "16px 16px 0 0" : "9999px",
                    padding: 6,
                    boxShadow: "0 10px 24px rgba(0,0,0,.10)",
                    border: "1px solid #e5e7eb",
                }}
            >
                <input
                    onFocus={() => setOpen(true)}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscá profesores, cursos, mentores, apuntes…"
                    style={{
                        border: "none",
                        outline: "none",
                        padding: "12px 16px",
                        borderRadius: 9999,
                        fontSize: 16,
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: "0 18px",
                        height: 44,
                        borderRadius: 9999,
                        border: "1px solid #1e40af",
                        background: "#2563eb",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                >
                    Buscar
                </button>
            </form>

            {open && (showRecent || showSuggestions || showNoResults || loading) && (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "100%",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderTop: "none",
                        borderRadius: "0 0 16px 16px",
                        boxShadow: "0 16px 32px rgba(0,0,0,.12)",
                        overflow: "hidden",
                        maxHeight: "400px",
                        overflowY: "auto"
                    }}
                >
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {showSuggestions && suggestions.map((s, idx) => (
                            <li
                                key={`${s.type}-${s.id}`}
                                style={{
                                    borderBottom: idx < suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                                    transition: "all 0.2s ease",
                                    cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(90deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.04) 50%, rgba(37, 99, 235, 0.06) 100%)";
                                    e.currentTarget.style.borderLeft = "3px solid #2563eb";
                                    e.currentTarget.style.paddingLeft = "11px";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.borderLeft = "none";
                                    e.currentTarget.style.paddingLeft = "0";
                                }}
                                onClick={() => goToSuggestion(s)}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "12px 14px",
                                    textAlign: "left",
                                }}>
                                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                                    <span style={{ flex: 1, fontSize: 15, color: "#111827" }}>
                                        {s.text}
                                    </span>
                                    <span style={{
                                        fontSize: 11,
                                        color: "#9ca3af",
                                        textTransform: "uppercase",
                                        fontWeight: 600
                                    }}>
                                        {s.type}
                                    </span>
                                </div>
                            </li>
                        ))}

                        {showRecent && recent.map((r) => (
                            <li
                                key={r}
                                style={{
                                    borderBottom: "1px solid #f3f4f6",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(90deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.04) 50%, rgba(37, 99, 235, 0.06) 100%)";
                                    e.currentTarget.style.borderLeft = "3px solid #2563eb";
                                    e.currentTarget.style.paddingLeft = "11px";
                                    const svg = e.currentTarget.querySelector('svg');
                                    if (svg) svg.style.color = "#2563eb";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.borderLeft = "none";
                                    e.currentTarget.style.paddingLeft = "0";
                                    const svg = e.currentTarget.querySelector('svg');
                                    if (svg) svg.style.color = "#9ca3af";
                                }}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    padding: "12px 14px",
                                }}>
                                    <button
                                        onClick={() => {
                                            setQ(r);
                                            saveRecent(r);
                                            window.location.href = `/search?q=${encodeURIComponent(r)}`;
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            flex: "1 1 auto",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            padding: 0,
                                            color: "#111827",
                                            fontSize: 15,
                                        }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            style={{
                                                width: 18,
                                                height: 18,
                                                color: "#9ca3af",
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                                            />
                                        </svg>
                                        {r}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeRecent(r);
                                        }}
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            background: "#fff",
                                            color: "#9ca3af",
                                            borderRadius: 8,
                                            width: 28,
                                            height: 28,
                                            cursor: "pointer",
                                            fontSize: 16,
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = "#ef4444";
                                            e.target.style.borderColor = "#ef4444";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = "#9ca3af";
                                            e.target.style.borderColor = "#e5e7eb";
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {loading && (
                        <div style={{
                            padding: 16,
                            textAlign: "center",
                            color: '#9ca3af',
                            fontSize: 14
                        }}>
                            Buscando...
                        </div>
                    )}

                    {showNoResults && (
                        <div style={{
                            padding: 16,
                            textAlign: "center",
                            color: '#9ca3af',
                            fontSize: 14
                        }}>
                            No se encontraron resultados para "{q}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}