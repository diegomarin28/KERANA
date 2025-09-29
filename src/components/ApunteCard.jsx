import { useState } from "react";
import { supabase } from "../supabase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Chip } from "../components/ui/Chip";

export default function ApunteCard({
                                       apunte,
                                       isOwner = false,          // true en MyPapers
                                       hasPurchased = false,      // true si el usuario ya lo compró (en SearchResults)
                                       onBuy,                     // (opcional) async () => {...} si querés habilitar compra
                                       onEdit,                    // (opcional) () => {...}
                                       onDelete,                  // (opcional) async () => {...}
                                       onDownloaded,              // (opcional) callback luego de descargar
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
    } = apunte || {};

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
        <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {titulo}
                </h3>
                {materia_nombre && <Chip tone="blue">{materia_nombre}</Chip>}
            </div>

            {descripcion && (
                <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>
                    {descripcion.length > 140 ? descripcion.slice(0, 140) + "…" : descripcion}
                </p>
            )}

            <div style={{ display: "flex", gap: 14, alignItems: "center", color: "#374151", fontSize: 14, flexWrap: "wrap", marginTop: 8 }}>
                <span title="Estrellas">⭐ {formatStars(estrellas)}</span>
                <span title="Créditos">💰 {Number(creditos) || 0}</span>
                {mime_type && <span title="Tipo">{iconForMime(mime_type)} {shortMime(mime_type)}</span>}
                {file_size != null && <span title="Tamaño">📦 {formatBytes(file_size)}</span>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
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
        </Card>
    );
}

/* ===== helpers ===== */

function formatStars(value) {
    const v = Number(value);
    if (!isFinite(v) || v <= 0) return "—";
    return v.toFixed(1);
}

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
