import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Button } from "../components/UI/Button";
import { Card } from "../components/UI/Card";
import ApunteCard from "../components/ApunteCard";

export default function MyPapers() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

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

            // Obtener likes count
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

            // Obtener signed URLs
            const notesWithData = await Promise.all((data || []).map(async (note) => {
                let signedUrl = null;
                if (note.file_path) {
                    try {
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from("apuntes")
                            .createSignedUrl(note.file_path, 3600);
                        if (!signedError && signedData) {
                            signedUrl = signedData.signedUrl;
                        } else if (signedError) {
                            console.warn(`⚠️ Archivo no encontrado para apunte ${note.id_apunte}:`, note.file_path);
                        }
                    } catch (err) {
                        console.warn(`⚠️ Error obteniendo URL para apunte ${note.id_apunte}:`, err);
                    }
                }

                return {
                    ...note,
                    likes_count: likesCountMap[note.id_apunte] || 0,
                    signedUrl
                };
            }));

            setNotes(notesWithData);
        } catch (err) {
            setError(err.message || "Error cargando tus apuntes");
        } finally {
            setLoading(false);
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
                        <ApunteCard
                            key={note.id_apunte}
                            note={note}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}