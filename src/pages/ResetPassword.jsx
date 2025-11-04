import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEye, faEyeSlash, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Validaciones en tiempo real
    const [validations, setValidations] = useState({
        minLength: false,
        hasLower: false,
        hasUpper: false,
        hasNumber: false,
        passwordsMatch: false
    });

    useEffect(() => {
        // Dar tiempo a que Supabase procese el token
        const timer = setTimeout(() => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');

            if (!accessToken) {
                setError("Enlace inválido o expirado. Solicitá uno nuevo.");
            }
        }, 100); // Pequeño delay para que React Router procese el hash

        return () => clearTimeout(timer);
    }, []);

    // Actualizar validaciones en tiempo real
    useEffect(() => {
        setValidations({
            minLength: password.length >= 8,
            hasLower: /[a-z]/.test(password),
            hasUpper: /[A-Z]/.test(password),
            hasNumber: /\d/.test(password),
            passwordsMatch: password === confirmPassword && password.length > 0 && confirmPassword.length > 0
        });
    }, [password, confirmPassword]);

    const allValidationsPassed = Object.values(validations).every(v => v);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!allValidationsPassed) {
            setError("Por favor, cumplí con todos los requisitos de la contraseña");
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) throw updateError;

            setSuccess(true);

            // Redirigir al login después de 3 segundos
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err) {
            console.error('Error updating password:', err);
            setError("No se pudo actualizar la contraseña. Intentá nuevamente o solicitá un nuevo enlace.");
        } finally {
            setLoading(false);
        }
    }

    // Si ya fue exitoso, mostrar modal de éxito
    if (success) {
        return (
            <div style={successContainer}>
                <div style={successCard}>
                    <div style={successIconContainer}>
                        <FontAwesomeIcon icon={faCheckCircle} style={successIcon} />
                    </div>
                    <h2 style={successTitle}>¡Contraseña actualizada!</h2>
                    <p style={successText}>
                        Tu contraseña se cambió correctamente. Redirigiendo al inicio...
                    </p>
                    <div style={loadingDots}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={pageContainer}>
            <div style={formCard}>
                {/* Header */}
                <div style={header}>
                    <div style={badge}>KERANA</div>
                    <h1 style={title}>Nueva Contraseña</h1>
                    <p style={subtitle}>Creá una contraseña segura para tu cuenta</p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} style={formBody}>
                    {error && (
                        <div style={errorAlert}>
                            <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: 8 }} />
                            {error}
                        </div>
                    )}

                    {/* Campo Contraseña */}
                    <div style={fieldContainer}>
                        <label style={labelStyle}>Nueva Contraseña</label>
                        <div style={{
                            ...inputWrapper,
                            borderColor: password && !validations.minLength ? "#ef4444" : "#e2e8f0"
                        }}>
                            <FontAwesomeIcon icon={faLock} style={inputIcon} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={inputStyle}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={eyeButton}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    {/* Campo Confirmar Contraseña */}
                    <div style={fieldContainer}>
                        <label style={labelStyle}>Confirmar Contraseña</label>
                        <div style={{
                            ...inputWrapper,
                            borderColor: confirmPassword && !validations.passwordsMatch ? "#ef4444" : "#e2e8f0"
                        }}>
                            <FontAwesomeIcon icon={faLock} style={inputIcon} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                style={inputStyle}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={eyeButton}
                                disabled={loading}
                            >
                                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                            </button>
                        </div>
                    </div>

                    {/* Requisitos de la contraseña */}
                    <div style={validationsContainer}>
                        <p style={validationsTitle}>Tu contraseña debe contener:</p>
                        <ValidationItem
                            text="Mínimo 8 caracteres"
                            valid={validations.minLength}
                        />
                        <ValidationItem
                            text="Una letra minúscula (a-z)"
                            valid={validations.hasLower}
                        />
                        <ValidationItem
                            text="Una letra mayúscula (A-Z)"
                            valid={validations.hasUpper}
                        />
                        <ValidationItem
                            text="Un número (0-9)"
                            valid={validations.hasNumber}
                        />
                        <ValidationItem
                            text="Las contraseñas coinciden"
                            valid={validations.passwordsMatch}
                        />
                    </div>

                    {/* Botón Submit */}
                    <button
                        type="submit"
                        style={{
                            ...submitButton,
                            opacity: allValidationsPassed && !loading ? 1 : 0.5,
                            cursor: allValidationsPassed && !loading ? "pointer" : "not-allowed"
                        }}
                        disabled={!allValidationsPassed || loading}
                    >
                        {loading ? "Actualizando..." : "Actualizar Contraseña"}
                    </button>

                    {/* Link volver */}
                    <div style={footerLink}>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            style={backLink}
                        >
                            ← Volver al inicio
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Componente para cada validación
function ValidationItem({ text, valid }) {
    return (
        <div style={{
            ...validationItem,
            color: valid ? "#10b981" : "#94a3b8"
        }}>
            <FontAwesomeIcon
                icon={valid ? faCheckCircle : faTimesCircle}
                style={{
                    fontSize: 14,
                    color: valid ? "#10b981" : "#cbd5e1"
                }}
            />
            <span>{text}</span>
        </div>
    );
}

