import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subjectsAPI } from "../api/Database";
import TagInput from "../components/TagInput";
import FileDrop from "../components/FileDrop";

export default function Upload(){
    const nav = useNavigate();
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [desc, setDesc] = useState("");
    const [tags, setTags] = useState([]);
    const [visibility, setVisibility] = useState("public");
    const [file, setFile] = useState(null);
    const [agree, setAgree] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    // Cargar materias reales de la BD
    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setLoadingSubjects(true);
        try {
            const { data, error } = await subjectsAPI.getAllSubjects();
            if (error) {
                console.error('Error cargando materias:', error.message);
                setError('Error cargando las materias disponibles');
            } else {
                setSubjects(data || []);
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Error conectando con la base de datos');
        }
        setLoadingSubjects(false);
    };

    const valid = title.trim() && subject && file && agree;

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if(!valid) {
            setError("Completa los campos obligatorios y acepta los términos.");
            return;
        }

        try {
            setSaving(true);

            // TODO: Cuando tengamos API de apuntes, cambiar esto:
            // const { data, error } = await notesAPI.createNote({
            //     titulo: title,
            //     descripcion: desc,
            //     materia_id: subject,
            //     tags: tags,
            //     visibilidad: visibility,
            //     archivo: file
            // });

            // Por ahora, simulamos con localStorage
            const id = crypto.randomUUID();
            const meta = {
                id,
                titulo: title,
                materia_id: subject,
                descripcion: desc,
                tags,
                visibilidad: visibility,
                fileName: file.name,
                fileSize: file.size,
                createdAt: new Date().toISOString(),
                // Buscar nombre de materia para mostrar
                materiaNombre: subjects.find(s => s.id === subject)?.nombre || 'Materia'
            };

            const prev = JSON.parse(localStorage.getItem("kerana_uploads") || "[]");
            localStorage.setItem("kerana_uploads", JSON.stringify([meta, ...prev]));

            alert("✅ Apunte cargado (simulado). Próximamente con API real.");
            nav(`/search?q=${encodeURIComponent(title)}`);

        } catch (err) {
            console.error(err);
            setError("Ocurrió un error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    if (loadingSubjects) {
        return (
            <div className="container" style={{ padding:"32px 16px 80px", textAlign: 'center' }}>
                <p>Cargando materias disponibles...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding:"32px 16px 80px" }}>
            <h1 style={{ margin:"12px 0 4px", fontSize:"clamp(22px,3.4vw,32px)", color:"#0b2a7a" }}>
                Subir apunte
            </h1>
            <p style={{ margin:"0 0 18px", color:"#64748b" }}>
                Comparte tus apuntes con la comunidad. Completa los campos y sube el PDF.
            </p>

            <form onSubmit={onSubmit} style={{ display:"grid", gap:18, maxWidth:800 }}>
                {/* Título */}
                <div>
                    <label style={label}>Título *</label>
                    <input
                        value={title}
                        onChange={e=>setTitle(e.target.value)}
                        placeholder="Ej: Resumen Parcial 1 - Base de Datos I"
                        style={input}
                    />
                </div>

                {/* Materia - Con datos reales */}
                <div>
                    <label style={label}>Materia *</label>
                    <select
                        value={subject}
                        onChange={e=>setSubject(e.target.value)}
                        style={input}
                    >
                        <option value="">Selecciona una materia</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                    </select>
                    {subjects.length === 0 && (
                        <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                            No se pudieron cargar las materias
                        </p>
                    )}
                </div>

                {/* Descripción */}
                <div>
                    <label style={label}>Descripción</label>
                    <textarea
                        value={desc}
                        onChange={e=>setDesc(e.target.value)}
                        rows={4}
                        placeholder="Breve descripción del contenido..."
                        style={{ ...input, resize:"vertical" }}
                    />
                </div>

                {/* Etiquetas */}
                <div>
                    <label style={label}>Etiquetas</label>
                    <TagInput
                        value={tags}
                        onChange={setTags}
                        placeholder="Ej: parcial, normalización, SQL"
                    />
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                        Agrega palabras clave para que otros encuentren tu apunte fácilmente
                    </p>
                </div>

                {/* Archivo */}
                <div>
                    <label style={label}>Archivo PDF *</label>
                    <FileDrop
                        file={file}
                        onFile={(f)=>{
                            if(f && f.type !== "application/pdf"){
                                alert("Solo se admite PDF");
                                return;
                            }
                            setFile(f);
                        }}
                    />
                </div>

                {/* Visibilidad */}
                <div>
                    <label style={label}>Visibilidad</label>
                    <div style={{ display:"flex", gap:12 }}>
                        <label style={radio}>
                            <input
                                type="radio"
                                name="vis"
                                value="public"
                                checked={visibility==="public"}
                                onChange={()=>setVisibility("public")}
                            />
                            Público (todos pueden verlo)
                        </label>
                        <label style={radio}>
                            <input
                                type="radio"
                                name="vis"
                                value="private"
                                checked={visibility==="private"}
                                onChange={()=>setVisibility("private")}
                            />
                            Privado (solo yo)
                        </label>
                    </div>
                </div>

                {/* Términos */}
                <label style={{ display:"flex", gap:10, alignItems:"center", color:"#334155" }}>
                    <input
                        type="checkbox"
                        checked={agree}
                        onChange={e=>setAgree(e.target.checked)}
                    />
                    Declaro que el contenido es mío o tengo permiso para compartirlo y cumple las reglas de la comunidad.
                </label>

                {/* Error */}
                {error ? (
                    <div style={{
                        color:"#b91c1c",
                        fontWeight:700,
                        padding: '10px',
                        backgroundColor: '#fef2f2',
                        borderRadius: '8px',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                ) : null}

                {/* Acciones */}
                <div style={{ display:"flex", gap:10 }}>
                    <button
                        className="btn-primary"
                        type="submit"
                        disabled={!valid || saving}
                        style={{
                            opacity: (!valid || saving) ? 0.7 : 1,
                            cursor: (!valid || saving) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {saving ? "Subiendo..." : "Publicar apunte"}
                    </button>
                    <button
                        type="button"
                        onClick={()=>nav(-1)}
                        style={btnGhost}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                </div>

                {/* Info adicional */}
                <div style={{
                    backgroundColor: '#f0f9ff',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd',
                    fontSize: '14px',
                    color: '#0c4a6e'
                }}>
                    <strong>Próximamente:</strong> Subida real de archivos, sistema de moderación y notificaciones automáticas cuando publiques tu apunte.
                </div>
            </form>
        </div>
    );
}

const label = {
    display:"block",
    fontSize:14,
    color:"#475569",
    marginBottom:6,
    fontWeight:700
};

const input = {
    width:"100%",
    height:44,
    border:"1px solid var(--border)",
    borderRadius:12,
    padding:"0 12px",
    outline:"none",
    background:"#fff"
};

const radio = {
    display:"inline-flex",
    gap:8,
    alignItems:"center",
    padding:"6px 10px",
    border:"1px solid var(--border)",
    borderRadius:9999,
    cursor: "pointer"
};

const btnGhost = {
    height:54,
    padding:"0 22px",
    borderRadius:9999,
    border:"1px solid var(--border)",
    background:"#fff",
    fontWeight:700,
    cursor:"pointer"
};