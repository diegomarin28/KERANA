import { useState } from "react";
import { supabase } from "../supabase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function AuthModal_SignUp({ open, onClose, onSuccess }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    if (!open) return null;

    const canSubmit = name.trim() && email.trim() && pass.trim();

    const signUp = async (e) => {
        e?.preventDefault?.();
        if (!canSubmit || loading) return;
        setLoading(true);
        setErr("");
        try {
            const { data, error } = await supabase.auth.signUp({ email, password: pass });
            if (error) throw error;

            // (Opcional) Guardar perfil mínimo en tu tabla "usuario" o similar via RPC/API
            // await userAPI.createProfile({ nombre: name })

            alert("¡Cuenta creada! Revisá tu email para confirmar.");
            onSuccess?.(data);
            onClose?.();
        } catch (e2) {
            setErr(e2?.message || "No se pudo crear la cuenta.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 4000 }} />
            <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", zIndex: 4010, padding: 16 }}>
                <Card style={{ width: "min(520px, 92vw)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0 }}>Crear cuenta</h3>
                        <button onClick={onClose} aria-label="Cerrar" style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>✕</button>
                    </div>

                    <form onSubmit={signUp} style={{ display: "grid", gap: 12, marginTop: 12 }}>
                        <label>Nombre</label>
                        <input
                            placeholder="Tu nombre completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ height: 44, border: "1px solid var(--border)", borderRadius: 12, padding: "0 12px" }}
                        />

                        <label>Email (UM recomendado)</label>
                        <input
                            type="email"
                            placeholder="tu@um.edu.uy"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ height: 44, border: "1px solid var(--border)", borderRadius: 12, padding: "0 12px" }}
                        />

                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            required
                            style={{ height: 44, border: "1px solid var(--border)", borderRadius: 12, padding: "0 12px" }}
                        />

                        {err && <div style={{ color: "#b91c1c" }}>{err}</div>}

                        <Button type="submit" variant="secondary" disabled={!canSubmit || loading}>
                            {loading ? "Creando…" : "Crear cuenta"}
                        </Button>

                        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                            Al registrarte aceptás nuestros términos y condiciones.
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}
