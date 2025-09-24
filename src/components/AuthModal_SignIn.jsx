import { useState } from "react";

export default function AuthModal_SignIn({ open, onClose, onSignedIn }) { //Sirve para en vez de abrir una ventana aparte es como que abre el cuadrado para lo de log in
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");

    if (!open) return null;

    function handleSubmit(e) {
        e.preventDefault();
        // demo: si hay email, “loguea”
        if (email.trim()) {
            onSignedIn(email.split("@")[0]); // nombre de usuario = antes del @
            onClose();
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    zIndex: 4000
                }}
                aria-hidden="true"
            />
            {/* Panel */}
            <div
                role="dialog" aria-modal="true" aria-labelledby="auth-title"
                style={{
                    position: "fixed", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(92vw, 520px)", background: "#fff",
                    borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,.25)",
                    zIndex: 4010, overflow: "hidden"
                }}
            >
                <div style={{ padding: "18px 22px", borderBottom: "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 id="auth-title" style={{ margin: 0 }}>Iniciar sesión</h3>
                    <button onClick={onClose} aria-label="Cerrar"
                            style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>✖</button>
                </div>

                <div style={{ padding: 22 }}>
                    {/* Social (dummy) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        <button style={socBtn}>Google</button>
                        <button style={socBtn}>GitHub</button>
                    </div>

                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12, margin: "8px 0 16px" }}>
                        o con tu correo
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
                        <label style={label}>
                            Email
                            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={input}/>
                        </label>
                        <label style={label}>
                            Contraseña
                            <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} required style={input}/>
                        </label>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input type="checkbox" /> Recordarme
                            </label>
                            <a href="#" onClick={(e)=>e.preventDefault()}>¿Olvidaste tu contraseña?</a>
                        </div>

                        <button type="submit" style={submitBtn}>Ingresar</button>

                        <p style={{ textAlign: "center", margin: 0 }}>
                            ¿No tenés cuenta? <a href="/signup">Crear cuenta</a>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}

const socBtn = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600
};
const label = { display: "grid", gap: 6, fontSize: 14 };
const input = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    outline: "none"
};
const submitBtn = {
    padding: "12px 16px",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(37,99,235,.35)"
};