// ESTILOS
const pageContainer = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', sans-serif"
};

const formCard = {
    background: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3)",
    maxWidth: 480,
    width: "100%",
    overflow: "hidden"
};

const header = {
    background: "linear-gradient(135deg, #13346b 0%, #2563eb 100%)",
    color: "#ffffff",
    padding: "40px 32px",
    textAlign: "center"
};

const badge = {
    display: "inline-block",
    background: "rgba(255, 255, 255, 0.2)",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12
};

const title = {
    margin: "0 0 8px 0",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "-0.5px"
};

const subtitle = {
    margin: 0,
    fontSize: 14,
    opacity: 0.9,
    fontWeight: 400
};

const formBody = {
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: 20
};

const errorAlert = {
    background: "rgba(239, 68, 68, 0.08)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center"
};

const fieldContainer = {
    display: "flex",
    flexDirection: "column",
    gap: 8
};

const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#1e293b"
};

const inputWrapper = {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 14px",
    gap: 10,
    transition: "all 0.2s ease"
};

const inputIcon = {
    color: "#64748b",
    fontSize: 16
};

const inputStyle = {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 15,
    fontWeight: 500,
    color: "#0f172a",
    background: "transparent",
    fontFamily: "'Inter', sans-serif"
};

const eyeButton = {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: 4,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    transition: "color 0.2s ease"
};

const validationsContainer = {
    background: "#f8fafc",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 10
};

const validationsTitle = {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569"
};

const validationItem = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease"
};

const submitButton = {
    width: "100%",
    padding: "14px 24px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif"
};

const footerLink = {
    textAlign: "center",
    marginTop: 8
};

const backLink = {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif"
};

// Estilos del modal de éxito
const successContainer = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #13346b 0%, #2563eb 60%, #0ea5a3 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', sans-serif"
};

const successCard = {
    background: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3)",
    maxWidth: 440,
    width: "100%",
    padding: "48px 32px",
    textAlign: "center"
};

const successIconContainer = {
    margin: "0 auto 24px",
    width: 80,
    height: 80,
    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};

const successIcon = {
    fontSize: 40,
    color: "#10b981"
};

const successTitle = {
    margin: "0 0 12px 0",
    fontSize: 28,
    fontWeight: 800,
    color: "#10b981",
    letterSpacing: "-0.5px"
};

const successText = {
    margin: "0 0 32px 0",
    fontSize: 16,
    color: "#64748b",
    lineHeight: 1.6
};

const loadingDots = {
    display: "flex",
    gap: 8,
    justifyContent: "center"
};