import { useEffect, useState, useRef } from "react";
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
    const [inHero, setInHero] = useState(true);
    const navigate = useNavigate();
    const headerRef = useRef(null);

    // === Trigger: cambia cuando pasás ~1 pantalla (independiente del Home) ===
    useEffect(() => {
        const update = () => {
            const headerH = headerRef.current?.offsetHeight ?? 64;
            const sentinel = document.getElementById("after-hero"); // ← BUSCAR EN CADA TICK
            const top = sentinel ? sentinel.getBoundingClientRect().top : Infinity;

            const offset = 0; // px antes de que la sección toque el header (ajustá a gusto)
            // Mientras la próxima sección aún no “entra” en el área del header + offset → seguimos en modo inHero
            setInHero(top > headerH + offset);
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        window.addEventListener("load", update);
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            window.removeEventListener("load", update);
        };
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

    // Colores
    const TOKENS = inHero
        ? {
            headerBg: "#1b2e3a",  // azul claro (tu elección)
            headerText: "#ffffff",
            border: "transparent", // sin borde para evitar corte
            pillBg: "#ffffff",     // burbujas blancas
            pillText: "#2563eb",
            pillBorder: "#e5e7eb",
            signBg: "#ffffff",
            signText: "#2563eb",
            signBorder: "#e5e7eb",
        }
        : {
            headerBg: "#2563eb",  // azul oscuro
            headerText: "#ffffff",
            border: "transparent", // sin borde
            pillBg: "#2563eb",     // burbujas azules
            pillText: "#ffffff",
            pillBorder: "#1e40af",
            signBg: "#2563eb",
            signText: "#ffffff",
            signBorder: "#1e40af",
        };

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
        background: TOKENS.pillBg,
        border: `1px solid ${TOKENS.pillBorder}`,
        color: TOKENS.pillText,
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
        minWidth: 125,
        height: 23,
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        lineHeight: 1,
        transition: "all 0.3s ease",
        transform: "translateY(0px)",
    };

    const handleMouseEnter = (e) => {
        if (inHero) {
            e.target.style.background = "#2563eb";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "#1e40af";
        } else {
            e.target.style.background = "#ffffff";
            e.target.style.color = "#2563eb";
            e.target.style.borderColor = "#e5e7eb";
        }
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.2)";
    };

    const handleMouseLeave = (e) => {
        e.target.style.background = TOKENS.pillBg;
        e.target.style.color = TOKENS.pillText;
        e.target.style.borderColor = TOKENS.pillBorder;
        e.target.style.transform = "translateY(0px)";
        e.target.style.boxShadow = "none";
    };

    function PillLink({ to, children }) {
        return (
            <Link to={to} style={pillReset}>
        <span
            style={pillBox}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
          {children}
        </span>
            </Link>
        );
    }

    function PillButton({ onClick, children }) {
        return (
            <button type="button" onClick={onClick} style={pillReset}>
        <span
            style={pillBox}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
          {children}
        </span>
            </button>
        );
    }

    const signBtn = {
        height: 40,
        padding: "0 16px",
        borderRadius: 9999,
        background: TOKENS.signBg,
        color: TOKENS.signText,
        border: `1px solid ${TOKENS.signBorder}`,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: "translateY(0px)",
    };

    const handleSignInMouseEnter = (e) => {
        if (inHero) {
            e.target.style.background = "#2563eb";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "#1e40af";
        } else {
            e.target.style.background = "#ffffff";
            e.target.style.color = "#2563eb";
            e.target.style.borderColor = "#e5e7eb";
        }
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.2)";
    };

    const handleSignInMouseLeave = (e) => {
        e.target.style.background = TOKENS.signBg;
        e.target.style.color = TOKENS.signText;
        e.target.style.borderColor = TOKENS.signBorder;
        e.target.style.transform = "translateY(0px)";
        e.target.style.boxShadow = "none";
    };

    return (
        <>
            <header
                ref={headerRef}
                style={{
                    width: "100%",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    background: TOKENS.headerBg,
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
                                color: TOKENS.headerText,
                            }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>
                    </div>

                    {/* Centro: acciones */}
                    <nav style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                        <PillLink to="/upload">Subir Apuntes</PillLink>
                        <PillLink to="/about">¡Quiero ser mentor!</PillLink>
                        <PillButton onClick={handleReseniaClick}>¡Hacé tu reseña!</PillButton>
                    </nav>

                    {/* Derecha: Sign in / usuario */}
                    <div>
                        {!user ? (
                            <button
                                onClick={() => setAuthOpen(true)}
                                style={signBtn}
                                onMouseEnter={handleSignInMouseEnter}
                                onMouseLeave={handleSignInMouseLeave}
                            >
                                Sign in
                            </button>
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

            {/* Spacer */}
            <div style={{ height: 64 }} />

            {/* Sidebar + Modales */}
            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} onLogout={handleLogout} />
            <AuthModal_SignIn open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={handleSignedIn} onSwitchToSignUp={switchToSignUp} />
            <AuthModal_SignUp open={signUpOpen} onClose={() => setSignUpOpen(false)} onSignedIn={handleSignedIn} onSwitchToSignIn={switchToSignIn} />
            <AuthModal_HacerResenia open={reseniaOpen} onClose={() => setReseniaOpen(false)} onSave={handleReseniaSubmit} />
        </>
    );
}
