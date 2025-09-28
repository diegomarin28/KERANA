import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUBJECTS } from "../data/subjects";
import TagInput from "../components/TagInput";
import FileDrop from "../components/FileDrop";

export default function Upload(){
    const nav = useNavigate();
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [desc, setDesc] = useState("");
    const [tags, setTags] = useState([]);
    const [visibility, setVisibility] = useState("public"); // public | private
    const [file, setFile] = useState(null);
    const [agree, setAgree] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const valid = title.trim() && subject && file && agree;

    const onSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        if(!valid) { setError("Completá los campos obligatorios y aceptá los términos."); return; }

        try {
            setSaving(true);

            // 🔹 HOY (sin backend): guardamos metadatos en localStorage para “simular”
            const id = crypto.randomUUID();
            const meta = {
                id, title, subject, desc, tags, visibility,
                // NOTA: el archivo real no se guarda en localStorage (solo metadatos)
                fileName: file.name, fileSize: file.size, createdAt: new Date().toISOString()
            };
            const prev = JSON.parse(localStorage.getItem("kerana_uploads") || "[]");
            localStorage.setItem("kerana_uploads", JSON.stringify([meta, ...prev]));

            // 🔌 MAÑANA (con API/Storage):
            // 1) Subir file a Storage (Supabase Storage / S3) => obtener URL
            // 2) POST /api/apuntes con { ...meta, fileUrl }
            // 3) Redirigir a la ficha del apunte / o a resultados
            // (dejamos el hook listo para enchufar la API en este lugar)

            alert("✅ Apunte cargado (simulado). Enchufamos API cuando esté lista.");
            nav(`/search?q=${encodeURIComponent(title)}`);
        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container" style={{ padding:"32px 16px 80px" }}>
            <h1 style={{ margin:"12px 0 4px", fontSize:"clamp(22px,3.4vw,32px)", color:"#0b2a7a" }}>
                Subir apunte
            </h1>
            <p style={{ margin:"0 0 18px", color:"#64748b" }}>
                Compartí tus apuntes con la comunidad. Completá los campos y subí el PDF.
            </p>

            <form onSubmit={onSubmit} style={{ display:"grid", gap:18, maxWidth:800 }}>
                {/* Título */}
                <div>
                    <label style={label}>Título *</label>
                    <input
                        value={title} onChange={e=>setTitle(e.target.value)}
                        placeholder="Ej: Resumen Parcial 1 - Base de Datos I"
                        style={input}
                    />
                </div>

                {/* Materia */}
                <div>
                    <label style={label}>Materia *</label>
                    <select value={subject} onChange={e=>setSubject(e.target.value)} style={input}>
                        <option value="">Seleccioná una materia</option>
                        {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {/* Descripción */}
                <div>
                    <label style={label}>Descripción</label>
                    <textarea
                        value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
                        placeholder="Breve descripción del contenido…"
                        style={{ ...input, resize:"vertical" }}
                    />
                </div>

                {/* Etiquetas */}
                <div>
                    <label style={label}>Etiquetas</label>
                    <TagInput value={tags} onChange={setTags} placeholder="Ej: parcial, normalización, SQL" />
                </div>

                {/* Archivo */}
                <div>
                    <label style={label}>Archivo PDF *</label>
                    <FileDrop file={file} onFile={(f)=>{
                        if(f && f.type !== "application/pdf"){ alert("Solo se admite PDF"); return; }
                        setFile(f);
                    }} />
                </div>

                {/* Visibilidad */}
                <div>
                    <label style={label}>Visibilidad</label>
                    <div style={{ display:"flex", gap:12 }}>
                        <label style={radio}>
                            <input type="radio" name="vis" value="public" checked={visibility==="public"} onChange={()=>setVisibility("public")} />
                            Público
                        </label>
                        <label style={radio}>
                            <input type="radio" name="vis" value="private" checked={visibility==="private"} onChange={()=>setVisibility("private")} />
                            Privado
                        </label>
                    </div>
                </div>

                {/* Términos */}
                <label style={{ display:"flex", gap:10, alignItems:"center", color:"#334155" }}>
                    <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
                    Declaro que el contenido es mío o tengo permiso para compartirlo y cumple las reglas de la comunidad.
                </label>

                {/* Error */}
                {error ? <div style={{ color:"#b91c1c", fontWeight:700 }}>{error}</div> : null}

                {/* Acciones */}
                <div style={{ display:"flex", gap:10 }}>
                    <button className="btn-primary" type="submit" disabled={!valid || saving}>
                        {saving ? "Subiendo…" : "Publicar apunte"}
                    </button>
                    <button type="button" onClick={()=>nav(-1)} style={btnGhost}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

const label = { display:"block", fontSize:14, color:"#475569", marginBottom:6, fontWeight:700 };
const input = {
    width:"100%", height:44, border:"1px solid var(--border)", borderRadius:12,
    padding:"0 12px", outline:"none", background:"#fff"
};
const radio = { display:"inline-flex", gap:8, alignItems:"center", padding:"6px 10px", border:"1px solid var(--border)", borderRadius:9999 };
const btnGhost = {
    height:54, padding:"0 22px", borderRadius:9999, border:"1px solid var(--border)",
    background:"#fff", fontWeight:700, cursor:"pointer"
};
