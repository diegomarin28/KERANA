import { useState } from "react"

export default function FileDrop({ onFileSelected }) {
    const [dragOver, setDragOver] = useState(false)

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && onFileSelected) onFileSelected(file)
    }

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
                border: `2px dashed ${dragOver ? "var(--blue)" : "#cbd5e1"}`,
                borderRadius: 12,
                padding: 30,
                textAlign: "center",
                background: dragOver ? "#f0f9ff" : "var(--surface)",
                transition: "all .2s ease"
            }}
        >
            <p style={{ color: dragOver ? "var(--blue)" : "var(--muted)" }}>
                {dragOver ? "Soltá el archivo aquí" : "Arrastrá un archivo o hacé clic"}
            </p>
            <input
                type="file"
                onChange={(e) => e.target.files[0] && onFileSelected(e.target.files[0])}
                style={{ marginTop: 10 }}
            />
        </div>
    )
}
