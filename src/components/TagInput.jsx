import { useState } from "react"

export default function TagInput({ tags = [], setTags }) {
    const [input, setInput] = useState("")

    const addTag = () => {
        if (input && !tags.includes(input)) {
            setTags([...tags, input])
        }
        setInput("")
    }

    const removeTag = (tag) => {
        setTags(tags.filter(t => t !== tag))
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Agregar tag y presionar Enter"
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <button type="button" onClick={addTag} style={{ padding: "8px 12px", borderRadius: 8, background: "#2563eb", color: "white", border: "none", cursor: "pointer" }}>
                    +
                </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tags.map(tag => (
                    <span key={tag} style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: 12, fontSize: 12 }}>
            {tag}
                        <button onClick={() => removeTag(tag)} style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer" }}>x</button>
          </span>
                ))}
            </div>
        </div>
    )
}
