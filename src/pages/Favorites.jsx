import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'

export default function Favorites() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => { load() }, [])

    const load = async () => {
        setLoading(true); setErrorMsg('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setItems([]); setLoading(false); return }

            const { data, error } = await supabase
                .from('usuario_fav')
                .select(`id,profesor_curso(id, precio, modalidad,usuario(nombre),materia(nombre),califica(puntuacion))`)
                .eq('usuario_id', user.id)
                .order('id', { ascending: false })

            if (error) throw error
            const mapped = (data || []).filter(r => r.profesor_curso).map(r => {
                const c = r.profesor_curso
                const ratings = c.califica?.map(x => x.puntuacion) || []
                const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : '—'
                return {
                    favId: r.id, id: c.id,
                    materia: c.materia?.nombre || 'Materia',
                    docente: c.usuario?.nombre || 'Docente',
                    precio: c.precio ?? 0, modalidad: c.modalidad || '—', rating: avg
                }
            })
            setItems(mapped)
        } catch { setErrorMsg('Error cargando favoritos') }
        setLoading(false)
    }

    if (loading) return <div style={{ padding: 20 }}>Cargando…</div>

    return (
        <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
            <h2>Mis cursos favoritos</h2>
            {errorMsg && <div style={{ color: '#b91c1c' }}>{errorMsg}</div>}

            {items.length === 0 ? (
                <p>No tenés cursos en favoritos aún.</p>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {items.map(item => (
                        <Link key={item.id} to={`/cursos/${item.id}`} style={{ textDecoration: 'none' }}>
                            <Card style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{item.materia}</h3>
                                    <p style={{ margin: '6px 0', color: 'var(--muted)' }}>
                                        {item.docente} · {item.modalidad}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Chip tone="amber">⭐ {item.rating}</Chip>
                                    <div style={{ fontWeight: 600, marginTop: 6 }}>${item.precio}</div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
