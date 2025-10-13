import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { supabase } from "../supabase";


// 🧩 Configurar correctamente el worker para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

export default function PDFThumbnail({ url, width = 180, height = 240 }) {
    const [thumbnail, setThumbnail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (url) generateThumbnail();
        else {
            setLoading(false);
            setError(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    const generateThumbnail = async () => {
        try {
            setLoading(true);
            setError(false);

            const loadingTask = pdfjsLib.getDocument({
                url,
                withCredentials: false,
                isEvalSupported: false,
            });

            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);

            const viewport = page.getViewport({ scale: 1 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            const scale = Math.min(width / viewport.width, height / viewport.height);
            const scaledViewport = page.getViewport({ scale });

            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;

            setThumbnail(canvas.toDataURL());
            setLoading(false);
        } catch (err) {
            console.error("Error generando thumbnail:", err);
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
                }}
            >
                <div style={{ fontSize: 48 }}>📄</div>
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
            />
        </div>
    );
}
