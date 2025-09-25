import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header.jsx";
import Home from "./pages/Home.jsx";
import SearchResults from "./pages/SearchResults";
import ProfessorDetail from "./pages/ProfessorDetail";
import Contact from "./pages/Contact";
import Upload from "./pages/Upload";
import MentorApply from "./pages/MentorApply";

export default function App() { //Aca van todas las redirecciones, osea yo hago click en ciertos lugares y estas son todas las paginas q pued abrir
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/profesores/:id" element={<ProfessorDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/mentores/postular" element={<MentorApply />} />
            </Routes>
        </BrowserRouter>
    );
}
