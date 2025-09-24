import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useRecentSearches from "../hooks/useRecentSearches";

export default function SearchBar() {
    const navigate = useNavigate();
    const { items, add, remove, clear } = useRecentSearches();

    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const onDocClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const submit = (term) => {
        const query = (term ?? q).trim();
        if (!query) return;
        add(query);
        setOpen(false);
        setQ("");
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    const suggestions = q
        ? items.filter((s) => s.toLowerCase().includes(q.toLowerCase()))
        : items;

    return (
        <div ref={wrapRef} style={{ display: "flex", justifyContent: "center" }}>
            <form
                onSubmit={(e) => { e.preventDefault(); submit(); }}
                style={{ position: "relative" }}
            >
                {/* INPUT | DIVIDER | BUTTON */}
                <div className="search-group">
                    <input
                        type="text"
                        className="search-input2"
                        placeholder="Buscá profesores, cursos, mentores, apuntes…"
                        value={q}
                        onChange={(e)=>{ setQ(e.target.value); setOpen(true); }}
                        onFocus={()=>setOpen(true)}
                    />
                    <div className="search-addon">
                        <button type="submit" className="search-btn2">🔎 Buscar</button>
                    </div>
                </div>

                {/* DROPDOWN de recientes (reubica ancho bajo el group) */}
                {open && suggestions.length > 0 && (
                    <div
                        className="search-dropdown"
                        style={{ width: "min(800px, 92vw)" }}   // mismo ancho que .search-group
                        onMouseDown={(e)=>e.preventDefault()}
                    >
                        <div className="search-head">
                            <span>Recientes</span>
                            <button className="search-clear" onClick={() => { clear(); setOpen(false); }}>
                                Limpiar
                            </button>
                        </div>
                        <div className="search-list">
                            {suggestions.map((item) => (
                                <div
                                    key={item}
                                    className="search-item"
                                    onClick={() => submit(item)}
                                >
                                    <span className="search-badge">🕘</span>
                                    <div className="search-text">{item}</div>
                                    <button
                                        className="search-remove"
                                        title="Quitar"
                                        onClick={(e) => { e.stopPropagation(); remove(item); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
