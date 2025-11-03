import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileAlt,
    faSpinner,
    faPlus,
    faHeart,
    faBook
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from "../supabase";
import ApunteCard from "../components/ApunteCard";

export default function MyPapers() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [totalLikes, setTotalLikes] = useState(0);
    const navigate = useNavigate();

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
            let totalLikesCount = 0;
            if (apIds.length > 0) {
                const { data: likesData } = await supabase
                    .from("likes")
                    .select("id_apunte")
                    .eq("tipo", "like")
                    .in("id_apunte", apIds);

                likesData?.forEach(like => {
                    likesCountMap[like.id_apunte] = (likesCountMap[like.id_apunte] || 0) + 1;
                    totalLikesCount++;
                });
            }
            setTotalLikes(totalLikesCount);

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
            <div style={{
                minHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 16,
                background: '#f8fafc'
            }}>
                <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    style={{ fontSize: 40, color: '#2563eb' }}
                />
                <p style={{
                    color: "#64748b",
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif'
                }}>
                    Cargando tus apuntes...
                </p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: 20,
            fontFamily: 'Inter, sans-serif',
            background: '#f8fafc',
            minHeight: '100vh'
        }}>
            {/* Header - Solo título y frase */}
            <header style={{
                marginBottom: 20,
                background: '#ffffff',
                padding: '20px',
                borderRadius: 16,
                border: '2px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 6
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FontAwesomeIcon
                            icon={faFileAlt}
                            style={{ fontSize: 18, color: '#fff' }}
                        />
                    </div>
                    <h1 style={{
                        margin: 0,
                        fontSize: 26,
                        fontWeight: 700,
                        color: '#13346b'
                    }}>
                        Mis Apuntes
                    </h1>
                </div>
                <p style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#64748b',
                    paddingLeft: 56
                }}>
                    Todos los apuntes que subiste a la plataforma
                </p>
            </header>

            {/* Estadísticas y Botón Subir */}
            <div style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '2px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '20px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20
            }}>
                {/* Estadísticas */}
                <div style={{
                    display: 'flex',
                    gap: 32,
                    alignItems: 'center'
                }}>
                    {/* Apuntes */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FontAwesomeIcon
                                icon={faBook}
                                style={{ fontSize: 20, color: '#2563eb' }}
                            />
                        </div>
                        <div>
                            <div style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#0f172a',
                                lineHeight: 1.2
                            }}>
                                {notes.length}
                            </div>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#64748b'
                            }}>
                                Apuntes
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                    <div style={{
                        width: 1,
                        height: 48,
                        background: '#e2e8f0'
                    }} />

                    {/* Likes */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FontAwesomeIcon
                                icon={faHeart}
                                style={{ fontSize: 20, color: '#f59e0b' }}
                            />
                        </div>
                        <div>
                            <div style={{
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#0f172a',
                                lineHeight: 1.2
                            }}>
                                {totalLikes}
                            </div>
                            <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#64748b'
                            }}>
                                Likes
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón Subir */}
                <button
                    onClick={() => navigate("/upload")}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1e40af';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} style={{ fontSize: 14 }} />
                    Subir apunte
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16
                    }}>
                        <span style={{
                            color: '#dc2626',
                            fontSize: 14,
                            fontWeight: 500
                        }}>
                            {error}
                        </span>
                        <button
                            onClick={loadNotes}
                            style={{
                                background: '#dc2626',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 16px',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {notes.length === 0 ? (
                <div style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: '80px 40px',
                    textAlign: 'center',
                    border: '2px solid #f1f5f9',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '24px',
                        background: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <FontAwesomeIcon
                            icon={faFileAlt}
                            style={{
                                fontSize: 48,
                                color: '#fff'
                            }}
                        />
                    </div>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        color: '#13346b',
                        fontSize: 28,
                        fontWeight: 700
                    }}>
                        No tenés apuntes todavía
                    </h3>
                    <p style={{
                        color: '#64748b',
                        margin: '0 0 32px 0',
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: 1.6,
                        maxWidth: 420,
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Comenzá a compartir tus conocimientos con la comunidad
                    </p>
                    <button
                        onClick={() => navigate("/upload")}
                        style={{
                            padding: '16px 32px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: 'Inter, sans-serif',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} style={{ fontSize: 16 }} />
                        Subir mi primer apunte
                    </button>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 20
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