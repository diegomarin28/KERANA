// src/pages/MyPapers.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";

export default function MyPapers() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { loadNotes(); }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) { setError("Debes iniciar sesión para ver tus apuntes"); return; }

            // ✅ RLS: select por auth_id
            const { data: usuarioData, error: usuarioError } = await supabase
                .from("usuario")
                .select("id_usuario, nombre")
                .eq("auth_id", user.id)
                .maybeSingle();
            if (usuarioError) throw usuarioError;
            if (!usuarioData) { setError("No se encontró tu perfil de usuario"); return; }

            const { data, error: notesError } = await supabase
                .from("apunte")
                .select(`
          id_apunte,
          titulo,
          descripcion,
          creditos,
          estrellas,
          created_at,
          id_materia,
          file_path,
          file_name,
          mime_type,
          file_size,
          materia:materia!Apunte_id_materia_fkey (
          id_materia,
          nombre_materia
         )
        `)
                .eq("id_usuario", usuarioData.id_usuario)
                .order("created_at", { ascending: false });
            if (notesError) throw notesError;

            setNotes(data || []);
        } catch (err) {
            setError(err.message || "Error cargando tus apuntes");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!confirm("¿Estás seguro de que querés eliminar este apunte?")) return;
        try {
            setDeletingId(noteId);
            const { error } = await supabase.from("apunte").delete().eq("id_apunte", noteId);
            if (error) throw error;
            setNotes((prev) => prev.filter((note) => note.id_apunte !== noteId));
        } catch (err) {
            alert("Error eliminando apunte: " + (err.message || err));
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = (note) => {
        if (note?.file_path) window.open(note.file_path, "_blank");
        else alert("No hay archivo disponible para descargar");
    };

    if (loading) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                <div style={{ width: 40, height: 40, border: "3px solid #f3f4f6", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando tus apuntes…</p>
            </div>
        );
    }

    return (
        <div style={{ width: "min(800px, 92vw)", margin: "0 auto", padding: "32px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: "0 0 8px 0" }}>Mis Apuntes</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                        {notes.length} apunte{notes.length !== 1 ? "s" : ""} subido{notes.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button variant="primary" onClick={() => (window.location.href = "/upload")}>Subir apunte</Button>
            </div>

            {error && (
                <Card style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "16px 20px", marginBottom: 20 }}>
                    <p style={{ margin: 0 }}>{error}</p>
                    <Button variant="ghost" onClick={loadNotes} style={{ marginTop: 12 }}>Reintentar</Button>
                </Card>
            )}

            {notes.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>No tenés apuntes todavía</h3>
                    <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>Comenzá a compartir tus conocimientos con la comunidad</p>
                    <Button variant="primary" onClick={() => (window.location.href = "/upload")}>Subir mi primer apunte</Button>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {notes.map((note) => (
                        <Card key={note.id_apunte} style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", transition: "all 0.2s ease" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: 18 }}>{note.titulo || "Apunte sin título"}</h3>

                                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                                        {note.materia?.nombre_materia && <Chip tone="blue">{note.materia.nombre_materia}</Chip>}
                                        <Chip tone="green">{note.creditos || 0} créditos</Chip>
                                        {note.mime_type && <Chip tone="gray">{note.mime_type}</Chip>}
                                    </div>

                                    {note.descripcion && (
                                        <p style={{ color: "#6b7280", margin: "0 0 12px 0", fontSize: 14, lineHeight: 1.5 }}>{note.descripcion}</p>
                                    )}

                                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#9ca3af" }}>
                                        <span>Subido: {new Date(note.created_at).toLocaleDateString()}</span>
                                        {note.file_size && <span>• {Math.round(note.file_size / 1024)} KB</span>}
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    <Button variant="primary" onClick={() => handleDownload(note)} disabled={!note.file_path}>Descargar</Button>
                                    <Button variant="ghost" onClick={() => handleDelete(note.id_apunte)} disabled={deletingId === note.id_apunte} style={{ color: "#ef4444", borderColor: "#ef4444" }}>
                                        {deletingId === note.id_apunte ? "Eliminando..." : "Eliminar"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
