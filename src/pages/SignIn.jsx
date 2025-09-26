import { useState } from 'react'
import { supabase } from '../supabase'
import { userAPI } from '../api/database'

export default function SignIn() {
    const [mode, setMode] = useState('signin') // 'signin' | 'signup'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        try {
            if (mode === 'signup') {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password
                })
                if (signUpError) throw signUpError

                // Crear perfil en tabla usuario
                const { error: profileError } = await userAPI.createProfile({ nombre: name })
                if (profileError) throw profileError

                alert('¡Cuenta creada! Verificá tu email si es necesario.')
                setMode('signin')
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
                if (signInError) throw signInError
                alert('Bienvenido 👋')
                // Redirigí si querés: window.location.href = '/'
            }
        } catch (err) {
            setErrorMsg(err.message || 'Error de autenticación')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section style={{ padding: 20, maxWidth: 420, margin: '40px auto' }}>
            <h2 style={{ marginBottom: 8 }}>{mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
            <p style={{ color: '#64748b', marginTop: 0 }}>
                {mode === 'signup' ? 'Registrate con tu correo UM para verificar la cuenta.' : 'Ingresá con tu email y contraseña.'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
                {mode === 'signup' && (
                    <>
                        <label>Nombre</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre" />
                    </>
                )}

                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@um.edu.uy" />

                <label>Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

                {errorMsg && <div style={{ color: '#b91c1c' }}>{errorMsg}</div>}

                <button disabled={loading} type="submit" style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', background: '#2563eb', color: 'white', fontWeight: 600 }}>
                    {loading ? 'Procesando…' : (mode === 'signup' ? 'Crear cuenta' : 'Ingresar')}
                </button>
            </form>

            <div style={{ marginTop: 12 }}>
                {mode === 'signup' ? (
                    <span>¿Ya tenés cuenta?{' '}
                        <button onClick={() => setMode('signin')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
              Iniciar sesión
            </button>
          </span>
                ) : (
                    <span>¿No tenés cuenta?{' '}
                        <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}>
              Crear cuenta
            </button>
          </span>
                )}
            </div>
        </section>
    )
}
