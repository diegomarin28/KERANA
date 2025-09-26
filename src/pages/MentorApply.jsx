import { useState } from 'react'
import { supabase } from '../supabase'

export default function MentorApply(){
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
            setEspecialidad('')
            setPrecioHora('')
            setDescripcion('')
        } catch (err) {
            setErrorMsg(err.message || 'No se pudo postular')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ padding:"32px 16px 80px", maxWidth: 720, margin: '0 auto' }}>
            <h1 style={{ margin:"12px 0 4px", fontSize:"clamp(22px,3.4vw,32px)", color:"#0b2a7a" }}>
                Postularme como mentor/a
            </h1>
            <p style={{ color:"#64748b" }}>Completá el formulario para ofrecer mentorías.</p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <label>Especialidad / Materia</label>
                <input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Base de Datos I, Cálculo, etc." required />

                <label>Precio por hora (UYU)</label>
                <input type="number" min="0" value={precioHora} onChange={(e) => setPrecioHora(e.target.value)} required />

                <label>Descripción</label>
                <textarea rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Contá tu experiencia, enfoque de trabajo, etc." required />

                {errorMsg && <div style={{ color: '#b91c1c' }}>{errorMsg}</div>}

                <button disabled={loading} type="submit" style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', background: '#2563eb', color: 'white', fontWeight: 600 }}>
                    {loading ? 'Enviando…' : 'Enviar postulación'}
                </button>
            </form>
        </div>
    )
}
