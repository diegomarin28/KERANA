// src/pages/Subjects.jsx
import { useEffect, useState } from "react";
import { subjectsAPI } from "../api/Database";

export default function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                // 1) intento con la vista "completa"
                const { data, error } = await subjectsAPI.getAllSubjects();
                if (error) throw new Error(error.message || "Error cargando materias");

                if (Array.isArray(data) && data.length) {
                    if (!alive) return;
                    setSubjects(normalize(data));
                } else {
                    // 2) fallback a la tabla simple
                    const { data: simple, error: e2 } = await subjectsAPI.getAllSubjectsSimple();
                    if (e2) throw new Error(e2.message || "Error cargando materias (simple)");
                    if (!alive) return;
                    setSubjects(normalizeSimple(simple));
                }
            } catch (e) {
                // 3) si todo falla, mostramos error pero no bloqueamos UI
                if (!alive) return;
                setErr(e?.message || "No se pudo cargar Asignaturas");
                setSubjects([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
                <div>Cargando asignaturas…</div>
            </div>
        );
    }

    return (
        <div style={{ width: "min(1080px, 92vw)", margin: "0 auto", padding: "24px 0" }}>
            <h1 style={{ margin: "0 0 12px" }}>Asignaturas</h1>
            {err && (
                <div style={{
                    background: "#fef2f2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 12
                }}>
                    {err} — mostrando vista simple si hay datos.
                </div>
            )}

            {subjects.length === 0 ? (
                <div style={{ color: "#6b7280" }}>No hay asignaturas disponibles.</div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 12
                }}>
                    {subjects.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                                // navegá a la materia; ajustá la ruta a tu detalle si corresponde
                                window.location.assign(`/cursos/${s.id}`);
                            }}
                            style={{
                                all: "unset",
                                display: "block",
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 10,
                                padding: 12,
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,.06)"}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                        >
                            <div style={{ fontWeight: 700 }}>{s.nombre}</div>
                            {typeof s.semestre !== "undefined" && (
                                <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                                    Semestre: {s.semestre}
                                </div>
                            )}
                            {"conteo" in s && (
                                <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 12, color: "#374151" }}>
                                    <span>Apuntes: <b>{s.conteo.apuntes}</b></span>
                                    <span>Profes: <b>{s.conteo.profesores}</b></span>
                                    <span>Mentores: <b>{s.conteo.mentores}</b></span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Normaliza la vista "materias_con_contenido"
function normalize(rows) {
    return rows.map(r => ({
        id: r.id_materia ?? r.id ?? r.materia_id,
        nombre: r.nombre_materia ?? r.nombre ?? r.materia_nombre,
        semestre: r.semestre ?? undefined,
        conteo: {
            apuntes: r.total_apuntes ?? r.apuntes ?? 0,
            profesores: r.total_profesores ?? r.profesores ?? 0,
            mentores: r.total_mentores ?? r.mentores ?? 0,
        }
    }));
}

// Normaliza la tabla "materia"
function normalizeSimple(rows) {
    return rows.map(r => ({
        id: r.id_materia ?? r.id,
        nombre: r.nombre_materia ?? r.nombre,
        semestre: r.semestre ?? undefined,
    }));
}
