import { useEffect, useRef, useState } from "react";

export default function SearchBar() {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
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

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "min(780px, 92vw)",
                margin: "0 auto",
            }}
        >
            {/* INPUT */}
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
                    borderBottom: open ? "1px solid #e5e7eb" : "1px solid #e5e7eb",
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

            {/* RECENTES */}
            {open && recent.length > 0 && (
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
                    }}
                >


                    {/* Items */}
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {recent.map((r) => (
                            <li
                                key={r}
                                style={{
                                    borderBottom: "1px solid #f3f4f6",
                                    transition: "all 0.2s ease",
                                    position: "relative",
                                    cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(90deg, rgba(37, 99, 235, 0.06) 0%, rgba(37, 99, 235, 0.04) 50%, rgba(37, 99, 235, 0.06) 100%)";
                                    e.currentTarget.style.borderLeft = "3px solid #2563eb";
                                    e.currentTarget.style.paddingLeft = "11px";
                                    e.currentTarget.style.transform = "translateX(2px)";



                                    // Cambiar el color del icono
                                    const svg = e.currentTarget.querySelector('svg');
                                    if (svg) {
                                        svg.style.color = "#2563eb";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.borderLeft = "none";
                                    e.currentTarget.style.paddingLeft = "0";
                                    e.currentTarget.style.transform = "translateX(0px)";



                                    // Restaurar el color del icono
                                    const svg = e.currentTarget.querySelector('svg');
                                    if (svg) {
                                        svg.style.color = "#9ca3af";
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        padding: "12px 14px",
                                    }}
                                >
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
                                            textAlign: "left",
                                            border: "none",
                                            background: "transparent",
                                            cursor: "pointer",
                                            padding: 0,
                                            color: "#111827",
                                            fontSize: 15,
                                            transition: "all 0.2s ease",
                                        }}
                                        title={r}
                                    >
                                        {/* Icono de reloj/historial */}
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
                                                transition: "all 0.2s ease"
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

                                    {/* "x" gris */}
                                    <button
                                        type="button"
                                        aria-label="Eliminar búsqueda"
                                        onClick={() => removeRecent(r)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        style={{
                                            border: "1px solid #e5e7eb",
                                            background: "#fff",
                                            color: "#9ca3af",
                                            borderRadius: 8,
                                            width: 28,
                                            height: 28,
                                            lineHeight: "26px",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            transition: "all 0.2s ease",
                                        }}
                                        title="Eliminar"
                                        onMouseEnter={(e) => {
                                            e.target.style.color = "#ef4444";
                                            e.target.style.transform = "scale(1.1)";
                                            e.target.style.borderColor = "#ef4444";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = "#9ca3af";
                                            e.target.style.transform = "scale(1)";
                                            e.target.style.borderColor = "#e5e7eb";
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
