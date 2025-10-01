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

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtener el usuario actual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (!user) {
                setError("Debes iniciar sesión para ver tus apuntes");
                return;
            }

            console.log("Usuario ID:", user.id);

            // Primero intentemos obtener el ID de usuario numérico
            const { data: usuarioData, error: usuarioError } = await supabase
                .from('usuario')
                .select('id_usuario')
                .eq('correo', user.email)
                .maybeSingle();

            let userId = user.id;

            // Si tenemos el ID numérico, usarlo
            if (usuarioData?.id_usuario) {
                userId = usuarioData.id_usuario;
            }

            console.log("Buscando apuntes para usuario:", userId);

            // Intentar diferentes consultas
            let data = [];
            let notesError = null;

            // Intento 1: Con usuario_id numérico
            const result1 = await supabase
                .from('apunte')
                .select(`
                    *,
                    materias (nombre)
                `)
                .eq('usuario_id', userId)
                .order('created_at', { ascending: false });

            if (result1.error) {
                console.log("Error con usuario_id:", result1.error);

                // Intento 2: Con id_usuario (numérico)
                const result2 = await supabase
                    .from('apunte')
                    .select(`
                        *,
                        materias (nombre)
                    `)
                    .eq('id_usuario', usuarioData?.id_usuario)
                    .order('created_at', { ascending: false });

                if (result2.error) {
                    console.log("Error con id_usuario:", result2.error);

                    // Intento 3: Buscar todos los apuntes (para debug)
                    const result3 = await supabase
                        .from('apunte')
                        .select('*')
                        .limit(5);

                    if (result3.error) {
                        notesError = result3.error;
                    } else {
                        data = result3.data || [];
                        console.log("Apuntes encontrados (todos):", data);
                    }
                } else {
                    data = result2.data || [];
                }
            } else {
                data = result1.data || [];
            }

            if (notesError) throw notesError;

            console.log("Apuntes cargados:", data);
            setNotes(data);

        } catch (err) {
            console.error("Error loading notes:", err);
            setError(err.message || "Error cargando apuntes");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noteId) => {
        if (!confirm("¿Estás seguro de que querés eliminar este apunte?")) return;

        try {
            setDeletingId(noteId);
            const { error } = await supabase
                .from('apunte')
                .delete()
                .eq('id_apunte', noteId);

            if (error) throw error;

            // Remove from local state
            setNotes(prev => prev.filter(note => note.id_apunte !== noteId));
        } catch (err) {
            console.error("Error deleting note:", err);
            alert("Error eliminando apunte: " + err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = (note) => {
        if (note?.url_archivo) {
            window.open(note.url_archivo, '_blank');
        } else {
            alert("No hay archivo disponible para descargar");
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16
            }}>
                <div style={{
                    width: 40,
                    height: 40,
                    border: "3px solid #f3f4f6",
                    borderTop: "3px solid #2563eb",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#6b7280", margin: 0 }}>Cargando tus apuntes…</p>
            </div>
        );
    }

    return (
        <div style={{
            width: "min(800px, 92vw)",
            margin: "0 auto",
            padding: "32px 0"
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24
            }}>
                <div>
                    <h1 style={{ margin: "0 0 8px 0" }}>Mis Apuntes</h1>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                        {notes.length} apunte{notes.length !== 1 ? 's' : ''} subido{notes.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => window.location.href = "/upload"}
                >
                    Subir apunte
                </Button>
            </div>

            {error && (
                <Card style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "16px 20px",
                    marginBottom: 20
                }}>
                    <p style={{ margin: 0 }}>{error}</p>
                    <Button
                        variant="ghost"
                        onClick={loadNotes}
                        style={{ marginTop: 12 }}
                    >
                        Reintentar
                    </Button>
                </Card>
            )}

            {notes.length === 0 ? (
                <Card style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    background: "#fafafa"
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ margin: "0 0 12px 0", color: "#374151" }}>
                        No tenés apuntes todavía
                    </h3>
                    <p style={{ color: "#6b7280", margin: "0 0 24px 0" }}>
                        Comenzá a compartir tus conocimientos con la comunidad
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => window.location.href = "/upload"}
                    >
                        Subir mi primer apunte
                    </Button>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {notes.map(note => (
                        <Card
                            key={note.id_apunte}
                            style={{
                                padding: 20,
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                background: "#fff",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,.08)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 16
                            }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        margin: "0 0 8px 0",
                                        color: "#111827",
                                        fontSize: 18
                                    }}>
                                        {note.titulo || 'Apunte sin título'}
                                    </h3>

                                    <div style={{
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                        marginBottom: 12,
                                        flexWrap: "wrap"
                                    }}>
                                        {note.materias?.nombre && (
                                            <Chip tone="blue">{note.materias.nombre}</Chip>
                                        )}
                                        <Chip tone="green">{note.creditos || 0} créditos</Chip>
                                        {note.tipo_archivo && (
                                            <Chip tone="gray">{note.tipo_archivo}</Chip>
                                        )}
                                    </div>

                                    {note.descripcion && (
                                        <p style={{
                                            color: "#6b7280",
                                            margin: "0 0 12px 0",
                                            fontSize: 14,
                                            lineHeight: 1.5
                                        }}>
                                            {note.descripcion}
                                        </p>
                                    )}

                                    <div style={{
                                        display: "flex",
                                        gap: 12,
                                        fontSize: 12,
                                        color: "#9ca3af"
                                    }}>
                                        <span>Subido: {new Date(note.created_at).toLocaleDateString()}</span>
                                        {note.tamaño_archivo && (
                                            <span>• {note.tamaño_archivo}</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    display: "flex",
                                    gap: 8,
                                    flexShrink: 0
                                }}>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleDownload(note)}
                                        disabled={!note.url_archivo}
                                    >
                                        Descargar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleDelete(note.id_apunte)}
                                        disabled={deletingId === note.id_apunte}
                                        style={{
                                            color: "#ef4444",
                                            borderColor: "#ef4444"
                                        }}
                                    >
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