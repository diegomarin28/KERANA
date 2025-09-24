import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header.jsx";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import SearchResults from "./pages/SearchResults";
import ProfessorDetail from "./pages/ProfessorDetail";

export default function App() {
    return (
        <BrowserRouter>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/profesores/:id" element={<ProfessorDetail />} />
            </Routes>
        </BrowserRouter>
    );
}
