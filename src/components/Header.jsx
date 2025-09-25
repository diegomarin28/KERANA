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

    function handleSignedIn(u) {
        setUser(u || { email: "demo@kerana.app" });
        setAuthOpen(false);
        setSignUpOpen(false);
    }

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
                    {/* Derecha del header */}
                    <div>
                        {!user ? (
                            <button
                                onClick={() => setAuthOpen(true)}
                                className="btn-primary"
                                style={{ height: 40, padding: "0 16px", borderRadius: 9999 }}
                            >
                                Sign in
                            </button>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontWeight: 700 }}>{user.name || "Usuario"}</span>
                                <div
                                    style={{
                                        width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff",
                                        display: "grid", placeItems: "center", fontWeight: 800
                                    }}
                                >
                                    {(user.email?.[0] || "U").toUpperCase()}
                                </div>
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
