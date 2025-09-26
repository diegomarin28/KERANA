import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { courseAPI, ratingsAPI, notesAPI } from '../api/database'

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
            <div style={{ marginBottom: 32, padding: 24, background: 'var(--bg-secondary, #f8f9fa)', borderRadius: 12, border: '1px solid var(--border, #e1e5e9)' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{materia}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <span>👨‍🏫 {docente}</span>
                    <span>⭐ {avg}</span>
                    <span>{modalidad}</span>
                    <span>${precio}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Encontrá reseñas y apuntes de este curso
                </p>
            </div>

            {/* Apuntes */}
            <section className="section" style={{ marginBottom: 24 }}>
                <div className="section-title">Apuntes <span className="section-count">{notes.length}</span></div>
                {notes.length === 0 ? (
                    <div className="empty">Aún no hay apuntes publicados.</div>
                ) : (
                    <div className="grid" style={{ display: 'grid', gap: 12 }}>
                        {notes.map(n => (
                            <div key={n.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{n.titulo || n.file_name}</h3>
                                        {n.descripcion && <p style={{ margin: '6px 0', color: '#6b7280' }}>{n.descripcion}</p>}
                                    </div>
                                    <button
                                        onClick={() => window.open(n.file_url, '_blank')}
                                        style={{ padding: '8px 12px', borderRadius: 6, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
                                    >
                                        ⬇️ Descargar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Reseñas */}
            <section className="section">
                <div className="section-title">Reseñas <span className="section-count">{ratings.length}</span></div>
                {ratings.length === 0 ? (
                    <div className="empty">Sé el primero en calificar este curso.</div>
                ) : (
                    <div className="grid" style={{ display: 'grid', gap: 12 }}>
                        {ratings.map(r => (
                            <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{r.usuario?.nombre || 'Anónimo'}</strong>
                                    <span>⭐ {r.puntuacion}</span>
                                </div>
                                {r.comentario && <p style={{ marginTop: 8 }}>{r.comentario}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
