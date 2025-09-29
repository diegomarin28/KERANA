import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUBJECTS } from "../data/subjects";
import TagInput from "../components/TagInput";
import FileDrop from "../components/FileDrop";
import { Button } from "../components/ui/Button";

export default function Upload(){
    const nav = useNavigate();
    const [title,setTitle] = useState("");
    const [subject,setSubject] = useState("");
    const [desc,setDesc] = useState("");
    const [tags,setTags] = useState([]);
    const [visibility,setVisibility] = useState("public");
    const [file,setFile] = useState(null);
    const [agree,setAgree] = useState(false);
    const [saving,setSaving] = useState(false);
    const [error,setError] = useState("");

    const valid = title.trim() && subject && file && agree;

    const onSubmit = (e)=>{
        e.preventDefault();
        if(!valid){ setError("Completá los campos obligatorios."); return; }
        alert("✅ Apunte cargado (simulado)");
        nav(`/search?q=${encodeURIComponent(title)}`);
    }

    return (
        <div className="container" style={{ padding:"32px 16px 80px", maxWidth:800, margin:"0 auto" }}>
            <h1 style={{ margin:"12px 0 4px" }}>Subir apunte</h1>
            <p style={{ color:"var(--muted)" }}>Compartí tus apuntes con la comunidad. Completá los campos y subí el PDF.</p>

            <form onSubmit={onSubmit} style={{ display:"grid", gap:18 }}>
                <div>
                    <label>Título *</label>
                    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej: Resumen Parcial 1 - Base de Datos I" style={input}/>
                </div>

                <div>
                    <label>Materia *</label>
                    <select value={subject} onChange={e=>setSubject(e.target.value)} style={input}>
                        <option value="">Seleccioná una materia</option>
                        {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div>
                    <label>Descripción</label>
                    <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} style={{...input,resize:"vertical"}}/>
                </div>

                <div>
                    <label>Etiquetas</label>
                    <TagInput value={tags} onChange={setTags}/>
                </div>

                <div>
                    <label>Archivo PDF *</label>
                    <FileDrop file={file} onFile={(f)=>setFile(f)}/>
                </div>

                <div>
                    <label>Visibilidad</label>
                    <div style={{ display:"flex",gap:12 }}>
                        <label><input type="radio" checked={visibility==="public"} onChange={()=>setVisibility("public")}/> Público</label>
                        <label><input type="radio" checked={visibility==="private"} onChange={()=>setVisibility("private")}/> Privado</label>
                    </div>
                </div>

                <label>
                    <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)}/> Confirmo que tengo derecho a compartir este apunte.
                </label>

                {error && <div style={{color:"crimson"}}>{error}</div>}

                <div style={{ display:"flex", gap:10 }}>
                    <Button type="submit" variant="primary" disabled={!valid||saving}>
                        {saving? "Subiendo…" : "Publicar apunte"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={()=>nav(-1)}>Cancelar</Button>
                </div>
            </form>
        </div>
    )
}

const input={width:"100%",height:44,border:"1px solid var(--border)",borderRadius:12,padding:"0 12px",background:"#fff"}
