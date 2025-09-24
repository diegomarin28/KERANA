import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header.jsx";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import SearchResults from "./pages/SearchResults";
import ProfessorDetail from "./pages/ProfessorDetail";
import Contact from "./pages/Contact";

export default function App() {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignIn />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/profesores/:id" element={<ProfessorDetail />} />
                <Route path="/contact" element={<Contact />} />
            </Routes>
        </BrowserRouter>
    );
}
