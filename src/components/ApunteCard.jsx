// src/components/ApunteCard.jsx
import { useState } from "react"
import { supabase } from "../supabase"

export default function ApunteCard({
                                       apunte,
                                       isOwner = false,          // true en MyPapers
                                       hasPurchased = false,      // true si el usuario ya lo compró (en SearchResults)
                                       onBuy,                     // (opcional) async () => {...} si querés habilitar compra
                                       onEdit,                    // (opcional) () => {...}
                                       onDelete,                  // (opcional) async () => {...}
                                       onDownloaded               // (opcional) callback luego de descargar
                                   }) {
    const [downloading, setDownloading] = useState(false)
    const [buying, setBuying] = useState(false)

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
    } = apunte || {}

    const canDownload = isOwner || hasPurchased || creditos === 0

    async function handleDownload() {
        if (!file_path) return
        try {
            setDownloading(true)

            // Verificamos sesión (opcional: si toda la página ya exige login, podés omitir)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert("Iniciá sesión para descargar.")
                return
            }

            // Genera Signed URL (bucket privado)
            const { data, error } = await supabase
                .storage
                .from("apuntes")
                .createSignedUrl(file_path, 60) // válido 60s
            if (error) throw error

            // Abrimos en nueva pestaña
            window.open(data.signedUrl, "_blank")

            if (onDownloaded) onDownloaded(id_apunte)
        } catch (e) {
            console.error(e)
            alert(e.message || "No se pudo descargar el apunte.")
        } finally {
            setDownloading(false)
        }
    }

    async function handleBuy() {
        if (!onBuy) return
        try {
            setBuying(true)
            await onBuy(apunte) // delegamos la compra al padre (descuento de créditos / registrar compra)
        } catch (e) {
            console.error(e)
            alert(e.message || "No se pudo completar la compra.")
        } finally {
            setBuying(false)
        }
    }

    return (
        <div style={card}>
            <div style={headerRow}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{titulo}</h3>
                {materia_nombre && (
                    <span style={pill}>{materia_nombre}</span>
                )}
            </div>

            {descripcion && (
                <p style={muted}>
                    {descripcion.length > 140 ? descripcion.slice(0, 140) + "…" : descripcion}
                </p>
            )}

            <div style={metaRow}>
                <span title="Estrellas">⭐ {formatStars(estrellas)}</span>
                <span title="Créditos">💰 {Number(creditos) || 0}</span>
                {mime_type && <span title="Tipo">{iconForMime(mime_type)} {shortMime(mime_type)}</span>}
                {file_size != null && <span title="Tamaño">📦 {formatBytes(file_size)}</span>}
            </div>

            <div style={actionsRow}>
                {/* Acciones para dueño */}
                {isOwner ? (
                    <div style={group}>
                        {onEdit && (
                            <button type="button" onClick={() => onEdit(apunte)} style={btnLight}>
                                Editar
                            </button>
                        )}
                        {onDelete && (
                            <button type="button" onClick={() => onDelete(apunte)} style={btnDanger}>
                                Eliminar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            style={btnPrimary}
                        >
                            {downloading ? "Descargando…" : "Descargar"}
                        </button>
                    </div>
                ) : (
                    // Acciones para público (SearchResults)
                    <div style={group}>
                        {canDownload ? (
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={downloading}
                                style={btnPrimary}
                            >
                                {downloading ? "Descargando…" : "Descargar"}
                            </button>
                        ) : onBuy ? (
                            <button
                                type="button"
                                onClick={handleBuy}
                                disabled={buying}
                                style={btnSuccess}
                            >
                                {buying ? "Procesando…" : `Comprar · ${Number(creditos) || 0} créditos`}
                            </button>
                        ) : (
                            <span style={mutedSmall}>
                Requiere compra ({Number(creditos) || 0} créditos)
              </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ============ helpers UI/format ============ */

function formatStars(value) {
    const v = Number(value)
    if (!isFinite(v) || v <= 0) return "—"
    return v.toFixed(1)
}

function shortMime(m) {
    if (!m) return ""
    // ejemplos: application/pdf -> PDF, application/vnd.openxml...wordprocessingml.document -> DOCX
    if (m.includes("pdf")) return "PDF"
    if (m.includes("wordprocessingml")) return "DOCX"
    if (m.includes("msword")) return "DOC"
    if (m.includes("presentationml")) return "PPTX"
    if (m.includes("powerpoint")) return "PPT"
    return m.split("/")[1]?.toUpperCase?.() || m
}

function iconForMime(m) {
    if (!m) return "📄"
    if (m.includes("pdf")) return "📕"
    if (m.includes("word")) return "📘"
    if (m.includes("presentation")) return "📙"
    return "📄"
}

function formatBytes(bytes) {
    const b = Number(bytes)
    if (!isFinite(b) || b < 0) return "0 B"
    const units = ["B", "KB", "MB", "GB"]
    let i = 0, v = b
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
    return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

/* ============ inline styles ============ */

const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gap: 8,
    background: "#fff"
}

const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
}

const pill = {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    border: "1px solid #c7d2fe"
}

const muted = { color: "#6b7280", margin: "4px 0 0" }
const mutedSmall = { color: "#6b7280", fontSize: 13 }

const metaRow = {
    display: "flex",
    gap: 14,
    alignItems: "center",
    color: "#374151",
    fontSize: 14,
    flexWrap: "wrap",
    marginTop: 4
}

const actionsRow = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 6
}

const group = { display: "flex", gap: 8, alignItems: "center" }

const btnBase = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    cursor: "pointer",
    fontWeight: 600
}
const btnPrimary = { ...btnBase, background: "#2563eb", color: "#fff", borderColor: "#1e40af" }
const btnSuccess = { ...btnBase, background: "#16a34a", color: "#fff", borderColor: "#15803d" }
const btnDanger  = { ...btnBase, background: "#ef4444", color: "#fff", borderColor: "#dc2626" }
const btnLight   = { ...btnBase, background: "#fff", color: "#111827", border: "1px solid #e5e7eb" }
