import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header.jsx";
import Home from "./pages/Home.jsx";
import SearchResults from "./pages/SearchResults";
import ProfessorDetail from "./pages/ProfessorDetail";
import CourseDetail from "./pages/CourseDetail";
import Contact from "./pages/Contact";
import Upload from "./pages/Upload";
import MentorApply from "./pages/MentorApply";

export default function App() {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/profesores/:id" element={<ProfessorDetail />} />
                <Route path="/cursos/:id" element={<CourseDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/mentores/postular" element={<MentorApply />} />
            </Routes>
        </BrowserRouter>
    );
}