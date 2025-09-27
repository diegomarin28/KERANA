import { useEffect, useState } from "react";
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
    const [inHero, setInHero] = useState(true);     // ← estado: arriba del hero vs scroll
    const navigate = useNavigate();

    // Detectamos si todavía estamos en el hero
    useEffect(() => {
        const el = document.getElementById("hero-sentinel");
        if (!el) {
            const onScroll = () => setInHero(window.scrollY < 200);
            onScroll();
            window.addEventListener("scroll", onScroll, { passive: true });
            return () => window.removeEventListener("scroll", onScroll);
        }
        const io = new IntersectionObserver(
            (entries) => setInHero(entries[0].isIntersecting),
            { root: null, threshold: 0, rootMargin: "-64px 0px 0px 0px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const handleReseniaClick = () => {
        if (!user) setAuthOpen(true);
        else setReseniaOpen(true);
    };

    const handleReseniaSubmit = (reseniaData) => {
        console.log("Nueva reseña desde header:", reseniaData);
    };

    function handleSignedIn(u) {
        setUser(u || { email: "demo@kerana.app" });
        setAuthOpen(false);
        setSignUpOpen(false);
    }
    const handleLogout = () => setUser(null);
    const switchToSignUp = () => { setAuthOpen(false); setSignUpOpen(true); };
    const switchToSignIn = () => { setSignUpOpen(false); setAuthOpen(true); };

    // Tokens de color para ambos modos (solo colores; tamaños intactos)
    const TOKENS = inHero
        ? {
            headerBg: "transparent",
            headerText: "#111827",     // texto oscuro sobre hero
            border: "rgba(255,255,255,.15)",
            pillBg: "#ffffff",         // pills blancas arriba
            pillText: "#2563eb",
            pillBorder: "#e5e7eb",
            signBg: "#ffffff",
            signText: "#2563eb",
        }
        : {
            headerBg: "#ffffff",       // al scrollear: header blanco
            headerText: "#0b1e3a",
            border: "#e5e7eb",
            pillBg: "#2563eb",         // pills azules abajo
            pillText: "#ffffff",
            pillBorder: "#1e40af",
            signBg: "#2563eb",
            signText: "#ffffff",
        };

    // ——— estilos tal cual los tuyos, solo con colores dinámicos ———
    const pillReset = {
        all: "unset",
        display: "inline-block",
        cursor: "pointer",
    };

    const pillBox = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 9999,
        background: TOKENS.pillBg,            // ← dinámico
        border: `1px solid ${TOKENS.pillBorder}`,
        color: TOKENS.pillText,
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
        minWidth: 120, // esto le cambia el ancho a las burbujas (lo mantengo)
        height: 22,    // esto le sube la "altura" de las burbujas (lo mantengo)
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        lineHeight: 1
    };

    function PillLink({ to, children }) {
        return (
            <Link to={to} style={pillReset}>
                <span style={pillBox}>{children}</span>
            </Link>
        );
    }
    function PillButton({ onClick, children }) {
        return (
            <button type="button" onClick={onClick} style={pillReset}>
                <span style={pillBox}>{children}</span>
            </button>
        );
    }

    const signBtn = {
        height: 40,
        padding: "0 16px",
        borderRadius: 9999,
        background: TOKENS.signBg,           // ← dinámico
        color: TOKENS.signText,
        border: "1px solid transparent",
        fontWeight: 700,
        cursor: "pointer",
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
                    background: TOKENS.headerBg,    // ← dinámico
                    color: TOKENS.headerText,
                    borderBottom: `1px solid ${TOKENS.border}`,
                    transition: "background .25s ease, color .25s ease, border-color .25s ease",
                }}
            >
                <div
                    className="header-container"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        height: 64,
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
                                lineHeight: 1,
                                color: "inherit",
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
                                color: TOKENS.headerText, // ← hereda modo
                            }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: 3 botones (idénticos) */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                        <PillLink to="/upload">Subir Apuntes</PillLink>
                        <PillLink to="/about">¡Quiero ser mentor!</PillLink>
                        <PillButton onClick={handleReseniaClick}>¡Hacé tu reseña!</PillButton>
                    </nav>

                    {/* Derecha: Sign in / usuario */}
                    <div>
                        {!user ? (
                            <button onClick={() => setAuthOpen(true)} style={signBtn}>Sign in</button>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontWeight: 700 }}>{user.name || "Usuario"}</span>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        background: "#fff",
                                        color: "#0b1e3a",
                                        display: "grid",
                                        placeItems: "center",
                                        fontWeight: 800,
                                    }}
                                >
                                    {(user.email?.[0] || "U").toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Spacer para que el contenido no quede tapado por el header fijo */}
            <div style={{ height: 64 }} />

            {/* Sidebar + Modales (sin cambios) */}
            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={handleLogout} />
            <AuthModal_SignIn open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={handleSignedIn} onSwitchToSignUp={switchToSignUp} />
            <AuthModal_SignUp open={signUpOpen} onClose={() => setSignUpOpen(false)} onSignedIn={handleSignedIn} onSwitchToSignIn={switchToSignIn} />
            <AuthModal_HacerResenia open={reseniaOpen} onClose={() => setReseniaOpen(false)} onSave={handleReseniaSubmit} />
        </>
    );
}
