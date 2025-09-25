import { useRef, useState } from "react";

export default function FileDrop({ file, onFile }) {
    const ref = useRef(null);
    const [hover, setHover] = useState(false);

    const pick = () => ref.current?.click();
    const onChange = (e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
    };

    const onDrop = (e) => {
        e.preventDefault(); setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
    };

    return (
        <div
            onDragOver={(e)=>{e.preventDefault(); setHover(true);}}
            onDragLeave={()=>setHover(false)}
            onDrop={onDrop}
            onClick={pick}
            style={{
                border: `2px dashed ${hover ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 14, padding: 20, textAlign:"center", cursor:"pointer",
                background: hover ? "rgba(37,99,235,.06)" : "#fff"
            }}
        >
            {!file ? (
                <>
                    <div style={{ fontWeight:800, marginBottom:8 }}>Soltá tu PDF aquí</div>
                    <div style={{ color:"#64748b", marginBottom:10 }}>o hacé click para seleccionar</div>
                    <small style={{ color:"#94a3b8" }}>Formato: .pdf — Máx 25MB</small>
                </>
            ) : (
                <div style={{ display:"grid", gap:6 }}>
                    <div style={{ fontWeight:800 }}>{file.name}</div>
                    <small style={{ color:"#64748b" }}>{(file.size/1024/1024).toFixed(2)} MB</small>
                    <div style={{ fontSize:12, color:"#64748b" }}>Click para cambiar archivo</div>
                </div>
            )}
            <input
                ref={ref} type="file" accept="application/pdf" onChange={onChange}
                style={{ display:"none" }}
            />
        </div>
    );
}
