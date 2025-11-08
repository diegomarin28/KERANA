import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faBookOpen,
    faChalkboardTeacher,
    faFileAlt,
    faUser,
    faGraduationCap,
    faClock,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

export default function SearchBar() {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [recent, setRecent] = useState(() => {
        try { return JSON.parse(localStorage.getItem("kerana_recent") || "[]"); }
        catch { return []; }
    });
    const wrapRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Mapeo de iconos Font Awesome
    const iconMap = {
        'materia': faBookOpen,
        'profesor': faChalkboardTeacher,
        'apunte': faFileAlt,
        'usuario': faUser,
        'mentor': faGraduationCap,
    };

    const colorMap = {
        'materia': '#64748b',
        'profesor': '#64748b',
        'apunte': '#64748b',
        'usuario': '#64748b',
        'mentor': '#10b981',
    };

    // Obtener el ID del usuario actual al montar
    useEffect(() => {
        const fetchCurrentUserId = async () => {
            try {
                const { data } = await supabase.rpc('obtener_usuario_actual_id');
                setCurrentUserId(data);
            } catch (error) {
                console.error('Error obteniendo usuario actual:', error);
            }
        };
        fetchCurrentUserId();
    }, []);

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

                // Buscar materias (prioridad 1)
                const { data: materias, error: materiasError } = await supabase
                    .rpc('buscar_materias_sin_tildes', { termino: term });

                if (!materiasError && materias) {
                    materias.forEach(m => {
                        results.push({
                            type: 'materia',
                            id: m.id_materia,
                            text: m.nombre_materia,
                        });
                    });
                }

                // Buscar profesores (prioridad 2)
                const { data: profesores, error: profesoresError } = await supabase
                    .rpc('buscar_profesores_sin_tildes', { termino: term });

                if (!profesoresError && profesores) {
                    profesores.forEach(p => {
                        results.push({
                            type: 'profesor',
                            id: p.id_profesor,
                            text: p.profesor_nombre,
                        });
                    });
                }

                // Buscar apuntes (prioridad 3)
                const { data: apuntes, error: apuntesError } = await supabase
                    .rpc('buscar_apuntes_sin_tildes', { termino: term });

                if (!apuntesError && apuntes) {
                    apuntes.forEach(a => {
                        results.push({
                            type: 'apunte',
                            id: a.id_apunte,
                            text: a.titulo,
                        });
                    });
                }

                // Buscar usuarios (prioridad 4)
                const { data: usuarios, error: usuariosError } = await supabase
                    .rpc('buscar_usuarios_sin_tildes', {
                        termino: term,
                        usuario_actual_id: currentUserId
                    });

                if (!usuariosError && usuarios) {
                    usuarios.forEach(u => {
                        results.push({
                            type: 'usuario',
                            id: u.id_usuario,
                            text: u.nombre,
                            username: u.username,
                            correo: u.correo,
                            foto: u.foto
                        });
                    });
                }

                // Buscar mentores (prioridad 5)
                const { data: mentores, error: mentoresError } = await supabase
                    .rpc('buscar_mentores_sin_tildes', {
                        termino: term,
                        usuario_actual_id: currentUserId
                    });

                if (!mentoresError && mentores) {
                    mentores.forEach(m => {
                        results.push({
                            type: 'mentor',
                            id: m.id_mentor,
                            text: m.nombre,
                            username: m.username,
                            foto: m.foto
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
    }, [q, currentUserId]);

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
        navigate(`/search?q=${encodeURIComponent(term)}`);
        setOpen(false);
    };

    const goToSuggestion = (suggestion) => {
        saveRecent(suggestion.text);
        setOpen(false);
        setQ("");

        if (suggestion.type === 'usuario') {
            navigate(`/user/${suggestion.username}`);
        } else if (suggestion.type === 'mentor') {
            navigate(`/mentor/${suggestion.username}`);
        } else {
            navigate(`/search?q=${encodeURIComponent(suggestion.text)}&type=${suggestion.type}`);
        }
    };

    const handleRecentSearch = (term) => {
        setQ(term);
        saveRecent(term);
        navigate(`/search?q=${encodeURIComponent(term)}`);
        setOpen(false);
    };

    const showRecent = !q.trim() && recent.length > 0;
    const showSuggestions = q.trim() && suggestions.length > 0;
    const showNoResults = q.trim() && !loading && suggestions.length === 0;

    const renderSuggestionContent = (suggestion) => {
        const icon = iconMap[suggestion.type];
        const color = colorMap[suggestion.type];

        if (suggestion.type === 'usuario' || suggestion.type === 'mentor') {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    {suggestion.foto ? (
                        <img
                            src={suggestion.foto}
                            alt={suggestion.text}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #f1f5f9',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: `${color}15`,
                            color: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                            border: `2px solid ${color}30`,
                        }}>
                            <FontAwesomeIcon icon={icon} />
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: 14,
                            color: "#0f172a",
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {suggestion.text}
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            @{suggestion.username}
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: `${color}10`,
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                    }}>
                        <FontAwesomeIcon icon={icon} />
                    </div>
                    <span style={{
                        flex: 1,
                        fontSize: 14,
                        color: "#0f172a",
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {suggestion.text}
                    </span>
                </div>
            );
        }
    };

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: window.innerWidth <= 375 ? "calc(100vw - 32px)" : "min(780px, 92vw)",
                maxWidth: "100%",
                margin: "0 auto",
            }}
        >
            <form
                onSubmit={onSearch}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "#fff",
                    borderRadius: open ? "32px 32px 0 0" : "32px",
                    padding: window.innerWidth <= 375 ? "6px 8px 6px 14px" : "8px 10px 8px 24px",
                    boxShadow: open
                        ? "0 20px 60px rgba(0,0,0,0.15)"
                        : "0 10px 40px rgba(0,0,0,0.12)",
                    border: `2px solid ${open ? '#2563eb' : 'transparent'}`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                <FontAwesomeIcon
                    icon={faSearch}
                    style={{
                        color: open ? '#2563eb' : '#94a3b8',
                        fontSize: 18,
                        transition: 'color 0.3s ease',
                    }}
                />
                <input
                    ref={inputRef}
                    onFocus={() => setOpen(true)}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={window.innerWidth <= 375 ? "Buscar..." : "Buscar profesores, cursos, mentores, apuntes..."}
                    style={{
                        border: "none",
                        outline: "none",
                        padding: window.innerWidth <= 375 ? "12px 8px" : "14px 12px",
                        flex: 1,
                        fontSize: 15,
                        color: '#0f172a',
                        background: 'transparent',
                        fontWeight: 500,
                    }}
                />
                {q && (
                    <button
                        type="button"
                        onClick={() => {
                            setQ("");
                            inputRef.current?.focus();
                        }}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: 'none',
                            background: '#f1f5f9',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fee2e2';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.color = '#64748b';
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 13 }} />
                    </button>
                )}
                <button
                    type="submit"
                    style={{
                        padding: window.innerWidth <= 375 ? "10px 14px" : "12px 24px",
                        height: window.innerWidth <= 375 ? 40 : 48,
                        borderRadius: window.innerWidth <= 375 ? 20 : 24,
                        fontSize: window.innerWidth <= 375 ? 12 : 14,
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#1d4ed8";
                        e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#2563eb";
                        e.currentTarget.style.transform = "scale(1)";
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
                        border: "2px solid #2563eb",
                        borderTop: "none",
                        borderRadius: "0 0 32px 32px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        overflow: "hidden",
                        maxHeight: "420px",
                        overflowY: "auto",
                        zIndex: 999999,
                        animation: "slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {showSuggestions && suggestions.map((s, idx) => (
                            <li
                                key={`${s.type}-${s.id}`}
                                style={{
                                    borderBottom: idx < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    transition: "all 0.15s ease",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                onClick={() => goToSuggestion(s)}
                            >
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    padding: "12px 20px",
                                }}>
                                    {renderSuggestionContent(s)}
                                    <span style={{
                                        fontSize: 10,
                                        color: '#94a3b8',
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        letterSpacing: '0.5px',
                                        flexShrink: 0,
                                    }}>
                                        {s.type}
                                    </span>
                                </div>
                            </li>
                        ))}

                        {showRecent && (
                            <>

                                {recent.map((r, idx) => (
                                    <li
                                        key={r}
                                        style={{
                                            borderBottom: idx < recent.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            transition: "all 0.15s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#f8fafc';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            padding: "10px 20px",
                                        }}>
                                            <button
                                                onClick={() => handleRecentSearch(r)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    flex: 1,
                                                    border: "none",
                                                    background: "transparent",
                                                    cursor: "pointer",
                                                    padding: 0,
                                                    color: "#0f172a",
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    textAlign: 'left',
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faClock}
                                                    style={{
                                                        color: '#94a3b8',
                                                        fontSize: 13,
                                                    }}
                                                />
                                                {r}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeRecent(r);
                                                }}
                                                style={{
                                                    width: 26,
                                                    height: 26,
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: '#94a3b8',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: "all 0.2s ease",
                                                    flexShrink: 0,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#fee2e2';
                                                    e.currentTarget.style.color = '#ef4444';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = '#94a3b8';
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faTimes} style={{ fontSize: 12 }} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>

                    {loading && (
                        <div style={{
                            padding: '20px 16px',
                            textAlign: "center",
                            color: '#64748b',
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                        }}>
                            <div style={{
                                width: 14,
                                height: 14,
                                border: '2px solid #e5e7eb',
                                borderTop: '2px solid #2563eb',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                            Buscando...
                        </div>
                    )}

                    {showNoResults && (
                        <div style={{
                            padding: '28px 16px',
                            textAlign: "center",
                        }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px',
                                fontSize: 18,
                            }}>
                                <FontAwesomeIcon icon={faSearch} />
                            </div>
                            <div style={{
                                color: '#64748b',
                                fontSize: 13,
                                fontWeight: 500,
                            }}>
                                No se encontraron resultados para <strong>"{q}"</strong>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-12px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}