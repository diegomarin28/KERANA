import { useState } from "react";

export default function TagInput({ value = [], onChange, placeholder="Agregar etiqueta y Enter" }) {
    const [draft, setDraft] = useState("");

    const add = () => {
        const t = draft.trim();
        if (!t) return;
        if (!value.includes(t)) onChange([...(value||[]), t]);
        setDraft("");
    };
    const remove = (t) => onChange(value.filter(v => v !== t));

    return (
        <div style={{ border:"1px solid var(--border)", borderRadius:12, padding:8, display:"flex", flexWrap:"wrap", gap:8 }}>
            {value.map(t => (
                <span key={t} style={{ padding:"6px 10px", borderRadius:9999, background:"rgba(37,99,235,.10)", color:"var(--accent)", fontWeight:700, border:"1px solid rgba(37,99,235,.25)" }}>
          {t} <button onClick={()=>remove(t)} style={{ marginLeft:6, border:"none", background:"transparent", cursor:"pointer", color:"#64748b" }}>×</button>
        </span>
            ))}
            <input
                value={draft}
                onChange={e=>setDraft(e.target.value)}
                onKeyDown={e=>{ if(e.key === "Enter"){ e.preventDefault(); add(); } }}
                placeholder={placeholder}
                style={{ flex:1, minWidth:140, border:"none", outline:"none" }}
            />
        </div>
    );
}
