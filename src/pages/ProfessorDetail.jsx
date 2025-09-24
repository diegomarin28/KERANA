
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

/** MOCK – reemplazá con fetch/API */
const mock = {
    1: {
        id: 1,
        nombre: "Laura Pérez",
        materia: "Base de Datos I",
        depto: "Informática",
        promedio: 4.6,
        totalResenas: 18,
        bio: "Enfoca en SQL práctico, proyectos por equipos y parciales con casos reales.",
        tags: ["SQL", "Modelo relacional", "Trabajo práctico", "Feedback rápido"],
        resenas: [
            { id: 101, user: "Diego M.", rating: 5, titulo: "Clara y exigente", texto: "Da mucho material, corrige rápido.", fecha: "2025-08-11" },
            { id: 102, user: "Ana R.",   rating: 4, titulo: "Parciales justos", texto: "Clases dinámicas, pide práctica.", fecha: "2025-06-02" },
        ],
    },
    2: {
        id: 2,
        nombre: "Martín Silva",
        materia: "Algoritmos",
        depto: "Informática",
        promedio: 4.2,
        totalResenas: 11,
        bio: "Fuerte en complejidad y estructuras. Parciales a mano.",
        tags: ["C++", "Punteros", "Listas", "Complejidad"],
        resenas: [
            { id: 201, user: "Nico T.", rating: 4, titulo: "Teórico pero útil", texto: "Buen material, orales exigentes.", fecha: "2025-04-18" },
        ],
    },
};

function StarRow({ value=0 }) {
    return (
        <div aria-label={`Rating ${value}`} style={{ color:"#f59e0b", fontWeight:700 }}>
            {"★".repeat(Math.round(value))}{"☆".repeat(5-Math.round(value))}
        </div>
    );
}

function Chip({ children }) {
    return (
        <span style={{
            background:"#eef2ff", color:"#475569", border:"1px solid #c7d2fe",
            padding:"4px 10px", borderRadius:9999, fontSize:12, fontWeight:700
        }}>{children}</span>
    );
}

