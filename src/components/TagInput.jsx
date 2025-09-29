import { useState } from "react"
import { Chip } from "../components/ui/Chip"

export default function TagInput({ value = [], onChange, placeholder="Agregar etiqueta y Enter" }) {
    const [draft, setDraft] = useState("")
    const add = () => {
        const t = draft.trim()
        if (!t) return
        if (!value.includes(t)) onChange([...(value||[]), t])
        setDraft("")
    }
    const remove = (t) => onChange(value.filter(v => v !== t))

    return (
        <div style={{ border:"1px solid var(--border)", borderRadius:12, padding:8, display:"flex", flexWrap:"wrap", gap:8 }}>
            {value.map(t => (
                <Chip key={t} tone="blue">
                    {t} <button onClick={()=>remove(t)} style={{ border:"none", background:"transparent", cursor:"pointer", color:"#64748b" }}>×</button>
                </Chip>
            ))}
            <input
                value={draft}
                onChange={e=>setDraft(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); add() } }}
                placeholder={placeholder}
                style={{ flex:1, minWidth:140, border:"none", outline:"none" }}
            />
        </div>
    )
}
