// src/pages/Upload.jsx
import { useState, useEffect } from "react"
import { supabase } from "../supabase"

export default function Upload() {
    const [file, setFile] = useState(null)
    const [titulo, setTitulo] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [materiaId, setMateriaId] = useState("")
    const [materias, setMaterias] = useState([])
    const [creditos, setCreditos] = useState(1)
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState("")

    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("materia").select("id_materia, nombre_materia").order("nombre_materia")
            setMaterias(data || [])
        })()
    }, [])

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!file || !titulo || !materiaId) {
            setMsg("Falta título, materia o archivo.")
            return
        }
        setLoading(true); setMsg("")
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Debés iniciar sesión para subir.")

            const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin"
            const key = `user_${user.id}/${crypto.randomUUID()}.${ext}`

            const { error: upErr } = await supabase
                .storage
                .from("apuntes")
                .upload(key, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type || undefined
                })
            if (upErr) throw upErr

            const { error: insErr } = await supabase
                .from("apunte")
                .insert([{
                    titulo,
                    descripcion,
                    id_materia: Number(materiaId),
                    // ⚠️ Si tu apunte.id_usuario no es UUID de Auth, mapealo al esquema que uses.
                    id_usuario: user.id,
                    file_path: key,
                    file_name: file.name,
                    mime_type: file.type || null,
                    file_size: file.size,
                    creditos: Number(creditos) || 0,
                    estrellas: 0
                }])
            if (insErr) throw insErr

            setMsg("✅ Apunte subido con éxito.")
            setFile(null); setTitulo(""); setDescripcion(""); setMateriaId(""); setCreditos(1)
        } catch (err) {
            console.error(err)
            setMsg(`❌ ${err.message || "Error subiendo apunte"}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
            <h1>Subir apunte</h1>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                <input
                    type="text"
                    placeholder="Título"
                    value={titulo}
                    onChange={(e)=>setTitulo(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Descripción (opcional)"
                    value={descripcion}
                    onChange={(e)=>setDescripcion(e.target.value)}
                />

                <select value={materiaId} onChange={(e)=>setMateriaId(e.target.value)} required>
                    <option value="">Seleccioná la materia</option>
                    {materias.map(m => (
                        <option key={m.id_materia} value={m.id_materia}>{m.nombre_materia}</option>
                    ))}
                </select>

                <input
                    type="number"
                    min={0}
                    placeholder="Créditos (precio)"
                    value={creditos}
                    onChange={(e)=>setCreditos(e.target.value)}
                />

                <input
                    type="file"
                    onChange={(e)=> setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    required
                />

                <button disabled={loading} type="submit">
                    {loading ? "Subiendo..." : "Subir"}
                </button>
            </form>

            {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
        </div>
    )
}