export default function ProfessorDetail() {
    const { id } = useParams();
    const data = mock[id] ?? mock[1]; // fallback
    const [open, setOpen] = useState(false);

    const promedioTxt = useMemo(()=> (Math.round(data.promedio*10)/10).toFixed(1), [data.promedio]);

    return (
        <div className="container" style={{ padding: "18px 0 36px" }}>
            {/* Header del profe */}
            <section style={{
                border:"1px solid var(--border)", borderRadius:12, padding:16, background:"#fff",
                display:"grid", gap:12
            }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    <div style={{
                        width:56, height:56, borderRadius:"50%", background:"var(--accent)", color:"#fff",
                        display:"grid", placeItems:"center", fontWeight:800, fontSize:22
                    }}>
                        {data.nombre[0]}
                    </div>
                    <div style={{ display:"grid" }}>
                        <h2 style={{ margin:0 }}>{data.nombre}</h2>
                        <div style={{ color:"var(--muted)", fontSize:14 }}>
                            {data.materia} · {data.depto}
                        </div>
                    </div>
                    <div style={{ marginLeft:"auto", textAlign:"right" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" }}>
                            <StarRow value={data.promedio} />
                            <strong>{promedioTxt}</strong>
                        </div>
                        <div style={{ color:"var(--muted)", fontSize:12 }}>{data.totalResenas} reseñas</div>
                    </div>
                </div>

                <p style={{ margin:0, color:"var(--fg)" }}>{data.bio}</p>

                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {data.tags.map(t => <Chip key={t}>{t}</Chip>)}
                </div>

                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <button className="btn-primary" onClick={()=>setOpen(true)}>Hacer reseña</button>
                    <button className="btn-primary" style={{ background:"var(--accent)" }}>Seguir profesor</button>
                </div>
            </section>

            {/* Reseñas */}
            <section style={{ marginTop:20 }}>
                <h3 style={{ margin:"10px 0" }}>Reseñas</h3>
                <div style={{ display:"grid", gap:12 }}>
                    {data.resenas.map(r => (
                        <article key={r.id} style={{
                            border:"1px solid var(--border)", borderRadius:12, padding:14, background:"#fff"
                        }}>
                            <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{
                                        width:34, height:34, borderRadius:"50%", background:"#e2e8f0", display:"grid",
                                        placeItems:"center", fontWeight:800, color:"#334155"
                                    }}>{r.user[0]}</div>
                                    <div style={{ display:"grid" }}>
                                        <strong style={{ margin:0 }}>{r.titulo}</strong>
                                        <span style={{ fontSize:12, color:"var(--muted)" }}>{r.user} · {r.fecha}</span>
                                    </div>
                                </div>
                                <StarRow value={r.rating} />
                            </div>
                            <p style={{ margin:"10px 0 0 0" }}>{r.texto}</p>
                        </article>
                    ))}
                </div>
            </section>

            {open && <ReviewModal onClose={()=>setOpen(false)} onSave={(review)=>console.log("guardar", review)} />}
        </div>
    );
}

function ReviewModal({ onClose, onSave }) {
    const [form, setForm] = useState({ rating:5, titulo:"", texto:"", workload:"Medio", metodologia:"Clases prácticas" });

    const save = () => {
        if(!form.titulo.trim() || !form.texto.trim()) return;
        onSave?.(form);
        onClose();
    };

    return (
        <>
            <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.35)", zIndex:3000 }} />
            <div role="dialog" aria-modal="true" style={{
                position:"fixed", inset:0, display:"grid", placeItems:"center", zIndex:3010
            }}>
                <div style={{
                    width:"min(720px, 92vw)", background:"#fff", borderRadius:14, border:"1px solid var(--border)",
                    boxShadow:"0 24px 60px rgba(0,0,0,.25)", padding:18, display:"grid", gap:12
                }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <h3 style={{ margin:0 }}>Nueva reseña</h3>
                        <button onClick={onClose} style={{ border:"none", background:"transparent", fontSize:20, cursor:"pointer" }}>✖</button>
                    </div>

                    <label style={{ display:"grid", gap:6 }}>
                        <span>Calificación (1–5)</span>
                        <input type="number" min={1} max={5}
                               value={form.rating}
                               onChange={(e)=>setForm({...form, rating:Number(e.target.value)})}
                               style={{ height:40, border:"1px solid var(--border)", borderRadius:10, padding:"0 10px" }}
                        />
                    </label>

                    <label style={{ display:"grid", gap:6 }}>
                        <span>Título</span>
                        <input type="text"
                               value={form.titulo}
                               onChange={(e)=>setForm({...form, titulo:e.target.value})}
                               placeholder="Ej: Clara y exigente"
                               style={{ height:40, border:"1px solid var(--border)", borderRadius:10, padding:"0 10px" }}
                        />
                    </label>

                    <label style={{ display:"grid", gap:6 }}>
                        <span>Comentario</span>
                        <textarea
                            value={form.texto}
                            onChange={(e)=>setForm({...form, texto:e.target.value})}
                            placeholder="Contanos metodología, parciales, si recomienda material…"
                            rows={5}
                            style={{ border:"1px solid var(--border)", borderRadius:10, padding:"10px" }}
                        />
                    </label>

                    {/* Campos tipo “metodología”/“workload” que vos mencionaste */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <label style={{ display:"grid", gap:6 }}>
                            <span>Carga de trabajo</span>
                            <select
                                value={form.workload}
                                onChange={(e)=>setForm({...form, workload:e.target.value})}
                                style={{ height:40, border:"1px solid var(--border)", borderRadius:10, padding:"0 10px" }}
                            >
                                {["Baja","Medio","Alta"].map(v => <option key={v}>{v}</option>)}
                            </select>
                        </label>
                        <label style={{ display:"grid", gap:6 }}>
                            <span>Metodología</span>
                            <select
                                value={form.metodologia}
                                onChange={(e)=>setForm({...form, metodologia:e.target.value})}
                                style={{ height:40, border:"1px solid var(--border)", borderRadius:10, padding:"0 10px" }}
                            >
                                {["Clases teóricas","Clases prácticas","Proyectos","Parciales frecuentes"].map(v => <option key={v}>{v}</option>)}
                            </select>
                        </label>
                    </div>

                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                        <button onClick={onClose} style={{ height:40, padding:"0 14px", borderRadius:10, border:"1px solid var(--border)", background:"#fff", cursor:"pointer" }}>
                            Cancelar
                        </button>
                        <button onClick={save} className="btn-primary" style={{ height:40 }}>
                            Publicar reseña
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
