import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { notesAPI } from '../api/database'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'

export default function CourseDetail() {
    const { id } = useParams()
    const [course, setCourse] = useState(null)
    const [ratings, setRatings] = useState([])
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        (async () => {
            setLoading(true)
            setErrorMsg('')
            try {
                const { data, error } = await courseAPI.getCourseById(id)
                if (error) throw error
                setCourse(data)

                const { data: reviews, error: rErr } = await ratingsAPI.getCourseRatings(id)
                if (rErr) throw rErr
                setRatings(reviews || [])

                const { data: courseNotes, error: nErr } = await notesAPI.getCourseNotes(id)
                if (nErr) throw nErr
                setNotes(courseNotes || [])
            } catch (err) {
                console.error(err)
                setErrorMsg('No se pudo cargar el curso')
            }
            setLoading(false)
        })()
    }, [id])

    if (loading) return <div className="container" style={{ padding: '36px 0' }}>Cargando…</div>
    if (!course) return <div className="container" style={{ padding: '36px 0' }}>{errorMsg || 'Curso no encontrado'}</div>

    const docente = course.usuario?.nombre || 'Docente'
    const materia = course.materia?.nombre || 'Materia'
    const precio = course.precio ?? 0
    const modalidad = course.modalidad || '—'
    const avg = ratings.length ? (ratings.reduce((a, r) => a + (r.puntuacion || 0), 0) / ratings.length).toFixed(1) : '—'

    return (
        <div className="container" style={{ padding: '36px 0' }}>
            {/* Header */}
            <Card style={{ marginBottom: 32 }}>
                <h1>{materia}</h1>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                    <Chip tone="blue">👨‍🏫 {docente}</Chip>
                    <Chip tone="amber">⭐ {avg}</Chip>
                    <Chip>{modalidad}</Chip>
                    <Chip tone="primary">${precio}</Chip>
                </div>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                    Encontrá reseñas y apuntes de este curso
                </p>
            </Card>

            {/* Apuntes */}
            <section style={{ marginBottom: 24 }}>
                <h2>Apuntes <Chip tone="blue">{notes.length}</Chip></h2>
                {notes.length === 0 ? (
                    <Card>Aún no hay apuntes publicados.</Card>
                ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {notes.map(n => (
                            <Card key={n.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{n.titulo || n.file_name}</h3>
                                        {n.descripcion && <p style={{ margin: '6px 0', color: 'var(--muted)' }}>{n.descripcion}</p>}
                                    </div>
                                    <Button variant="secondary" onClick={() => window.open(n.file_url, '_blank')}>
                                        ⬇️ Descargar
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Reseñas */}
            <section>
                <h2>Reseñas <Chip tone="amber">{ratings.length}</Chip></h2>
                {ratings.length === 0 ? (
                    <Card>Sé el primero en calificar este curso.</Card>
                ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {ratings.map(r => (
                            <Card key={r.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{r.usuario?.nombre || 'Anónimo'}</strong>
                                    <span>⭐ {r.puntuacion}</span>
                                </div>
                                {r.comentario && <p style={{ marginTop: 8 }}>{r.comentario}</p>}
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
