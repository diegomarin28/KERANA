import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"

export default function My_papers() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [notes, setNotes] = useState([])
    const [materias, setMaterias] = useState([])
    const [page, setPage] = useState(1)
    const pageSize = 12

    const pagedNotes = useMemo(() => {
        const start = (page - 1) * pageSize
        return notes.slice(start, start + pageSize)
    }, [notes, page])

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        setError("")
        try {
            // Sesión
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setNotes([])
                setMaterias([])
                setLoading(false)
                return
            }

            // Materias (para mapear el nombre)
            const { data: matData, error: mErr } = await supabase
                .from("materia")
                .select("id_materia, nombre_materia")
                .order("nombre_materia", { ascending: true })
            if (mErr) throw mErr

            // Mis apuntes
            const { data: apData, error: aErr } = await supabase
                .from("apunte")
                .select("id_apunte, titulo, descripcion, id_materia, file_path, file_name, mime_type, file_size, created_at, creditos, estrellas")
                .eq("id_usuario", user.id)         // si tu columna no guarda UUID de Auth, ajustá este filtro a tu esquema
                .order("created_at", { ascending: false })
            if (aErr) throw aErr

            setMaterias(matData || [])
            setNotes(apData || [])
            setPage(1)
        } catch (e) {
            console.error(e)
            setError("No se pudieron cargar tus apuntes.")
        } finally {
            setLoading(false)
        }
    }

    const materiaNombre = (id_materia) => {
        const m = materias.find(x => x.id_materia === id_materia)
        return m?.nombre_materia || "Materia"
    }

    async function handleDownload(file_path) {
        try {
            // Verificamos sesión
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Iniciá sesión para descargar.")

            // Signed URL 60s
            const { data, error } = await supabase
                .storage
                .from("apuntes")
                .createSignedUrl(file_path, 60)
            if (error) throw error

            window.open(data.signedUrl, "_blank")
        } catch (e) {
            alert(e.message || "No se pudo descargar el apunte.")
        }
    }

    async function handleDelete(note) {
        if (!confirm("¿Eliminar este apunte? Esta acción no se puede deshacer.")) return
        try {
            // Borra en DB
            const { error: delErr } = await supabase
                .from("apunte")
                .delete()
                .eq("id_apunte", note.id_apunte)
            if (delErr) throw delErr

            // Borra en Storage (si el archivo existía)
            if (note.file_path) {
                const { error: stErr } = await supabase
                    .storage
                    .from("apuntes")
                    .remove([note.file_path])
                if (stErr) {
                    // Si falla el remove del storage, no rompemos el flujo: ya se eliminó el registro.
                    console.warn("No se pudo eliminar del Storage:", stErr.message)
                }
            }

            // Actualizar lista local
            setNotes(prev => prev.filter(n => n.id_apunte !== note.id_apunte))
        } catch (e) {
            console.error(e)
            alert(e.message || "No se pudo eliminar el apunte.")
        }
    }

    function formatBytes(bytes) {
        const b = Number(bytes)
        if (!isFinite(b) || b < 0) return "0 B"
        const units = ["B", "KB", "MB", "GB"]
        let i = 0, v = b
        while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
        return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`
    }

    function shortMime(m) {
        if (!m) return ""
        if (m.includes("pdf")) return "PDF"
        if (m.includes("wordprocessingml")) return "DOCX"
        if (m.includes("msword")) return "DOC"
        if (m.includes("presentationml")) return "PPTX"
        if (m.includes("powerpoint")) return "PPT"
        return m.split("/")[1]?.toUpperCase?.() || m
    }

    if (loading) {
        return (
            <div style={{ padding: 24, textAlign: "center" }}>
                <p>Cargando tus apuntes…</p>
            </div>
        )
    }

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#f8f9fa", padding: 24, borderRadius: 12, marginBottom: 24, textAlign: "center", border: "1px solid #e5e7eb" }}>
                <h1 style={{ margin: 0 }}>Mis apuntes</h1>
                <p style={{ color: "#6b7280", marginTop: 6 }}>Apuntes que subiste con tu cuenta</p>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div />
                <div style={{ display: "flex", gap: 8 }}>
                    <a href="/upload" style={btnPrimaryLink}>Subir apunte</a>
                    <button onClick={loadData} style={btnLight}>Actualizar</button>
                </div>
            </div>

            {error && (
                <div style={{ color: "#b91c1c", backgroundColor: "#fef2f2", padding: 12, borderRadius: 8, border: "1px solid #fecaca", marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                    <h3 style={{ marginBottom: 8, color: "#374151" }}>No tenés apuntes todavía</h3>
                    <p style={{ color: "#6b7280", marginBottom: 16 }}>Subí tu primer apunte para verlo listado aquí.</p>
                    <a href="/upload" style={btnPrimaryLink}>Subir apunte</a>
                </div>
            ) : (
                <>
                    {/* Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                        {pagedNotes.map(note => (
                            <div key={note.id_apunte} style={card}>
                                <div style={headerRow}>
                                    <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{note.titulo || note.file_name}</h3>
                                    <span style={pill}>{materiaNombre(note.id_materia)}</span>
                                </div>

                                {note.descripcion && (
                                    <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>
                                        {note.descripcion.length > 140 ? note.descripcion.slice(0, 140) + "…" : note.descripcion}
                                    </p>
                                )}

                                <div style={metaRow}>
                                    <span><strong>Créditos:</strong> {Number(note.creditos) || 0}</span>
                                    <span><strong>Estrellas:</strong> {isFinite(Number(note.estrellas)) ? Number(note.estrellas).toFixed(1) : "—"}</span>
                                    <span><strong>Tipo:</strong> {shortMime(note.mime_type)}</span>
                                    <span><strong>Tamaño:</strong> {formatBytes(note.file_size)}</span>
                                    {note.created_at && (
                                        <span><strong>Fecha:</strong> {new Date(note.created_at).toLocaleDateString()}</span>
                                    )}
                                </div>

                                <div style={actionsRow}>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(note.file_path)}
                                        style={btnPrimary}
                                    >
                                        Descargar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(note)}
                                        style={btnDanger}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación simple */}
                    {notes.length > pageSize && (
                        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{ ...btnLight, opacity: page === 1 ? 0.6 : 1 }}
                            >
                                Anterior
                            </button>
                            <div style={{ alignSelf: "center" }}>
                                Página {page} de {Math.ceil(notes.length / pageSize)}
                            </div>
                            <button
                                disabled={page >= Math.ceil(notes.length / pageSize)}
                                onClick={() => setPage(p => Math.min(Math.ceil(notes.length / pageSize), p + 1))}
                                style={{ ...btnLight, opacity: page >= Math.ceil(notes.length / pageSize) ? 0.6 : 1 }}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

/* ===== Styles ===== */

const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    display: "grid",
    gap: 8
}

const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
}

const pill = {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
    whiteSpace: "nowrap"
}

const metaRow = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    color: "#374151",
    fontSize: 14,
    marginTop: 6
}

const actionsRow = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 8
}

const btnBase = {
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    cursor: "pointer",
    fontWeight: 600
}

const btnPrimary = { ...btnBase, background: "#2563eb", color: "#fff", borderColor: "#1e40af" }
const btnDanger  = { ...btnBase, background: "#ef4444", color: "#fff", borderColor: "#dc2626" }
const btnLight   = { ...btnBase, background: "#fff", color: "#111827", border: "1px solid #e5e7eb" }
const btnPrimaryLink = { ...btnPrimary, textDecoration: "none", display: "inline-block" }
