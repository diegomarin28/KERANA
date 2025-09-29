import { useEffect, useMemo, useState } from "react"
import { supabase } from "../supabase"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Chip } from "../components/ui/Chip"

export default function My_papers() {
    const [notes,setNotes]=useState([])
    const [loading,setLoading]=useState(true)

    useEffect(()=>{ /* load data */ },[])

    if (loading) return <p>Cargando…</p>

    return (
        <div style={{ padding:20 }}>
            <h1>Mis apuntes</h1>
            {notes.length===0 ? (
                <Card style={{ textAlign:"center" }}>
                    <p>No tenés apuntes todavía</p>
                    <Button variant="secondary" onClick={()=>location.href="/upload"}>Subir apunte</Button>
                </Card>
            ) : (
                <div style={{ display:"grid", gap:12 }}>
                    {notes.map(n=>(
                        <Card key={n.id_apunte}>
                            <h3>{n.titulo}</h3>
                            <Chip tone="blue">{n.creditos} créditos</Chip>
                            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                                <Button variant="primary">Descargar</Button>
                                <Button variant="ghost">Eliminar</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
