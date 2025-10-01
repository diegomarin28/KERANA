// src/App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import AuthGuard from "./components/AuthGuard";
import Equipo from "./pages/Equipo";

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

// Componentes directos (sin lazy para evitar problemas)
import AuthConfirm from './pages/AuthConfirm';
import Purchased from './pages/Purchased';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import MyPapers from './pages/MyPapers'; // Cambié el nombre del archivo
import Settings from './pages/Settings';
import Subjects from './pages/Subjects';
import SignIn from './pages/SignIn';

const LoadingSpinner = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column',
        gap: 16
    }}>
        <div style={{
            width: 40,
            height: 40,
            border: "3px solid #f3f4f6",
            borderTop: "3px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
        }} />
        <div>Cargando...</div>
    </div>
);

function RouteDebugger() {
    const location = useLocation();

    useEffect(() => {
        console.log('Ruta actual:', location.pathname);
    }, [location]);

    return null;
}

export default function App() {
    return (
        <BrowserRouter>
            <Header />
            <RouteDebugger />
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    {/* Ruta Principal */}
                    <Route path="/" element={<Home />} />

                    {/* Rutas de Búsqueda y Exploración */}
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/cursos/buscar" element={<CourseSearch />} />

                    {/* Rutas de Detalles */}
                    <Route path="/profesores/:id" element={<ProfessorDetail />} />
                    <Route path="/cursos/:id" element={<CourseDetail />} />

                    {/* Rutas de Usuario - PROTEGIDAS */}
                    <Route path="/profile" element={
                        <AuthGuard requireAuth={true}>
                            <Profile />
                        </AuthGuard>
                    } />
                    <Route path="/settings" element={
                        <AuthGuard requireAuth={true}>
                            <Settings />
                        </AuthGuard>
                    } />
                    <Route path="/panel" element={
                        <AuthGuard requireAuth={true}>
                            <UserDashboard />
                        </AuthGuard>
                    } />
                    <Route path="/mision-vision" element={<MisionVision />} />

                    {/* Rutas de Recursos del Usuario - PROTEGIDAS */}
                    <Route path="/purchased" element={
                        <AuthGuard requireAuth={true}>
                            <Purchased />
                        </AuthGuard>
                    } />
                    <Route path="/favorites" element={
                        <AuthGuard requireAuth={true}>
                            <Favorites />
                        </AuthGuard>
                    } />
                    <Route path="/my_papers" element={ // Cambié la ruta
                        <AuthGuard requireAuth={true}>
                            <MyPapers />
                        </AuthGuard>
                    } />
                    <Route path="/equipo" element={<Equipo />} />

                    {/* Rutas de Exploración */}
                    <Route path="/subjects" element={<Subjects />} />

                    {/* Rutas de Autenticación */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/auth/confirm" element={<AuthConfirm />} />

                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />

                    {/* Rutas de Funcionalidades */}
                    <Route path="/upload" element={
                        <AuthGuard requireAuth={true}>
                            <Upload />
                        </AuthGuard>
                    } />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/mentores/postular" element={
                        <AuthGuard requireAuth={true}>
                            <MentorApply />
                        </AuthGuard>
                    } />

                    {/* Ruta 404 - Siempre al final */}
                    <Route path="*" element={
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <h1>404 - Página no encontrada</h1>
                            <p>La página que buscas no existe.</p>
                        </div>
                    } />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}