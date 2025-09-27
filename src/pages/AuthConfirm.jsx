// src/pages/AuthConfirm.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"

export default function AuthConfirm() {
    const [status, setStatus] = useState("loading") // loading | ok | error
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
                // ⏱ 2.5s para que se vea el tick antes de redirigir
                setTimeout(() => navigate("/panel", { replace: true }), 2500)
            } catch (e) {
                if (!mounted) return
                console.error(e)
                setStatus("error")
                const raw = (e?.message || "").toLowerCase()
                if (raw.includes("expired")) {
                    setMsg("El enlace ya venció. Pedí uno nuevo desde Ingresar.")
                } else if (raw.includes("invalid")) {
                    setMsg("El enlace no es válido. Volvé a solicitarlo desde Ingresar.")
                } else if (raw.includes("used")) {
                    setMsg("Este enlace ya fue usado. Ingresá nuevamente o solicitá otro.")
                } else {
                    setMsg("El enlace no es válido o ya fue usado.")
                }
            }
        })()
        return () => { mounted = false }
    }, [navigate])

    return (
        <>
            {/* styles para el spinner */}
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 48px; height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin: 0 auto 8px auto;
        }
      `}</style>

            <div style={{ minHeight:"70vh", display:"grid", placeItems:"center", background:"#f8f9fa", padding:16 }}>
                <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:28, maxWidth:420, width:"100%", textAlign:"center" }}>

                    {status === "loading" && (
                        <div role="status" aria-live="polite">
                            <div className="spinner" />
                            <h2>Verificando…</h2>
                            <p style={{ color:"#64748b" }}>{msg}</p>
                        </div>
                    )}

                    {status === "ok" && (
                        <div role="status" aria-live="polite">
                            <div style={{ fontSize:56, color:"#10b981" }}>✓</div>
                            <h2>¡Listo!</h2>
                            <p style={{ color:"#64748b" }}>{msg}</p>
                        </div>
                    )}

                    {status === "error" && (
                        <div role="status" aria-live="polite">
                            <div style={{ fontSize:56, color:"#ef4444" }}>✗</div>
                            <h2>Hubo un problema</h2>
                            <p style={{ color:"#64748b" }}>{msg}</p>
                            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                                <button onClick={() => window.location.reload()} style={btn}>Reintentar</button>
                                <button onClick={() => navigate("/signin")} style={btnOutline}>Ingresar</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    )
}

const btn = { padding:"10px 14px", borderRadius:10, border:"1px solid #1e40af", background:"#2563eb", color:"#fff", fontWeight:700, cursor:"pointer" }
const btnOutline = { padding:"10px 14px", borderRadius:10, border:"1px solid #e5e7eb", background:"#fff", color:"#111827", fontWeight:700, cursor:"pointer" }
