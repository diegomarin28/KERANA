// App.jsx
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Header from "../src/components/Header.jsx";
import Home from "./pages/Home.jsx";
import Equipo from "./pages/Equipo";



const SearchResults = lazy(() => import("./pages/SearchResults"));
const ProfessorDetail = lazy(() => import("./pages/ProfessorDetail"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Upload = lazy(() => import("./pages/Upload"));
const MentorApply = lazy(() => import("./pages/MentorApply"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const CourseSearch = lazy(() => import("./components/CourseSearch"));
import AuthConfirm from './pages/AuthConfirm';

import Subjects from "./pages/Subjects";

const LoadingSpinner = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
    }}>
        <div>Cargando...</div>
    </div>
);

function RouteDebugger() {
    const location = useLocation();

    useEffect(() => {
        // Debug silencioso
    }, [location]);

    return null;
}

function ErrorFallback({ error }) {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Algo salió mal</h2>
            <details style={{ whiteSpace: 'pre-wrap' }}>
                {error?.toString()}
            </details>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Header />
            <RouteDebugger />
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/profesores/:id" element={<ProfessorDetail />} />
                    <Route path="/cursos/:id" element={<CourseDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/mentores/postular" element={<MentorApply />} />
                    <Route path="/panel" element={<UserDashboard />} />
                    <Route path="/cursos/buscar" element={<CourseSearch />} />
                    <Route path="/auth/confirm" element={<AuthConfirm />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/equipo" element={<Equipo />} />

                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}