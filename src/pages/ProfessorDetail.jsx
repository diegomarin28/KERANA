import { useMemo, useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import AuthModal_HacerReseña from "../components/AuthModal_HacerReseña"
import { Button } from "../components/ui/Button"
import { Chip } from "../components/ui/Chip"
import { Card } from "../components/ui/Card"

function StarRow({ value=0 }) {
    return <div style={{ color:"#f8a415" }}>{"★".repeat(Math.round(value))}{"☆".repeat(5-Math.round(value))}</div>
}

export default function ProfessorDetail() {
    const { id } = useParams()
    const [professorCourse, setProfessorCourse] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [showReviewModal, setShowReviewModal] = useState(false)

    useEffect(()=>{ /* load data aquí */ },[id])

    if (loading) return <p>Cargando…</p>
    if (error) return <p style={{ color: "crimson" }}>{error}</p>
    if (!professorCourse) return <p>Profesor no encontrado</p>

    return (
        <div className="container" style={{ padding: 20 }}>
            <Card>
                <h2>{professorCourse.usuario?.nombre || "Profesor"}</h2>
                <p>{professorCourse.materia?.nombre} • {professorCourse.titulo}</p>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <Chip>💰 ${professorCourse.precio}</Chip>
                    <Chip>📍 {professorCourse.modalidad}</Chip>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10 }}>
                    <Button variant="primary" onClick={()=>setShowReviewModal(true)}>Hacer reseña</Button>
                    <Button variant="secondary">Contactar profesor</Button>
                    <Button variant="ghost">Comprar curso</Button>
                </div>
            </Card>

            <h3 style={{ marginTop:20 }}>Reseñas ({reviews.length})</h3>
            {reviews.map(r=>(
                <Card key={r.id}>
                    <strong>{r.titulo}</strong>
                    <p>{r.comentario}</p>
                </Card>
            ))}
            {showReviewModal && (
                <AuthModal_HacerReseña open onClose={()=>setShowReviewModal(false)} onSave={()=>{}} courseId={professorCourse.id}/>
            )}
        </div>
    )
}
