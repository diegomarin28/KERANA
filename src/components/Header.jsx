import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthModal_SignIn from "../components/AuthModal_SignIn.jsx";
import AuthModal_HacerResenia from "../components/AuthModal_HacerResenia.jsx";
import Sidebar from "../components/Sidebar.jsx";
import HamburgerButton from "../components/HamburgerButton.jsx";
import { supabase } from "../supabase";
import { fetchUserProfile, cleanLogout } from "../utils/authHelpers";
import NotificationBadge from "../components/NotificationBadge";
import { useSeguidores } from "../hooks/useSeguidores";
import { useAvatar } from '../contexts/AvatarContext';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { useSidebarStats } from '../hooks/useSidebarStats';
import { useMentorStatus } from '../hooks/useMentorStatus';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faBookmark,
    faDownload,
    faCreditCard,
    faQuestionCircle,
    faCog,
} from '@fortawesome/free-solid-svg-icons';

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
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const avatarBtnRef = useRef(null);
    const avatarMenuRef = useRef(null);
    const [followStats, setFollowStats] = useState({ seguidores: 0, siguiendo: 0 });
    const { obtenerContadores } = useSeguidores();
    const { updateTrigger } = useAvatar();
    const [avatarLoading, setAvatarLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { credits, seguidores, siguiendo, apuntes } = useSidebarStats();
    const headerStats = useSidebarStats();
    const { isMentor, loading: mentorLoading } = useMentorStatus(true);

    const openAuthModal = () => setAuthOpen(true);
    const closeAuthModal = () => setAuthOpen(false);

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
        if (user?.id) loadUserProfile();
    }, [location.pathname, updateTrigger]);

    useEffect(() => {
        const computeDisplayName = () => {
            const n = (userProfile?.nombre || "").trim();
            if (n) return n;
            const u = (userProfile?.username || "").trim();
            if (u) return u;
            if (!userProfile && nameCache) return nameCache;
            if (!userProfile && usernameCache) return usernameCache;
            return user?.email ? user.email.split("@")[0] : "";
        };
        setDisplayName(computeDisplayName());
    }, [userProfile, user, nameCache, usernameCache]);

    useEffect(() => {
        if (userProfile?.id_usuario) {
            loadFollowStats();
        }
    }, [userProfile?.id_usuario]);

    const loadFollowStats = async () => {
        if (!userProfile?.id_usuario) return;
        const stats = await obtenerContadores(userProfile.id_usuario);
        setFollowStats(stats);
    };

    useEffect(() => {
        if (!avatarMenuOpen) return;
        const onKey = (e) => e.key === "Escape" && setAvatarMenuOpen(false);
        const onClick = (e) => {
            const m = avatarMenuRef.current, b = avatarBtnRef.current;
            if (m && !m.contains(e.target) && b && !b.contains(e.target)) setAvatarMenuOpen(false);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
        };
    }, [avatarMenuOpen]);

    const go = (path) => {
        navigate(path);
        setAvatarMenuOpen(false);
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn("[auth] getSession error:", error);
                    return;
                }
                if (session?.user && mounted) {
                    setUser(session.user);
                    await loadUserProfile(session.user);
                }
            } catch (err) {
                console.warn("[auth] initializeAuth error:", err);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;
            if (session?.user) {
                setUser(session.user);
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

    // Listener para actualización de créditos en tiempo real
    useEffect(() => {
        const handleCreditsUpdate = () => {
            loadUserProfile(); // Recarga el perfil para actualizar créditos
        };

        window.addEventListener('creditsUpdated', handleCreditsUpdate);
        return () => window.removeEventListener('creditsUpdated', handleCreditsUpdate);
    }, [user?.id]);

    useEffect(() => {
        if (user && userProfile === null) {
            loadUserProfile();
        }
    }, [user]);

    const loadUserProfile = async (authUser = null) => {
        const userToUse = authUser || user;
        if (!userToUse) {
            setUserProfile(null);
            setDisplayName('');
            return;
        }

        const { data, error } = await fetchUserProfile();
        if (error) {
            console.warn("[Header] Error cargando perfil:", error);
            return;
        }
        if (!data) {
            return;
        }

        setUserProfile(data);
        setAvatarLoading(false);

        if (data.username && data.username !== usernameCache) {
            localStorage.setItem("kerana_username_cache", data.username);
            setUsernameCache(data.username);
        }
        if (data.nombre && data.nombre !== nameCache) {
            localStorage.setItem("kerana_name_cache", data.nombre);
            setNameCache(data.nombre);
        }
    };

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
            setUser(null);
            setUserProfile(null);
            setDisplayName('');
            setMenuOpen(false);
            navigate('/');
        }
    };

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
            headerBg: "#f8fbff",           // ❄️ Azul hielo muy claro
            headerText: "#0f172a",          // Texto oscuro
            border: "#d4e4f7",              // Borde azul hielo
            pillBg: "#ffffff",              // Pills blancos
            pillText: "#13346b",            // Texto azul oscuro
            pillBorder: "#13346b",          // Borde azul oscuro
            signBg: "#ffffff",              // Botón blanco
            signText: "#13346b",            // Texto azul oscuro
            signBorder: "#13346b",          // Borde azul oscuro
            boxShadow: "0 2px 12px rgba(19, 52, 107, 0.08)",  // Sombra azulada sutil
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
        fontFamily: 'Inter, sans-serif',
        textDecoration: "none",
        whiteSpace: "nowrap",
        minWidth: 125,
        height: 36,
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
        height: 40,
        padding: "0 20px",
        borderRadius: 9999,
        background: TOKENS.signBg,
        color: TOKENS.signText,
        border: `1px solid ${TOKENS.signBorder}`,
        fontWeight: 700,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
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

    function getAppAvatarSrc(raw) {
        const url = (raw || "").trim();
        if (!url) return "";
        const isValidUrl = /^https?:\/\/.+/.test(url);
        return isValidUrl ? url : "";
    }

    const iconButtonStyle = inHero
        ? {
            // EN HERO (azul oscuro)
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#ffffff",
            cursor: "pointer",
            padding: 0,
            outline: "none",
            transition: "all 0.2s ease",
        }
        : {
            // AL SCROLLEAR (hielo)
            width: 40,
            height: 40,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "#ffffff",
            border: "2px solid #13346b",
            color: "#13346b",
            cursor: "pointer",
            padding: 0,
            outline: "none",
            transition: "all 0.2s ease",
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
                        display: "grid",
                        alignItems: "center",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: 16,
                        height: 64,
                        padding: "0 20px",
                        maxWidth: 1400,
                        margin: "0 auto",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
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
                                letterSpacing: "0.5px",
                                fontFamily: 'Inter, sans-serif',
                            }}
                            aria-label="Ir al inicio"
                        >
                            KERANA
                        </button>

                        {user && userProfile && (
                            <button
                                onClick={() => navigate("/mis-creditos")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "6px 14px",
                                    borderRadius: 20,
                                    background: inHero ? "rgba(255,255,255,0.15)" : "#ffffff",
                                    border: inHero ? "1px solid rgba(255,255,255,0.25)" : "2px solid #13346b",
                                    color: TOKENS.headerText,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    fontFamily: 'Inter, sans-serif',
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (inHero) {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                                    } else {
                                        e.currentTarget.style.background = "#f8fafc";
                                        e.currentTarget.style.borderColor = "#2563eb";
                                    }
                                    e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = inHero ? "rgba(255,255,255,0.15)" : "#ffffff";
                                    e.currentTarget.style.borderColor = inHero ? "rgba(255,255,255,0.25)" : "#13346b";
                                    e.currentTarget.style.transform = "scale(1)";
                                }}
                                aria-label="Ver mis créditos"
                            >
                                <span style={{ fontSize: 16 }}>💳</span>
                                <span>{userProfile.creditos || 0}</span>
                            </button>
                        )}
                    </div>

                    <nav style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}>
                        {mentorLoading ? (
                            <>
                                <span style={{
                                    ...pillBox,
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.5s infinite',
                                    color: 'transparent',
                                    pointerEvents: 'none',
                                    border: '1px solid #13346b'
                                }}>
                                    Subir Apuntes
                                </span>
                                <span style={{
                                    ...pillBox,
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.5s infinite',
                                    color: 'transparent',
                                    pointerEvents: 'none',
                                    border: '1px solid #13346b'
                                }}>
                                    ¡Quiero ser Mentor!
                                </span>
                                <span style={{
                                    ...pillBox,
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.5s infinite',
                                    color: 'transparent',
                                    pointerEvents: 'none',
                                    border: '1px solid #13346b'
                                }}>
                                    ¡Hacé tu reseña!
                                </span>
                            </>
                        ) : (
                            <>
                                <PillLink to="/upload">Subir Apuntes</PillLink>

                                {isMentor ? (
                                    <PillButton onClick={() => navigate("/mentor/courses")}>
                                        Mis Mentorías
                                    </PillButton>
                                ) : (
                                    <PillButton onClick={() => navigate("/mentores/postular")}>
                                        ¡Quiero ser Mentor!
                                    </PillButton>
                                )}

                                <PillButton onClick={handleReseniaClick}>
                                    ¡Hacé tu reseña!
                                </PillButton>
                            </>
                        )}
                    </nav>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                        {!user ? (
                            <HeaderAuthButtons />
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate("/favorites")}
                                    aria-label="Favoritos"
                                    style={iconButtonStyle}
                                    onMouseEnter={(e) => {
                                        if (inHero) {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                                        } else {
                                            e.currentTarget.style.background = "#f8fafc";
                                            e.currentTarget.style.borderColor = "#2563eb";
                                        }
                                        e.currentTarget.style.transform = "scale(1.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = iconButtonStyle.background;
                                        e.currentTarget.style.borderColor = inHero ? "rgba(255,255,255,0.2)" : "#13346b";
                                        e.currentTarget.style.transform = "scale(1)";
                                    }}
                                >
                                    <FontAwesomeIcon icon={faBookmark} style={{ fontSize: 16 }} />
                                </button>

                                <NotificationBadge inHero={inHero} />

                                <div style={{ position: "relative" }}>
                                    <button
                                        ref={avatarBtnRef}
                                        onClick={() => setAvatarMenuOpen((o) => !o)}
                                        style={{
                                            ...iconButtonStyle,
                                            padding: 0,
                                            overflow: "hidden",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (inHero) {
                                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                                            } else {
                                                e.currentTarget.style.borderColor = "#2563eb";
                                                e.currentTarget.style.background = "#f8fafc";
                                            }
                                            e.currentTarget.style.transform = "scale(1.05)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = iconButtonStyle.background;
                                            e.currentTarget.style.borderColor = inHero ? "rgba(255,255,255,0.2)" : "#13346b";
                                            e.currentTarget.style.transform = "scale(1)";
                                        }}
                                        aria-haspopup="menu"
                                        aria-expanded={avatarMenuOpen ? "true" : "false"}
                                        aria-label="Abrir menú de usuario"
                                    >
                                        {avatarLoading ? (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)",
                                                    backgroundSize: "200% 100%",
                                                    animation: "shimmer 1.5s infinite",
                                                }}
                                            />
                                        ) : (() => {
                                            const avatarSrc = getAppAvatarSrc(userProfile?.foto);
                                            return avatarSrc && avatarOk ? (
                                                <img
                                                    src={avatarSrc}
                                                    alt={displayName}
                                                    onError={() => setAvatarOk(false)}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                                        color: "#fff",
                                                        display: "grid",
                                                        placeItems: "center",
                                                        fontWeight: 800,
                                                        fontSize: 16,
                                                        fontFamily: 'Inter, sans-serif',
                                                    }}
                                                >
                                                    {(displayName?.[0] || "U").toUpperCase()}
                                                </div>
                                            );
                                        })()}
                                    </button>

                                    {avatarMenuOpen && (
                                        <div
                                            ref={avatarMenuRef}
                                            role="menu"
                                            style={{
                                                position: "absolute",
                                                right: 0,
                                                top: "calc(100% + 12px)",
                                                width: 320,
                                                background: "#ffffff",
                                                color: "#0f172a",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: 16,
                                                boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
                                                padding: 0,
                                                zIndex: 1100,
                                                overflow: "hidden",
                                                animation: "dropdownSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                                            }}
                                        >
                                            {/* Triangulito */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    right: 14,
                                                    top: -6,
                                                    width: 12,
                                                    height: 12,
                                                    background: "#fff",
                                                    borderLeft: "1px solid #e2e8f0",
                                                    borderTop: "1px solid #e2e8f0",
                                                    transform: "rotate(45deg)",
                                                    zIndex: -1,
                                                }}
                                            />

                                            {/* Header mejorado */}
                                            <div style={{
                                                background: "#f8fafc",
                                                padding: "20px",
                                                borderBottom: "1px solid #e2e8f0",
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 14,
                                                    marginBottom: 16,
                                                }}>
                                                    {(() => {
                                                        const avatarSrc = getAppAvatarSrc(userProfile?.foto);
                                                        return avatarSrc && avatarOk ? (
                                                            <img
                                                                src={avatarSrc}
                                                                alt={displayName}
                                                                onError={() => setAvatarOk(false)}
                                                                style={{
                                                                    width: 52,
                                                                    height: 52,
                                                                    borderRadius: "50%",
                                                                    objectFit: "cover",
                                                                    border: "3px solid #fff",
                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: 52,
                                                                    height: 52,
                                                                    borderRadius: "50%",
                                                                    background: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                                                                    border: "3px solid #fff",
                                                                    color: "#fff",
                                                                    display: "grid",
                                                                    placeItems: "center",
                                                                    fontWeight: 800,
                                                                    fontSize: 20,
                                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                                    fontFamily: 'Inter, sans-serif',
                                                                }}
                                                            >
                                                                {(displayName?.[0] || "U").toUpperCase()}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontWeight: 700,
                                                            fontSize: 16,
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            marginBottom: 4,
                                                            fontFamily: 'Inter, sans-serif',
                                                            color: '#0f172a',
                                                        }}>
                                                            {displayName}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 13,
                                                            color: '#64748b',
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            fontFamily: 'Inter, sans-serif',
                                                        }}>
                                                            {userProfile?.username ? `@${userProfile.username}` : user?.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats de seguidores */}
                                                <div style={{
                                                    display: "flex",
                                                    gap: 20,
                                                    paddingTop: 12,
                                                    borderTop: "1px solid #e2e8f0",
                                                }}>
                                                    <div style={{ flex: 1, textAlign: "center" }}>
                                                        <div style={{
                                                            fontSize: 20,
                                                            fontWeight: 700,
                                                            marginBottom: 2,
                                                            fontFamily: 'Inter, sans-serif',
                                                            color: '#0f172a',
                                                        }}>
                                                            {headerStats.seguidores}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 12,
                                                            color: '#64748b',
                                                            fontFamily: 'Inter, sans-serif',
                                                        }}>
                                                            Seguidores
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        width: 1,
                                                        background: "#e2e8f0",
                                                    }} />
                                                    <div style={{ flex: 1, textAlign: "center" }}>
                                                        <div style={{
                                                            fontSize: 20,
                                                            fontWeight: 700,
                                                            marginBottom: 2,
                                                            fontFamily: 'Inter, sans-serif',
                                                            color: '#0f172a',
                                                        }}>
                                                            {headerStats.siguiendo}
                                                        </div>
                                                        <div style={{
                                                            fontSize: 12,
                                                            color: '#64748b',
                                                            fontFamily: 'Inter, sans-serif',
                                                        }}>
                                                            Siguiendo
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu items */}
                                            <div style={{ padding: "8px" }}>
                                                <MenuItem
                                                    icon={<FontAwesomeIcon icon={faUser} />}
                                                    label="Mi perfil"
                                                    onClick={() => go("/profile")}
                                                />
                                                <MenuItem
                                                    icon={<FontAwesomeIcon icon={faDownload} />}
                                                    label="Descargas"
                                                    onClick={() => go("/purchased")}
                                                />
                                                <MenuItem
                                                    icon={<FontAwesomeIcon icon={faCog} />}
                                                    label="Ajustes"
                                                    onClick={() => go("/settings")}
                                                />

                                                <div style={{
                                                    height: 1,
                                                    background: "#f1f5f9",
                                                    margin: "8px 4px",
                                                }} />

                                                <MenuItem
                                                    icon={<FontAwesomeIcon icon={faCreditCard} />}
                                                    label="Mis créditos"
                                                    badge={userProfile?.creditos || 0}
                                                    onClick={() => go("/mis-creditos")}
                                                />

                                                <div style={{
                                                    height: 1,
                                                    background: "#f1f5f9",
                                                    margin: "8px 4px",
                                                }} />

                                                <MenuItem
                                                    icon={<FontAwesomeIcon icon={faQuestionCircle} />}
                                                    label="Ayuda"
                                                    onClick={() => go("/help-center")}
                                                />
                                            </div>

                                            {/* Cerrar sesión */}
                                            <div style={{ padding: "8px 12px 12px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowLogoutConfirm(true);
                                                        setAvatarMenuOpen(false);
                                                    }}
                                                    style={{
                                                        all: "unset",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        width: "100%",
                                                        height: 42,
                                                        borderRadius: 10,
                                                        cursor: "pointer",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        color: "#dc2626",
                                                        background: "rgba(220,38,38,0.08)",
                                                        border: "1px solid rgba(220,38,38,0.15)",
                                                        transition: "all .15s ease",
                                                        fontFamily: 'Inter, sans-serif',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "rgba(220,38,38,0.12)";
                                                        e.currentTarget.style.borderColor = "rgba(220,38,38,0.25)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "rgba(220,38,38,0.08)";
                                                        e.currentTarget.style.borderColor = "rgba(220,38,38,0.15)";
                                                    }}
                                                >
                                                    Cerrar sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div style={{ height: 64 }} />

            <Sidebar
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                isAuthenticated={!!user}
                stats={{ credits, seguidores, siguiendo, apuntes }}
                isMentor={isMentor}
                mentorLoading={mentorLoading}
                user={
                    user
                        ? {
                            name: displayName,
                            email: user.email,
                            avatarUrl: getAppAvatarSrc(userProfile?.foto) || null,
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
            <LogoutConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                    setAvatarMenuOpen(false);
                }}
            />

            <style>{`
                @keyframes dropdownSlide {
                    from {
                        opacity: 0;
                        transform: translateY(-12px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }
            `}</style>
        </>
    );
}

// Componente MenuItem mejorado
function MenuItem({ icon, label, badge, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                all: "unset",
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                color: "#334155",
                transition: "all .12s ease",
                position: "relative",
                fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#0f172a";
                e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#334155";
                e.currentTarget.style.transform = "translateX(0)";
            }}
        >
            <div style={{
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: '#64748b',
                fontSize: 16,
            }}>
                {icon}
            </div>
            <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
            {badge !== undefined && (
                <span style={{
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    minWidth: 24,
                    textAlign: "center",
                    fontFamily: 'Inter, sans-serif',
                }}>
                    {badge}
                </span>
            )}
        </button>
    );
}