import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function PDFThumbnail({
                                         url,
                                         thumbnailPath, // 🆕 Recibe el path del thumbnail pre-generado
                                         width = 180,
                                         height = 240
                                     }) {
    const [thumbnail, setThumbnail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadThumbnail();
    }, [thumbnailPath, url]);

    const loadThumbnail = async () => {
        try {
            setLoading(true);
            setError(false);

            // Si tenemos thumbnail pre-generado, usarlo
            if (thumbnailPath) {
                const { data } = supabase.storage
                    .from('thumbnails')
                    .getPublicUrl(thumbnailPath);

                if (data?.publicUrl) {
                    setThumbnail(data.publicUrl);
                    setLoading(false);
                    return;
                }
            }

            // Si no hay thumbnail, mostrar placeholder
            // (ya no generamos thumbnail on-the-fly para ahorrar Egress)
            setLoading(false);

        } catch (err) {
            console.error("Error cargando thumbnail:", err);
            setError(true);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    width,
                    height,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    borderRadius: 8,
                }}
            >
                <div
                    style={{
                        width: 24,
                        height: 24,
                        border: "3px solid #e5e7eb",
                        borderTop: "3px solid #2563eb",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
            </div>
        );
    }

    if (error || !thumbnail) {
        return (
            <div
                style={{
                    width,
                    height,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    flexShrink: 0,
                    borderRadius: 8,
                }}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <div style={{ fontSize: 48 }}>📄</div>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        opacity: 0.9
                    }}>
                        PDF
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                width,
                height,
                flexShrink: 0,
                overflow: "hidden",
                background: "#f9fafb",
                borderRadius: 8,
            }}
        >
            <img
                src={thumbnail}
                alt="Vista previa del PDF"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
                loading="lazy"
            />
        </div>
    );
}