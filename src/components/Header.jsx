import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_SignUp from "../components/AuthModal_SignUp.jsx";
import AuthModal_HacerResenia from "../components/AuthModal_HacerReseña.jsx";
import Sidebar from "../components/Sidebar.jsx";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [signUpOpen, setSignUpOpen] = useState(false);
    const [reseniaOpen, setReseniaOpen] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const handleReseniaClick = () => {
        if (!user) {
            setAuthOpen(true); // Si no está logueado → login
        } else {
            setReseniaOpen(true); // Si está logueado → reseña
        }
    };

    const handleReseniaSubmit = (reseniaData) => {
        console.log("Nueva reseña desde header:", reseniaData);
        // Aquí puedes implementar la lógica para guardar la reseña
    };

    const handleSignedIn = (username) => {
        setUser({ name: username });
        setAuthOpen(false);
        setSignUpOpen(false);
    };

    const handleLogout = () => {
        setUser(null);
    };

    const switchToSignUp = () => {
        setAuthOpen(false);
        setSignUpOpen(true);
    };

    const switchToSignIn = () => {
        setSignUpOpen(false);
        setAuthOpen(true);
    };

    const pill = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 9999,
        background: "#2563eb",
        color: "#fff",
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap"
    };

    return (
        <>
            <header
                style={{
                    width: "100%",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    background: "#ffffff",
                    borderBottom: "1px solid var(--border)"
                }}
            >
                <div
                    className="header-container"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        height: 64
                    }}
                >
                    {/* Izquierda: menú + logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <button
                            onClick={() => setMenuOpen(true)}
                            aria-label="Abrir menú"
                            style={{
                                fontSize: 26,
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                lineHeight: 1
                            }}
                        >
                            ☰
                        </button>

                        <button
                            onClick={() => navigate("/")}
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 800,
                                fontSize: 20,
                                color: "var(--accent)"
                            }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: 3 botones azules */}
                    <nav
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                            flex: "1 1 auto",
                            justifyContent: "center"
                        }}
                    >
                        <Link to="/upload" style={pill}>
                            Subir Apuntes
                        </Link>
                        <Link to="/about" style={pill}>
                            ¡Quiero ser mentor!
                        </Link>
                        <button
                            onClick={handleReseniaClick}
                            style={{ ...pill, border: "none", cursor: "pointer" }}
                        >
                            ¡Hacé tu reseña!
                        </button>
                    </nav>

                    {/* Derecha: Sign Up / Sign In o usuario logueado */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {!user ? (
                            <>
                                <button
                                    onClick={() => setSignUpOpen(true)}
                                    style={{
                                        padding: "10px 20px",
                                        fontSize: 16,
                                        backgroundColor: "#28a745",
                                        borderColor: "#28a745",
                                        color: "#fff",
                                        borderRadius: 6,
                                        cursor: "pointer"
                                    }}
                                >
                                    Sign Up
                                </button>
                                <button
                                    onClick={() => setAuthOpen(true)}
                                    style={{
                                        padding: "10px 20px",
                                        fontSize: 16,
                                        backgroundColor: "#2563eb",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: "pointer"
                                    }}
                                >
                                    Sign In
                                </button>
                            </>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        maxWidth: 120,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}
                                >
                                    {user.name}
                                </span>
                                <div
                                    title={user.name}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: "var(--accent)",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800
                                    }}
                                >
                                    {user.name[0].toUpperCase()}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: "8px 12px",
                                        fontSize: 12,
                                        backgroundColor: "#dc3545",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 4,
                                        cursor: "pointer"
                                    }}
                                >
                                    Salir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Separador para que el contenido no quede tapado */}
            <div style={{ height: 64 }} />

            {/* Sidebar + Modales */}
            <Sidebar
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={user}
                onLogout={handleLogout}
            />

            <AuthModal_SignIn
                open={authOpen}
                onClose={() => setAuthOpen(false)}
                onSignedIn={handleSignedIn}
                onSwitchToSignUp={switchToSignUp}
            />
            <AuthModal_SignUp
                open={signUpOpen}
                onClose={() => setSignUpOpen(false)}
                onSignedIn={handleSignedIn}
                onSwitchToSignIn={switchToSignIn}
            />
            <AuthModal_HacerResenia
                open={reseniaOpen}
                onClose={() => setReseniaOpen(false)}
                onSave={handleReseniaSubmit}
            />
        </>
    );
}
