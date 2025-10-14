// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import AuthGuard from "./components/AuthGuard";
import Equipo from "./pages/Equipo";
import { AvatarProvider } from './contexts/AvatarContext';

// Componentes lazy
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ProfessorDetail = lazy(() => import("./pages/ProfessorDetail"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Upload = lazy(() => import("./pages/Upload"));
const MentorApply = lazy(() => import("./pages/MentorApply"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const CourseSearch = lazy(() => import("./components/CourseSearch"));
const MisionVision = lazy(() => import("./pages/MisionVision"));
const MyMentorships = lazy(() => import("./pages/MyMentorships"));
const MyCalendar = lazy(() => import('./pages/mentor/MyCalendar'));
const IAmMentor = lazy(() => import('./pages/mentor/IAmMentor'));
const MyStudents = lazy(() => import('./pages/mentor/MyStudents'));
const Professors = lazy(() => import("./pages/Professors"));
const Mentors = lazy(() => import("./pages/Mentors"));
const Notes = lazy(() => import("./pages/Notes"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Suggestions = lazy(() => import("./pages/Suggestions"));
const AmbientalImpact = lazy(() => import("./pages/AmbientalImpact"));
const Subjects = lazy(() => import("./pages/Subjects"));
const Purchased = lazy(() => import("./pages/Purchased"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MyPapers = lazy(() => import("./pages/MyPapers"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const NotificationBadge = lazy(() => import("./components/NotificationBadge"));
const UserCard = lazy(() => import("./components/UserCard"));

// Componentes cargados inmediatamente
import AuthConfirm from './pages/AuthConfirm';
import AuthModal_SignIn from "./components/AuthModal_SignIn";
import PrivacyBanner from './components/PrivacyBanner';
import { NotificationProvider } from "./components/NotificationProvider";
import FollowersTest from "./pages/FollowersTest";
import { NotificationsProvider } from './contexts/NotificationsContext';
import NotificationsRealtimeSubscriber from "./components/NotificationsRealtimeSubscriber";

const LoadingSpinner = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", flexDirection: "column", gap: 16 }}>
        <div
            style={{
                width: 40,
                height: 40,
                border: "3px solid #f3f4f6",
                borderTop: "3px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
            }}
        />
        <div>Cargando…</div>
    </div>
);

function RouteDebugger() {
    const location = useLocation();
    useEffect(() => {
        console.log("Ruta actual:", location.pathname + location.search);
    }, [location]);
    return null;
}

function AppRoutes() {
    const location = useLocation();
    const navigate = useNavigate();

    const params = new URLSearchParams(location.search);
    const openAuth = params.get("auth") === "signin" || params.get("completeProfile") === "1";
    const returnUrl = params.get("return") || "/";

    const closeAuth = () => {
        const newParams = new URLSearchParams(location.search);
        newParams.delete("auth");
        newParams.delete("completeProfile");
        newParams.delete("return");
        navigate(`${location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`, { replace: true });
    };

    useEffect(() => {
        const checkRememberMe = () => {
            const rememberMe = JSON.parse(localStorage.getItem("kerana_remember") || "false");
            if (!rememberMe) {
                const handleBeforeUnload = () => {
                    supabase.auth.signOut();
                };
                window.addEventListener('beforeunload', handleBeforeUnload);
                return () => window.removeEventListener('beforeunload', handleBeforeUnload);
            }
        };
        checkRememberMe();
    }, []);

    const handleSignedIn = () => {
        closeAuth();
        navigate(returnUrl);
    };

    return (
        <>
            <Header />
            <RouteDebugger />

            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    {/* Principal */}
                    <Route path="/" element={<Home />} />
                    <Route path="/impacto-ambiental" element={<AmbientalImpact />} />

                    {/* Notificaciones */}
                    <Route path="/notifications" element={<AuthGuard requireAuth={true}><Notifications /></AuthGuard>} />
                    <Route path="/notifications-badge" element={<NotificationBadge />} />

                    {/* Settings - NUEVA RUTA */}
                    <Route path="/settings" element={<AuthGuard requireAuth={true}><Settings /></AuthGuard>} />

                    {/* Búsqueda y exploración */}
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/cursos/buscar" element={<CourseSearch />} />
                    <Route path="/test/followers" element={<FollowersTest />} />

                    {/* Mentoría */}
                    <Route path="/mentor/calendar" element={<MyCalendar />} />
                    <Route path="/mentor/courses" element={<IAmMentor />} />
                    <Route path="/mentor/students" element={<MyStudents />} />
                    <Route path="/mentor/my-mentorships" element={<AuthGuard requireAuth={true}><MyMentorships /></AuthGuard>} />

                    {/* Detalles */}
                    <Route path="/profesores/:id" element={<ProfessorDetail />} />
                    <Route path="/cursos/:id" element={<CourseDetail />} />

                    {/* Usuario - PROTEGIDAS */}
                    <Route path="/profile" element={<AuthGuard requireAuth={true}><Profile /></AuthGuard>} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/panel" element={<AuthGuard requireAuth={true}><UserDashboard /></AuthGuard>} />
                    <Route path="/user-card" element={<UserCard />} />

                    {/* Footer home */}
                    <Route path="/mision-vision" element={<MisionVision />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/suggestions" element={<Suggestions />} />

                    {/* Recursos del usuario - PROTEGIDAS */}
                    <Route path="/purchased" element={<AuthGuard requireAuth={true}><Purchased /></AuthGuard>} />
                    <Route path="/favorites" element={<AuthGuard requireAuth={true}><Favorites /></AuthGuard>} />
                    <Route path="/my_papers" element={<AuthGuard requireAuth={true}><MyPapers /></AuthGuard>} />

                    {/* Varios */}
                    <Route path="/equipo" element={<Equipo />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/professors" element={<Professors />} />
                    <Route path="/mentors" element={<Mentors />} />
                    <Route path="/notes" element={<Notes />} />

                    {/* Autenticación */}
                    <Route path="/signin" element={<Navigate to="/?auth=signin" replace />} />
                    <Route path="/auth/confirm" element={<AuthConfirm />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    <Route path="/help-center" element={<HelpCenter />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />

                    {/* Funcionalidades */}
                    <Route path="/upload" element={<AuthGuard requireAuth={true}><Upload /></AuthGuard>} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/mentores/postular" element={<AuthGuard requireAuth={true}><MentorApply /></AuthGuard>} />

                    {/* 404 */}
                    <Route path="*" element={
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <h1>404 - Página no encontrada</h1>
                            <p>La página que buscas no existe.</p>
                        </div>
                    } />
                </Routes>
            </Suspense>

            {/* Modal de autenticación controlado por query param */}
            <AuthModal_SignIn
                open={openAuth}
                onClose={closeAuth}
                onSignedIn={closeAuth}
            />
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AvatarProvider>
            <NotificationProvider>
                <NotificationsProvider>
                    <NotificationsRealtimeSubscriber />
                    <PrivacyBanner />
                    <AppRoutes />
                </NotificationsProvider>
            </NotificationProvider>
            </AvatarProvider>
        </BrowserRouter>
    );
}