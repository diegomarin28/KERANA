import { useState } from "react";

// Componente EmailHistory para manejar el historial de emails
function EmailHistory({ emails, onSelectEmail, onDeleteEmail, currentEmail, onClose }) {
    if (emails.length === 0) return null;

    return (
        <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #d1d5db",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 10,
            maxHeight: "200px",
            overflowY: "auto"
        }}>
            {emails.map((email, index) => (
                <div key={index} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderBottom: index < emails.length - 1 ? "1px solid #f3f4f6" : "none",
                    cursor: "pointer",
                    backgroundColor: email === currentEmail ? "#f3f4f6" : "transparent"
                }}
                     onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                     onMouseLeave={(e) => e.currentTarget.style.backgroundColor = email === currentEmail ? "#f3f4f6" : "transparent"}
                     onClick={() => {
                         onSelectEmail(email);
                         onClose();
                     }}>
                    <span style={{ fontSize: 14 }}>{email}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEmail(email);
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#6b7280",
                            fontSize: 14,
                            padding: "2px 4px"
                        }}
                        onMouseEnter={(e) => e.target.style.color = "#dc3545"}
                        onMouseLeave={(e) => e.target.style.color = "#6b7280"}
                    >
                        ✖
                    </button>
                </div>
            ))}
        </div>
    );
}

export default function AuthModal_SignIn({ open, onClose, onSignedIn, onSwitchToSignUp }) {
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [emailHistory, setEmailHistory] = useState(() => {
        try {
            const saved = localStorage.getItem("emailHistory");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [showHistory, setShowHistory] = useState(false);

    if (!open) return null;

    const saveEmailToHistory = (email) => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !trimmedEmail.includes("@")) return;

        const newHistory = [trimmedEmail, ...emailHistory.filter(e => e !== trimmedEmail)].slice(0, 5);
        setEmailHistory(newHistory);
        try {
            localStorage.setItem("emailHistory", JSON.stringify(newHistory));
        } catch (error) {
            console.warn("No se pudo guardar el historial de emails:", error);
        }
    };

    const deleteEmailFromHistory = (emailToDelete) => {
        const newHistory = emailHistory.filter(e => e !== emailToDelete);
        setEmailHistory(newHistory);
        try {
            localStorage.setItem("emailHistory", JSON.stringify(newHistory));
        } catch (error) {
            console.warn("No se pudo actualizar el historial de emails:", error);
        }
    };

    function handleSubmit(e) {
        e.preventDefault();
        // demo: si hay email, "loguea"
        if (email.trim()) {
            saveEmailToHistory(email);
            onSignedIn(email.split("@")[0]); // nombre de usuario = antes del @
            onClose();
        }
    }

    const handleSwitchToSignUp = () => {
        if (onSwitchToSignUp) {
            onSwitchToSignUp();
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
                role="dialog" aria-modal="true" aria-labelledby="auth-title"
                style={{
                    position: "fixed", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(92vw, 520px)", background: "#fff",
                    borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,.25)",
                    zIndex: 4010, overflow: "visible"
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
                            <div style={{ position: "relative" }}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    onFocus={() => setShowHistory(true)}
                                    onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                                    required
                                    style={input}
                                />
                                {showHistory && (
                                    <EmailHistory
                                        emails={emailHistory}
                                        onSelectEmail={setEmail}
                                        onDeleteEmail={deleteEmailFromHistory}
                                        currentEmail={email}
                                        onClose={() => setShowHistory(false)}
                                    />
                                )}
                            </div>
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
                            ¿No tenés cuenta?{" "}
                            {onSwitchToSignUp ? (
                                <button
                                    type="button"
                                    onClick={handleSwitchToSignUp}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                        fontSize: "inherit"
                                    }}
                                >
                                    Crear cuenta
                                </button>
                            ) : (
                                <a href="/signup">Crear cuenta</a>
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