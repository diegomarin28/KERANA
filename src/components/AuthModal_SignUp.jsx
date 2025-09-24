import { useState } from "react";

export default function AuthModal_SignUp({ open, onClose, onSignedIn, onSwitchToSignIn }) {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [name, setName] = useState("");

    if (!open) return null;

    function handleSubmit(e) {
        e.preventDefault();
        if (pwd !== confirmPwd) {
            alert("Las contraseñas no coinciden");
            return;
        }
        // demo: si hay email y nombre, "registra"
        if (email.trim() && name.trim()) {
            onSignedIn(name.trim()); // usar el nombre completo como username
            onClose();
        }
    }

    const handleSwitchToSignIn = () => {
        if (onSwitchToSignIn) {
            onSwitchToSignIn();
        }
    };

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
                role="dialog" aria-modal="true" aria-labelledby="signup-title"
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
                    <h3 id="signup-title" style={{ margin: 0 }}>Crear cuenta</h3>
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
                            Nombre completo
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                style={input}
                            />
                        </label>
                        <label style={label}>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                style={input}
                            />
                        </label>
                        <label style={label}>
                            Contraseña
                            <input
                                type="password"
                                value={pwd}
                                onChange={e => setPwd(e.target.value)}
                                required
                                style={input}
                            />
                        </label>
                        <label style={label}>
                            Confirmar contraseña
                            <input
                                type="password"
                                value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)}
                                required
                                style={input}
                            />
                        </label>

                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                            Al crear una cuenta, aceptás nuestros{" "}
                            <a href="#" onClick={e => e.preventDefault()}>términos y condiciones</a> y{" "}
                            <a href="#" onClick={e => e.preventDefault()}>política de privacidad</a>.
                        </div>

                        <button type="submit" style={{...submitBtn, backgroundColor: "#28a745"}}>
                            Crear cuenta
                        </button>

                        <p style={{ textAlign: "center", margin: 0 }}>
                            ¿Ya tenés cuenta?{" "}
                            {onSwitchToSignIn ? (
                                <button
                                    type="button"
                                    onClick={handleSwitchToSignIn}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                        fontSize: "inherit"
                                    }}
                                >
                                    Iniciar sesión
                                </button>
                            ) : (
                                <a href="/signin">Iniciar sesión</a>
                            )}
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