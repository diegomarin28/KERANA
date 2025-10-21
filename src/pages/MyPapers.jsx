import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import ApunteCard from "../components/ApunteCard";
import PDFThumbnail from "../components/PDFThumbnail"; // si no existe, no importa, puedo ayudarte a generarlo

export default function MyPapers() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [signedUrls, setSignedUrls] = useState({});
    const [currentUserId, setCurrentUserId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { loadNotes(); }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                setError("Debes iniciar sesión para ver tus apuntes");
                return;
            }

            const { data: usuarioData, error: usuarioError } = await supabase
                .from("usuario")
                .select("id_usuario, nombre")
                .eq("auth_id", user.id)
                .maybeSingle();

            if (usuarioError) throw usuarioError;
            if (!usuarioData) {
                setError("No se encontró tu perfil de usuario");
                return;
            }

            setCurrentUserId(usuarioData.id_usuario);

            // ✅ Tu lógica de thumbnail_path + datos ampliados de Kerana
            const { data, error: notesError } = await supabase
                .from("apunte")
                .select(`
          id_apunte,
          id_usuario,
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
          thumbnail_path,
          usuario:id_usuario(nombre),
          materia:id_materia(nombre_materia)
        `)
                .eq("id_usuario", usuarioData.id_usuario)
                .order("created_at", { ascending: false });

            if (notesError) throw notesError;

            // likes
            const apIds = (data || []).map(n => n.id_apunte);
            let likesCountMap = {};
            if (apIds.length > 0) {
                const { data: likesData } = await supabase
                    .from("likes")
                    .select("id_apunte")
                    .eq("tipo", "like")
                    .in("id_apunte", apIds);

                likesData?.forEach(like => {
                    likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
                });
            }

            const notesWithLikes = (data || []).map(note => ({
                ...note,
                likes_count: likesCountMap[note.id_apunte] || 0,
            }));

            setNotes(notesWithLikes);

            // signed URLs
            if (data && data.length > 0) {
                const urls = {};
                for (const note of data) {
                    if (note.file_path) {
                        const { data: signedData } = await supabase.storage
                            .from("apuntes")
                            .createSignedUrl(note.file_path, 3600);
                        if (signedData) urls[note.id_apunte] = signedData.signedUrl;
                    }
                }
                setSignedUrls(urls);
            }
        } catch (err) {
            setError(err.message || "Error cargando tus apuntes");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (note) => {
        try {
            if (!note.file_path) return;
            const { data, error } = await supabase.storage
                .from("apuntes")
                .download(note.file_path);
            if (error) throw error;

            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = note.file_name || "apunte.pdf";
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error al descargar:", err);
            alert("Error al descargar el apunte");
        }
    };

    const handleDelete = async (id_apunte) => {
        if (!window.confirm("¿Seguro que querés eliminar este apunte?")) return;
        try {
            setDeletingId(id_apunte);
            await supabase.from("apunte").delete().eq("id_apunte", id_apunte);
            setNotes(prev => prev.filter(n => n.id_apunte !== id_apunte));
        } catch (err) {
            console.error(err);
            alert("Error eliminando el apunte");
        } finally {
            setDeletingId(null);
        }
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
        <div style={{ width: "min(1200px, 92vw)", margin: "0 auto", padding: "32px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ margin: "0 0 8px 0" }}>Mis Apuntes</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                        {notes.length} apunte{notes.length !== 1 ? "s" : ""} subido{notes.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button variant="primary" onClick={() => (window.location.href = "/upload")}>
                    Subir apunte
                </Button>
            </div>

            {error && (
                <Card style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "16px 20px", marginBottom: 20 }}>
                    <p style={{ margin: 0 }}>{error}</p>
                    <Button variant="ghost" onClick={loadNotes} style={{ marginTop: 12 }}>
                        Reintentar
                    </Button>
                </Card>
            )}

            {notes.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "48px 24px", background: "#fafafa" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>No tenés apuntes todavía</h3>
                    <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                        Comenzá a compartir tus conocimientos con la comunidad
                    </p>
                    <Button variant="primary" onClick={() => (window.location.href = "/upload")}>
                        Subir mi primer apunte
                    </Button>
                </Card>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 24
                }}>
                    {notes.map((note) => (
                        <Card key={note.id_apunte} style={{
                            padding: 0,
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            background: "#fff",
                            transition: "all 0.2s ease",
                            overflow: "hidden"
                        }}>
                            <div style={{ display: "flex", gap: 0 }}>
                                <PDFThumbnail
                                    url={signedUrls[note.id_apunte] || null}
                                    thumbnailPath={note.thumbnail_path}
                                    width={180}
                                    height={240}
                                />
                                <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: 18 }}>
                                            {note.titulo || "Apunte sin título"}
                                        </h3>

                                        {note.materia?.nombre_materia && (
                                            <p style={{ color: "#2563eb", fontSize: 14, marginBottom: 4 }}>
                                                {note.materia.nombre_materia}
                                            </p>
                                        )}

                                        <p style={{ color: "#6b7280", margin: "0 0 12px 0", fontSize: 14 }}>
                                            {note.descripcion || "Sin descripción"}
                                        </p>

                                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#9ca3af" }}>
                                            <span>⭐ {note.estrellas || 0}</span>
                                            <span>💬 {note.likes_count || 0}</span>
                                            <span>📅 {new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                                        <Button variant="primary" onClick={() => handleDownload(note)}>
                                            Descargar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDelete(note.id_apunte)}
                                            disabled={deletingId === note.id_apunte}
                                            style={{ color: "#ef4444", borderColor: "#ef4444" }}
                                        >
                                            {deletingId === note.id_apunte ? "Eliminando..." : "Eliminar"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
