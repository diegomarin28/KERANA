import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { Card } from "../components/ui/Card"

export default function AuthConfirm() {
    const [status, setStatus] = useState("loading")
    const [msg, setMsg] = useState("Verificando autenticación...")
    const navigate = useNavigate()

    useEffect(() => {
        let mounted = true

        const handleAuthCallback = async () => {
            try {


                // IMPORTANTE: Para OAuth, Supabase necesita procesar la URL
                const { data: { session }, error } = await supabase.auth.getSession()


                // Si no hay sesión, intentar con getUser
                if (!session) {

                    const { data: { user }, error: userError } = await supabase.auth.getUser()

                    if (userError) {
                        console.error('Error con getUser:', userError)
                        throw userError
                    }

                    if (user) {
                        // Crear sesión manualmente si tenemos usuario
                        await handleUserSession(user)
                        return
                    }
                }

                if (error) throw error

                if (!mounted) return

                if (session?.user) {
                    await handleUserSession(session.user)
                } else {
                    throw new Error("No se pudo obtener la sesión de autenticación")
                }
            } catch (e) {
                if (!mounted) return

                setStatus("error")
                setMsg(e?.message || "Error al autenticar. Intenta nuevamente.")
            }
        }

        const handleUserSession = async (user) => {


            // Verificar/crear perfil en la BD
            const { data: profile, error: profileError } = await supabase
                .from('usuario')
                .select('*')
                .eq('correo', user.email)
                .maybeSingle()



            // Si no existe el perfil, crearlo
            if (!profile && !profileError) {

                const username = user.user_metadata?.name || user.email.split('@')[0]

                const { error: insertError } = await supabase
                    .from('usuario')
                    .insert([{
                        correo: user.email,
                        nombre: user.user_metadata?.name || username,
                        username: username.slice(0, 32),
                        fecha_creado: new Date().toISOString(),
                        creditos: 0
                    }])

                if (insertError) {
                    console.error('Error creando perfil:', insertError)
                } else {
                    console.log('🎉 Perfil creado exitosamente para:', user.email)
                }
            }

            if (!mounted) return

            setStatus("ok")
            setMsg("¡Autenticación exitosa! Redirigiendo...")

            setTimeout(() => {
                if (mounted) {
                    navigate("/", { replace: true })
                }
            }, 1500)
        }

        handleAuthCallback()

        return () => {
            console.log('🧹 Cleanup AuthConfirm')
            mounted = false
        }
    }, [navigate])

    return (
        <div style={{
            minHeight: "70vh",
            display: "grid",
            placeItems: "center",
            padding: 16
        }}>
            <Card style={{
                textAlign: "center",
                maxWidth: 420,
                padding: "2rem"
            }}>
                {status === "loading" && (
                    <div>
                        <div style={{
                            width: 40,
                            height: 40,
                            border: "3px solid #f3f4f6",
                            borderTop: "3px solid #2563eb",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 1rem"
                        }} />
                        <h2>Verificando...</h2>
                        <p style={{ color: "#6b7280" }}>{msg}</p>
                    </div>
                )}
                {status === "ok" && (
                    <div>
                        <div style={{
                            fontSize: 56,
                            color: "#10b981",
                            marginBottom: "1rem"
                        }}>✓</div>
                        <h2>¡Listo!</h2>
                        <p style={{ color: "#6b7280" }}>{msg}</p>
                    </div>
                )}
                {status === "error" && (
                    <div>
                        <div style={{
                            fontSize: 56,
                            color: "#ef4444",
                            marginBottom: "1rem"
                        }}>✗</div>
                        <h2>Hubo un problema</h2>
                        <p style={{ color: "#6b7280" }}>{msg}</p>
                        <div style={{
                            display: "flex",
                            gap: 10,
                            justifyContent: "center",
                            marginTop: "1.5rem"
                        }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: "10px 16px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "white",
                                    cursor: "pointer"
                                }}
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                style={{
                                    padding: "10px 16px",
                                    border: "1px solid #2563eb",
                                    borderRadius: "8px",
                                    background: "#2563eb",
                                    color: "white",
                                    cursor: "pointer"
                                }}
                            >
                                Volver al inicio
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}