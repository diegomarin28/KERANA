import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_HacerResenia from "../components/AuthModal_HacerReseña.jsx";
import Sidebar from "../components/Sidebar.jsx";
import HamburgerButton from "../components/HamburgerButton.jsx";
import { supabase } from "../supabase";
import { fetchUserProfile, cleanLogout } from "../utils/authHelpers";
import NotificationBadge from "../components/NotificationBadge";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [reseniaOpen, setReseniaOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [inHero, setInHero] = useState(true);
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const location = useLocation();
    const [usernameCache, setUsernameCache] = useState(() => localStorage.getItem('kerana_username_cache') || '');
    const [nameCache, setNameCache] = useState(() => localStorage.getItem('kerana_name_cache') || '');
    const [displayName, setDisplayName] = useState('');
    const [avatarOk, setAvatarOk] = useState(true);


    // Función unificada para abrir login
    const openAuthModal = () => {
        setAuthOpen(true);
    };

    // Función unificada para cerrar login
    const closeAuthModal = () => {
        setAuthOpen(false);
    };

    useEffect(() => {
        if (user?.id) loadUserProfile();
    }, [location.pathname]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'kerana_profile_updated' && user?.id) {
                loadUserProfile();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [user?.id]);

    useEffect(() => {
        setAvatarOk(true);
    }, [userProfile?.foto]);


    // Calcular displayName cuando cambien los datos
    useEffect(() => {
        const computeDisplayName = () => {
            // Prioridad: DB.nombre > DB.username > email local-part > cache
            const n = (userProfile?.nombre || "").trim();
            if (n) return n;

            const u = (userProfile?.username || "").trim();
            if (u) return u;

            // Si no hay userProfile aún, usar cache
            if (!userProfile && nameCache) return nameCache;
            if (!userProfile && usernameCache) return usernameCache;

            return user?.email ? user.email.split("@")[0] : "";
        };

        setDisplayName(computeDisplayName());
    }, [userProfile, user, nameCache, usernameCache]);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn("[auth] getSession error:", error);
                    return;
                }

                if (mounted && session?.user) {
                    setUser(session.user);
                    await loadUserProfile();
                }
            } catch (err) {
                console.warn("[auth] initializeAuth error:", err);
            }
        };

        initializeAuth();

        // Listener de cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            if (session?.user) {
                setUser(session.user);
                await loadUserProfile();
                closeAuthModal();
                setMenuOpen(false);
            } else {
                setUser(null);
                setUserProfile(null);
                setDisplayName('');
                setMenuOpen(false);
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    // Cargar perfil desde la DB (única fuente de verdad)
    const loadUserProfile = async () => {
        if (!user) {
            setUserProfile(null);
            setDisplayName('');
            return;
        }

        const { data, error } = await fetchUserProfile();
        if (error) {
            console.warn("[Header] Error cargando perfil:", error);
            return;
        }
        if (!data) return;

        setUserProfile(data);

        // Actualizar caches (solo si hay valores nuevos)
        if (data.username && data.username !== usernameCache) {
            localStorage.setItem("kerana_username_cache", data.username);
            setUsernameCache(data.username);
        }
        if (data.nombre && data.nombre !== nameCache) {
            localStorage.setItem("kerana_name_cache", data.nombre);
            setNameCache(data.nombre);
        }

        // El displayName se actualizará automáticamente por el useEffect
    };

    // Detectar si estamos en el hero
    useEffect(() => {
        const update = () => {
            const headerH = headerRef.current?.offsetHeight ?? 64;
            const sentinel = document.getElementById("after-hero");
            const top = sentinel ? sentinel.getBoundingClientRect().top : Infinity;
            setInHero(top > headerH);
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
        if (!user) {
            openAuthModal();
        } else {
            setReseniaOpen(true);
        }
    };

    const handleSignedIn = (u) => {
        closeAuthModal();
        setMenuOpen(false);
        if (u) {
            setUser(u);
            loadUserProfile();
        }
    };

    // Logout con limpieza completa
    const handleLogout = async () => {
        const { success } = await cleanLogout();

        if (success) {
            setUser(null);
            setUserProfile(null);
            setDisplayName('');
            setMenuOpen(false);
            closeAuthModal();
            setReseniaOpen(false);
            navigate('/');
        } else {
            // Fallback: limpiar estado de todas formas
            setUser(null);
            setUserProfile(null);
            setDisplayName('');
            setMenuOpen(false);
            navigate('/');
        }
    };

    // Colores del header
    const TOKENS = inHero
        ? {
            headerBg: "#13346b",
            headerText: "#ffffff",
            border: "transparent",
            pillBg: "#ffffff",
            pillText: "#2563eb",
            pillBorder: "#e5e7eb",
            signBg: "#ffffff",
            signText: "#2563eb",
            signBorder: "#e5e7eb",
        }
        : {
            headerBg: "#1b2e3a",
            headerText: "#ffffff",
            border: "transparent",
            pillBg: "#ffffff",
            pillText: "#1e40af",
            pillBorder: "#1e40af",
            signBg: "#ffffff",
            signText: "#1e40af",
            signBorder: "#1e40af",
        };

    const pillReset = { all: "unset", display: "inline-block", cursor: "pointer" };
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
                <span style={pillBox} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {children}
                </span>
            </Link>
        );
    }

    function PillButton({ onClick, children }) {
        return (
            <button type="button" onClick={onClick} style={pillReset}>
                <span style={pillBox} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {children}
                </span>
            </button>
        );
    }

    function HeaderAuthButtons() {
        return (
            <button
                type="button"
                onClick={openAuthModal}
                style={signBtn}
                onMouseEnter={handleSignInMouseEnter}
                onMouseLeave={handleSignInMouseLeave}
            >
                Iniciar sesión
            </button>
        );
    }

    const signBtn = {
        height: 40, padding: "0 16px", borderRadius: 9999,
        background: TOKENS.signBg, color: TOKENS.signText, border: `1px solid ${TOKENS.signBorder}`,
        fontWeight: 700, cursor: "pointer", transition: "all 0.3s ease", transform: "translateY(0px)",
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

    function getAppAvatarSrc(raw) {
        const url = (raw || "").trim();
        // aceptar solo URLs de tu storage público de Supabase
        const isHttp = /^https?:\/\//.test(url);
        const isSupabasePublic = isHttp && url.includes("/storage/v1/object/public/");
        return isSupabasePublic ? url : ""; // si no es válido, forzá placeholder
    }


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
                        <HamburgerButton open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
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
                        <PillButton onClick={() => navigate("/mentores/postular")}>¡Quiero ser Mentor!</PillButton>
                        <PillButton onClick={handleReseniaClick}>¡Hacé tu reseña!</PillButton>
                    </nav>

                    {/* Derecha */}
                    {/* Derecha */}
                    <div>
                        {!user ? (
                            <HeaderAuthButtons />
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                {/* 🔔 BADGE DE NOTIFICACIONES */}
                                <NotificationBadge />

                                {/* Nombre */}
                                <span style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: TOKENS.headerText,
                                }}>
                                {displayName}
                         </span>

                                {/* Avatar clickeable */}
                                <button
                                    onClick={() => navigate("/profile")}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        borderRadius: "50%",
                                        transition: "transform 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                    }}
                                    aria-label="Ir a mi perfil"
                                >
                                    {(() => {
                                        const avatarSrc = getAppAvatarSrc(userProfile?.foto);
                                        return avatarSrc && avatarOk ? (
                                            <img
                                                src={avatarSrc}
                                                alt={displayName}
                                                onError={() => setAvatarOk(false)}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    border: "2px solid #fff",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                                }}
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                                    color: "#fff",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    fontWeight: 800,
                                                    fontSize: 16,
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                                }}
                                            >
                                                {(displayName?.[0] || "U").toUpperCase()}
                                            </div>
                                        );
                                    })()}
                                </button>

                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Spacer */}
            <div style={{ height: 64 }} />

            {/* Sidebar + Modales */}
            <Sidebar
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                isAuthenticated={!!user}
                user={
                    user
                        ? {
                            name: displayName,
                            email: user.email,
                            avatarUrl: userProfile?.foto,
                            credits: userProfile?.creditos || 0,
                            followers: 0,
                            following: 0,
                        }
                        : null
                }
                onLogout={handleLogout}
                onGo={(path) => navigate(path)}
                onOpenAuth={openAuthModal}
            />
            <AuthModal_SignIn open={authOpen} onClose={closeAuthModal} onSignedIn={handleSignedIn} />
            <AuthModal_HacerResenia
                open={reseniaOpen}
                onClose={() => setReseniaOpen(false)}
                onSave={() => {}}
            />
        </>
    );
    }
