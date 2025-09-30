// src/components/SidebarPro.jsx
import { useEffect, useRef } from "react";

export default function SidebarPro({
                                       open,
                                       onClose,
                                       user,
                                       onLogout,
                                       onGo, // (path)=>void  -> usás navigate en el Header
                                   }) {
    const panelRef = useRef(null);
    const startX = useRef(0);

    // ——— Scroll-lock del body
    useEffect(() => {
        const prev = document.body.style.overflow;
        if (open) document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    // ——— Cerrar con ESC y click fuera
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
        const onClickOutside = (e) => {
            if (!panelRef.current) return;
            if (!panelRef.current.contains(e.target)) onClose?.();
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClickOutside);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, [open, onClose]);

    // ——— Focus trap simple
    useEffect(() => {
        if (!open) return;
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0], last = focusables[focusables.length - 1];
        first?.focus();
        const trap = (e) => {
            if (e.key !== "Tab") return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last?.focus(); return;
            }
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first?.focus(); return;
            }
        };
        panel.addEventListener("keydown", trap);
        return () => panel.removeEventListener("keydown", trap);
    }, [open]);

    // ——— Swipe para cerrar (mobile)
    const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
    const onTouchMove = (e) => {
        const dx = e.touches[0].clientX - startX.current;
        if (dx < -60) onClose?.();
    };

    const username = user?.name || "Invitado";
    const letter = (username[0] || "U").toUpperCase();
    const credits = user?.credits ?? 0;
    const followers = user?.followers ?? 0;
    const following = user?.following ?? 0;

    return (
        <>
            {/* Backdrop */}
            <div
                aria-hidden
                style={{
                    position: "fixed",
                    inset: 0,
                    background: open ? "rgba(0,0,0,.35)" : "transparent",
                    backdropFilter: open ? "saturate(120%) blur(6px)" : "none",
                    transition: "background .25s ease, backdrop-filter .25s ease",
                    pointerEvents: open ? "auto" : "none",
                    zIndex: 999,
                }}
            />
            {/* Panel */}
            <aside
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menú principal"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: "100dvh",
                    width: "min(88vw, 360px)",
                    background: "#0b1e3a",
                    color: "#fff",
                    boxShadow: "0 10px 30px rgba(0,0,0,.35)",
                    transform: open ? "translateX(0)" : "translateX(-110%)",
                    transition: "transform .28s ease",
                    zIndex: 1000,
                    display: "grid",
                    gridTemplateRows: "auto auto 1fr auto",
                }}
            >
                {/* Header del panel */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: "1px solid rgba(255,255,255,.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 800, letterSpacing: .5 }}>KERANA</div>
                        <span style={{ fontSize: 12, opacity: .75 }}>beta</span>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        style={{
                            all: "unset",
                            padding: "8px 10px",
                            cursor: "pointer",
                            borderRadius: 8,
                            background: "rgba(255,255,255,.08)",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Perfil compacto */}
                <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                    <button
                        type="button"
                        onClick={() => go("/profile")}
                        style={{
                            all: "unset",
                            width: "100%",
                            display: "grid",
                            gridTemplateColumns: "48px 1fr",
                            gap: 10,
                            alignItems: "center",
                            cursor: "pointer",
                        }}
                    >
                        {/* Avatar */}
                        {user?.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={username}
                                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", background: "#fff" }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 48, height: 48, borderRadius: "50%",
                                    background: "#fff", color: "#0b1e3a",
                                    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18
                                }}
                            >
                                {letter}
                            </div>
                        )}

                        {/* Nombre y stats */}
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                {username}
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 12, opacity: .9 }}>
                                <StatLink onClick={() => go("/profile/credits")} label="Créditos" value={credits} />
                                <StatLink onClick={() => go("/profile/followers")} label="Seguidores" value={followers} />
                                <StatLink onClick={() => go("/profile/following")} label="Seguidos" value={following} />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Navegación (sin buscador, sin subir/mentor/reseñas) */}
                <nav style={{ padding: 12, overflowY: "auto", display: "grid", gap: 14 }}>
                    <Group title="Explorar" />
                    <MenuLink label="Asignaturas" onClick={() => go("/subjects")} />

                    {/* Si querés, podés sumar otras secciones públicas acá (ranking, novedades, etc.) */}

                    <Group title="Cuenta" />
                    {user ? (
                        <>
                            <MenuLink label="Perfil" onClick={() => go("/profile")} />
                            <MenuLink label="Ajustes" onClick={() => go("/settings")} />
                            <DangerButton label="Cerrar sesión" onClick={() => { onLogout?.(); onClose?.(); }} />
                        </>
                    ) : (
                        <>
                            <PrimaryButton label="Iniciar sesión" onClick={() => go("/signin")} />
                            <SecondaryButton label="Crear cuenta" onClick={() => go("/signup")} />
                        </>
                    )}
                </nav>

                {/* Footer */}
                <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge>ES</Badge>
                    <span style={{ marginLeft: "auto", opacity: .6, fontSize: 12 }}>v0.1</span>
                </div>
            </aside>
        </>
    );

    // helpers
    function go(path) {
        onGo?.(path);
        onClose?.();
    }
}

/* ——— Subcomponentes ——— */

function Group({ title }) {
    return (
        <div style={{ margin: "6px 6px 0", fontSize: 12, letterSpacing: .3, textTransform: "uppercase", opacity: .65 }}>
            {title}
        </div>
    );
}

function MenuLink({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                all: "unset",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                color: "#fff",
                width: "100%",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: "rgba(255,255,255,.45)" }} />
            <span style={{ fontWeight: 600 }}>{label}</span>
        </button>
    );
}

function PrimaryButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width: "100%",
                height: 42,
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,.2)",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                margin: "6px 0",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

function SecondaryButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width: "100%",
                height: 42,
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,.25)",
                background: "rgba(255,255,255,.08)",
                color: "#fff",
                fontWeight: 700,
                margin: "6px 0",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

function DangerButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width: "100%",
                height: 42,
                borderRadius: 9999,
                border: "1px solid rgba(255,255,255,.25)",
                background: "rgba(255,255,255,.02)",
                color: "#fecaca",
                fontWeight: 700,
                margin: "6px 0",
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

function StatLink({ label, value, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: 8,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
            <strong style={{ fontWeight: 800 }}>{value}</strong>
            <span style={{ opacity: .85 }}>{label}</span>
        </button>
    );
}

function Badge({ children }) {
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            height: 28,
            padding: "0 10px",
            borderRadius: 9999,
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.18)",
            fontSize: 12,
            color: "#fff",
        }}>
      {children}
    </span>
    );
}
