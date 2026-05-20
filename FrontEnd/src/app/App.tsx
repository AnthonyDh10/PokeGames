import { useState, useEffect, useRef } from "react";
import { colors } from "./design/colors";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import ChatPanel from "./components/ChatPanel";
import ChenPanel from "./components/ChenPanel";
import palletTown from "./components/images/palletTown.webp";
import { useNavDirectionStore } from "./store/navDirectionStore";
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
import ReglesPage from "./pages/ReglesPage";

// Paths pour lesquels on traque la direction (ordre logique)
const HOME_REGLES_PATHS = ["/", "/home", "/regles"];

function isHomeOrRegles(path: string) {
  return HOME_REGLES_PATHS.includes(path);
}

// Chat visible partout sauf home (/,/home) et regles
function isChatVisible(path: string): boolean {
  return path !== "/" && path !== "/home" && path !== "/regles";
}

// Chen visible seulement dans les pages jeu (avec :partieId)
// /pokedesc/:partieId, /types/:partieId, /dezoom/:partieId
function isChenVisible(path: string): boolean {
  return (
    /^\/pokedesc\/[^/]+$/.test(path) ||
    /^\/types\/[^/]+$/.test(path) ||
    /^\/dezoom\/[^/]+$/.test(path)
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setDirection } = useNavDirectionStore();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;

    if (isHomeOrRegles(prev) && isHomeOrRegles(curr)) {
      // home → regles = forward, regles → home = backward
      if (curr === "/regles") {
        setDirection("forward");
      } else {
        setDirection("backward");
      }
    }

    prevPathRef.current = curr;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "110%",
            height: "110%",
            transform: "translate(-50%, -50%) scale(0.985)",
            transformOrigin: "center",
            backgroundImage: `url(${palletTown})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(4px)",
            willChange: "transform, filter",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1001,
          borderTop: `6px solid ${colors.brand.redLight}`,
          borderLeft: `6px solid ${colors.brand.redLight}`,
        }}
        className="flex-1 flex flex-col"
      >
        
        <div>
          <TopBar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }} className="flex-1 flex overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-4 md:p-8 overflow-auto">
              <AnimatePresence mode="wait" initial={false}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/pokedesc" element={<LobbyPokedescPage />} />
                  <Route path="/pokedesc/:partieId" element={<PokeDescPage />} />
                  <Route path="/types" element={<LobbyTypesPage />} />
                  <Route path="/types/:partieId" element={<TypesGamePage />} />
                  <Route path="/dezoom" element={<LobbyDeZoomPage />} />
                  <Route path="/dezoom/:partieId" element={<DeZoomGamePage />} />
                  <Route path="/regles" element={<ReglesPage />} />
                  <Route path="/resultats/:partieId" element={<ResultatsPage />} />
                  <Route path="/resultats-types/:partieId" element={<ResultatsTypesPage />} />
                  <Route path="/resultats-dezoom/:partieId" element={<ResultatsDeZoomPage />} />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 2002 }}>
        {isChenVisible(location.pathname) && <ChenPanel />}
        {isChatVisible(location.pathname) && <ChatPanel />}
      </div>
      <div style={{ position: "relative", zIndex: 60 }}>
        <Footer />
      </div>
    </div>
  );
}