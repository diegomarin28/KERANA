import { useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import ResultCard from "../components/ResultCard";

const demo = {
    profesores: [
        { id: 1, nombre: "Laura Pérez", materia: "Base de Datos I", rating: 4.6 },
        { id: 2, nombre: "Martín Silva", materia: "Algoritmos", rating: 4.2 },
    ],
    apuntes: [
        { id: 10, titulo: "BD1 – Modelo Relacional resumen", autor: "Ana R.", rating: 4.8 },
        { id: 11, titulo: "Algoritmos – Punteros", autor: "Julián M.", rating: 4.1 },
    ],
    mentores: [
        { id: 20, nombre: "Sofi L.", area: "BD1 / SQL", rating: 4.9 },
        { id: 21, nombre: "Nico T.", area: "Cálculo I", rating: 4.3 },
    ],
};

export default function SearchResults() {
    const { search } = useLocation();
    const q = (new URLSearchParams(search).get("q") || "").trim();
    const [tab, setTab] = useState("todo");
    const [minRating, setMinRating] = useState(0);
    const [loading] = useState(false); // cambialo a true si hacés fetch real

    const res = useMemo(() => {
        const ql = q.toLowerCase();
        const prof = demo.profesores.filter(p =>
            [p.nombre, p.materia].some(t => t.toLowerCase().includes(ql)) && p.rating >= minRating
        );
        const apunt = demo.apuntes.filter(a =>
            [a.titulo, a.autor].some(t => t.toLowerCase().includes(ql)) && a.rating >= minRating
        );
        const ment = demo.mentores.filter(m =>
            [m.nombre, m.area].some(t => t.toLowerCase().includes(ql)) && m.rating >= minRating
        );
        return { prof, apunt, ment };
    }, [q, minRating]);

    const show = (k) => tab === "todo" || tab === k;
    const total = res.prof.length + res.apunt.length + res.ment.length;

    return (
        <div className="container" style={{ padding: "18px 0 36px" }}>
            <div className="results-head">
                <h2 style={{ margin: 0 }}>Resultados {q && <>para “<em>{q}</em>”</>}</h2>
                <span className="badge-chip">{total} items</span>

                <div className="tabs" style={{ marginLeft: "auto" }}>
                    {["todo","mentores","apuntes","profesores"].map(t => (
                        <button key={t} className={`tab ${tab===t ? "active" : ""}`} onClick={()=>setTab(t)}>
                            {t[0].toUpperCase()+t.slice(1)}
                        </button>
                    ))}
                    <select
                        value={minRating}
                        onChange={(e)=>setMinRating(Number(e.target.value))}
                        style={{ height: 38, borderRadius: 10, border: "1px solid var(--border)", padding: "0 10px" }}
                    >
                        {[0,3,3.5,4,4.5].map(v => <option key={v} value={v}>Min ★ {v}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid">
                    {Array.from({length:6}).map((_,i)=><div key={i} className="skel" />)}
                </div>
            ) : total === 0 ? (
                <div className="empty">
                    No encontramos resultados. Probá con otra palabra clave o bajá el filtro de ★ mínima.
                </div>
            ) : (
                <>
                    {show("mentores") && res.ment.length > 0 && (
                        <section className="section">
                            <div className="section-title">Mentores <span className="section-count">{res.ment.length}</span></div>
                            <div className="grid">
                                {res.ment.map(m => (
                                    <ResultCard key={m.id}
                                                title={m.nombre}
                                                subtitle={m.area}
                                                rating={m.rating}
                                                pill="Tutor"
                                                onClick={() => console.log("mentor", m.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {show("apuntes") && res.apunt.length > 0 && (
                        <section className="section">
                            <div className="section-title">Apuntes <span className="section-count">{res.apunt.length}</span></div>
                            <div className="grid">
                                {res.apunt.map(a => (
                                    <ResultCard key={a.id}
                                                title={a.titulo}
                                                subtitle={`Autor: ${a.autor}`}
                                                rating={a.rating}
                                                pill="PDF"
                                                onClick={() => console.log("apunte", a.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {show("profesores") && res.prof.length > 0 && (
                        <section className="section">
                            <div className="section-title">Profesores <span className="section-count">{res.prof.length}</span></div>
                            <div className="grid">
                                {res.prof.map(p => (
                                    <ResultCard
                                        key={p.id}
                                        title={p.nombre}
                                        subtitle={p.materia}
                                        rating={p.rating}
                                        pill="UM"
                                        to={`/profesores/${p.id}`}
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
