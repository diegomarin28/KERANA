import { useState } from 'react'
import { supabase } from '../supabase'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function MentorApply() {
    const [especialidad, setEspecialidad] = useState('')
    const [precioHora, setPrecioHora] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Debes iniciar sesión')

            const { error } = await supabase
                .from('mentor')
                .insert([{
                    usuario_id: user.id,
                    especialidad,
                    precio_hora: Number(precioHora),
                    descripcion
                }])

            if (error) throw error
            alert('¡Tu postulación fue enviada!')
            setEspecialidad(''); setPrecioHora(''); setDescripcion('')
        } catch (err) {
            setErrorMsg(err.message || 'No se pudo postular')
        } finally { setLoading(false) }
    }

    return (
        <div className="container" style={{ padding: "32px 16px 80px", maxWidth: 720, margin: '0 auto' }}>
            <h1 style={{ margin: "12px 0 4px" }}>Postularme como mentor/a</h1>
            <p style={{ color: "var(--muted)" }}>Completá el formulario para ofrecer mentorías.</p>

            <Card style={{ marginTop: 20 }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
                    <label>Especialidad / Materia</label>
                    <input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Base de Datos I, Cálculo…" required />

                    <label>Precio por hora (UYU)</label>
                    <input type="number" min="0" value={precioHora} onChange={(e) => setPrecioHora(e.target.value)} required />

                    <label>Descripción</label>
                    <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Tu experiencia, enfoque de trabajo…" required />

                    {errorMsg && <div style={{ color: '#b91c1c' }}>{errorMsg}</div>}

                    <Button disabled={loading} type="submit" variant="secondary">
                        {loading ? 'Enviando…' : 'Enviar postulación'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}
