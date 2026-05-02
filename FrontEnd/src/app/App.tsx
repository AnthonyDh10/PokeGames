import { useState } from "react";
import { colors } from "./design/colors";
import { Routes, Route } from "react-router";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import DiagonalBackground from "./components/DiagonalBackground";
import { useBackgroundStore } from "./store/backgroundStore";
import HomePage from "./pages/HomePage";
import LobbyPokedescPage from "./pages/LobbyPokedescPage";
import LobbyTypesPage from "./pages/LobbyTypesPage";
import LobbyDeZoomPage from "./pages/LobbyDeZoomPage";
import PokeDescPage from "./pages/PokeDescPage";
import TypesGamePage from "./pages/TypesGamePage";
import ResultatsPage from "./pages/ResultatsPage";
import ResultatsTypesPage from "./pages/ResultatsTypesPage";
import DeZoomGamePage from "./pages/DeZoomGamePage";
import ResultatsDeZoomPage from "./pages/ResultatsDeZoomPage";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { colorLeft, colorStripe, colorRight } = useBackgroundStore();

  return (
    <DiagonalBackground colorLeft={colorLeft} colorStripe={colorStripe} colorRight={colorRight}>
      <div className="flex-1 flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col border-4 md:border-8" style={{ borderColor: colors.brand.redDark }}>
          <TopBar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/pokedesc" element={<LobbyPokedescPage />} />
              <Route path="/pokedesc/:partieId" element={<PokeDescPage />} />
              <Route path="/types" element={<LobbyTypesPage />} />
              <Route path="/types/:partieId" element={<TypesGamePage />} />
              <Route path="/dezoom" element={<LobbyDeZoomPage />} />
              <Route path="/dezoom/:partieId" element={<DeZoomGamePage />} />
              <Route path="/resultats/:partieId" element={<ResultatsPage />} />
              <Route path="/resultats-types/:partieId" element={<ResultatsTypesPage />} />
              <Route path="/resultats-dezoom/:partieId" element={<ResultatsDeZoomPage />} />
            </Routes>
          </main>
        </div>
      </div>

      <Footer />
    </DiagonalBackground>
  );
}