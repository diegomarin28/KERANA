import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

export default function AuthConfirm() {
    const [status, setStatus] = useState("loading")
    const [msg, setMsg] = useState("Verificando tu email…")
    const navigate = useNavigate()

    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
                if (error) throw error
                if (!mounted) return
                setStatus("ok")
                setMsg("¡Email verificado! Iniciando sesión…")
                setTimeout(() => navigate("/panel", { replace: true }), 2500)
            } catch (e) {
                if (!mounted) return
                console.error(e)
                setStatus("error")
                const raw = (e?.message || "").toLowerCase()
                if (raw.includes("expired")) setMsg("El enlace ya venció.")
                else if (raw.includes("invalid")) setMsg("El enlace no es válido.")
                else if (raw.includes("used")) setMsg("Este enlace ya fue usado.")
                else setMsg("El enlace no es válido o ya fue usado.")
            }
        })()
        return () => { mounted = false }
    }, [navigate])

    return (
        <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 16 }}>
            <Card style={{ textAlign: "center", maxWidth: 420 }}>
                {status === "loading" && (
                    <div>
                        <div className="spinner" />
                        <h2>Verificando…</h2>
                        <p style={{ color: "var(--muted)" }}>{msg}</p>
                    </div>
                )}
                {status === "ok" && (
                    <div>
                        <div style={{ fontSize: 56, color: "#10b981" }}>✓</div>
                        <h2>¡Listo!</h2>
                        <p style={{ color: "var(--muted)" }}>{msg}</p>
                    </div>
                )}
                {status === "error" && (
                    <div>
                        <div style={{ fontSize: 56, color: "#ef4444" }}>✗</div>
                        <h2>Hubo un problema</h2>
                        <p style={{ color: "var(--muted)" }}>{msg}</p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
                            <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
                            <Button variant="ghost" onClick={() => navigate("/signin")}>Ingresar</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
