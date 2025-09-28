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
            signBorder: "#e5e7eb", // ← Agregar esta línea

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
            signBorder: "#1e40af", // ← Agregar esta línea

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
        minWidth: 125, // esto le cambia el ancho a las burbujas (lo mantengo)
        height: 23,    // esto le sube la "altura" de las burbujas (lo mantengo)
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        lineHeight: 1,
        transition: "all 0.3s ease", // Agregamos transición para el efecto suave
        transform: "translateY(0px)",   // Agregamos transform para el efecto de elevación


    };
    // También necesitas agregar estas funciones para manejar el hover:
    const handleMouseEnter = (e) => {
        if (inHero) {
            // Si estamos en hero: de blanco a azul
            e.target.style.background = "#2563eb";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "#1e40af";
        } else {
            // Si estamos scrolleados: de azul a blanco
            e.target.style.background = "#ffffff";
            e.target.style.color = "#2563eb";
            e.target.style.borderColor = "#e5e7eb";
        }
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.2)";
    };

    const handleMouseLeave = (e) => {
        // Restauramos los colores originales según el estado
        e.target.style.background = TOKENS.pillBg;
        e.target.style.color = TOKENS.pillText;
        e.target.style.borderColor = TOKENS.pillBorder;
        e.target.style.transform = "translateY(0px)";
        e.target.style.boxShadow = "none";
    };

// Y modifica tus componentes PillLink y PillButton así:
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
        background: TOKENS.signBg,           // ← dinámico
        color: TOKENS.signText,
        border: `1px solid ${TOKENS.signBorder}`, // ← Cambiar esta línea
        fontWeight: 700,
        cursor: "pointer",
         transition: "all 0.3s ease", // Agregamos transición para el efecto suave
        transform: "translateY(0px)", // Agregamos transform para el efecto de elevación
    };

    const handleSignInMouseEnter = (e) => {
        if (inHero) {
            // Si estamos en hero: de blanco a azul
            e.target.style.background = "#2563eb";
            e.target.style.color = "#ffffff";
            e.target.style.borderColor = "#1e40af";
        } else {
            // Si estamos scrolleados: de azul a blanco
            e.target.style.background = "#ffffff";
            e.target.style.color = "#2563eb";
            e.target.style.borderColor = "#e5e7eb";
        }
        e.target.style.transform = "translateY(-2px)";
        e.target.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.2)";
    };

    const handleSignInMouseLeave = (e) => {
        // Restauramos los colores originales según el estado
        e.target.style.background = TOKENS.signBg;
        e.target.style.color = TOKENS.signText;
        e.target.style.borderColor = TOKENS.signBorder; // ← Cambiar esta línea
        e.target.style.transform = "translateY(0px)";
        e.target.style.boxShadow = "none";
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
