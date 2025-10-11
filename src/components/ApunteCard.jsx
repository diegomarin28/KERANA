import { useState } from "react";
import { supabase } from "../supabase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";

export default function ApunteCard({
                                       apunte,
                                       isOwner = false,
                                       hasPurchased = false,
                                       onBuy,
                                       onEdit,
                                       onDelete,
                                       onDownloaded,
                                   }) {
    const [downloading, setDownloading] = useState(false);
    const [buying, setBuying] = useState(false);

    const {
        id_apunte,
        titulo,
        descripcion,
        materia_nombre,
        estrellas,
        creditos,
        file_path,
        file_size,
        mime_type,
        portada_url,             // NUEVO: url pública si existe
        rating_promedio,         // opcional (si viene de la RPC)
        votos,                   // opcional (si viene de la RPC)
    } = apunte || {};

    const displayRating = isFinite(Number(rating_promedio))
        ? Number(rating_promedio)
        : isFinite(Number(estrellas)) ? Number(estrellas) : 0;

    const canDownload = isOwner || hasPurchased || Number(creditos) === 0;

    async function handleDownload() {
        if (!file_path) return;
        try {
            setDownloading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Iniciá sesión para descargar.");
                return;
            }
            const { data, error } = await supabase.storage
                .from("apuntes")
                .createSignedUrl(file_path, 60);
            if (error) throw error;

            window.open(data.signedUrl, "_blank");
            onDownloaded && onDownloaded(id_apunte);
        } catch (e) {
            console.error(e);
            alert(e.message || "No se pudo descargar el apunte.");
        } finally {
            setDownloading(false);
        }
    }

    async function handleBuy() {
        if (!onBuy) return;
        try {
            setBuying(true);
            await onBuy(apunte);
        } catch (e) {
            console.error(e);
            alert(e.message || "No se pudo completar la compra.");
        } finally {
            setBuying(false);
        }
    }

    return (
        <Card style={{ padding: 12 }}>
            {/* PORTADA tipo primera página */}
            <div style={{
                position: "relative",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                background: "#fff",
                aspectRatio: "4 / 5",             // mantiene proporción hoja
            }}>
                {portada_url ? (
                    <img
                        src={portada_url}
                        alt={titulo}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e)=>{ e.currentTarget.style.display="none"; }}
                    />
                ) : (
                    <PlaceholderPage />
                )}

                {/* Banda inferior con título */}
                <div style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(2,6,23,0.75)",
                    color: "#fff",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <div style={{
                        flex: 1,
                        fontWeight: 700,
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}>
                        {titulo}
                    </div>
                    <div title={`${displayRating ? displayRating.toFixed(1) : "—"}${votos ? ` (${votos})` : ""}`}>
                        ⭐ {displayRating ? displayRating.toFixed(1) : "—"}
                    </div>
                </div>
            </div>

            {/* Descripción y meta */}
            {descripcion && (
                <p style={{ color: "var(--muted)", margin: "10px 0 0" }}>
                    {descripcion.length > 140 ? descripcion.slice(0, 140) + "…" : descripcion}
                </p>
            )}

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginTop: 10,
                flexWrap: "wrap",
            }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#374151", fontSize: 14, flexWrap: "wrap" }}>
                    {materia_nombre && <Chip tone="blue">{materia_nombre}</Chip>}
                    <span title="Créditos">💰 {Number(creditos) || 0}</span>
                    {mime_type && <span title="Tipo">{iconForMime(mime_type)} {shortMime(mime_type)}</span>}
                    {file_size != null && <span title="Tamaño">📦 {formatBytes(file_size)}</span>}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    {isOwner ? (
                        <>
                            {onEdit && (
                                <Button type="button" variant="ghost" onClick={() => onEdit(apunte)}>
                                    Editar
                                </Button>
                            )}
                            {onDelete && (
                                <Button type="button" variant="ghost" onClick={() => onDelete(apunte)}>
                                    Eliminar
                                </Button>
                            )}
                            <Button type="button" variant="secondary" onClick={handleDownload} disabled={downloading}>
                                {downloading ? "Descargando…" : "Descargar"}
                            </Button>
                        </>
                    ) : canDownload ? (
                        <Button type="button" variant="secondary" onClick={handleDownload} disabled={downloading}>
                            {downloading ? "Descargando…" : "Descargar"}
                        </Button>
                    ) : onBuy ? (
                        <Button type="button" variant="primary" onClick={handleBuy} disabled={buying}>
                            {buying ? "Procesando…" : `Comprar · ${Number(creditos) || 0} créditos`}
                        </Button>
                    ) : (
                        <span style={{ color: "var(--muted)", fontSize: 13 }}>
              Requiere compra ({Number(creditos) || 0} créditos)
            </span>
                    )}
                </div>
            </div>
        </Card>
    );
}

/* ===== placeholder portada ===== */
function PlaceholderPage() {
    return (
        <div style={{
            width: "100%",
            height: "100%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
            position: "relative",
        }}>
            {/* líneas tipo hoja */}
            <div style={{
                position: "absolute",
                top: 14,
                left: 14,
                right: 14,
                bottom: 46,
                background:
                    "repeating-linear-gradient(#0000, #0000 18px, #e5e7eb 18px, #e5e7eb 19px)",
                borderRadius: 6,
            }} />
            {/* ícono simple */}
            <div style={{ fontSize: 36, opacity: .7 }}>📄</div>
        </div>
    );
}

/* ===== helpers (tus mismos) ===== */

function shortMime(m) {
    if (!m) return "";
    if (m.includes("pdf")) return "PDF";
    if (m.includes("wordprocessingml")) return "DOCX";
    if (m.includes("msword")) return "DOC";
    if (m.includes("presentationml")) return "PPTX";
    if (m.includes("powerpoint")) return "PPT";
    return m.split("/")[1]?.toUpperCase?.() || m;
}

function iconForMime(m) {
    if (!m) return "📄";
    if (m.includes("pdf")) return "📕";
    if (m.includes("word")) return "📘";
    if (m.includes("presentation")) return "📙";
    return "📄";
}

function formatBytes(bytes) {
    const b = Number(bytes);
    if (!isFinite(b) || b < 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0, v = b;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
