import { useState, useEffect, useRef } from "react";
import { colors } from "./design/colors";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useChenStore } from "./store/chenStore";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import ChatPanel from "./components/ChatPanel";
import ChenPanel from "./components/ChenPanel";
import lab from "./components/images/lab2.png";
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

// Chen visible seulement dans les pages jeu (avec :partieId)
// /pokedesc/:partieId, /types/:partieId, /dezoom/:partieId
function isChenVisible(path: string): boolean {
  return (
    /^\/pokedesc\/[^/]+$/.test(path) ||
    /^\/types\/[^/]+$/.test(path) ||
    /^\/dezoom\/[^/]+$/.test(path)
  );
}

function isChatVisible(path: string): boolean {
  return path !== "/" && path !== "/home" && path !== "/regles";
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { setDirection } = useNavDirectionStore();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const clearChenMessages = useChenStore((s) => s.clearMessages);

  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

    // Vider l'historique du Prof. Chen immédiatement à chaque navigation
    if (prev !== curr) {
      clearChenMessages();
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
            backgroundImage: `url(${lab})`,
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
          borderLeft: `6px solid ${colors.brand.redLight}`,
        }}
        className="flex-1 flex flex-col"
      >
        
        <TopBar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex" style={{ overflow: 'clip', position: 'relative' }}>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Bordure droite de la sidebar : redDark (6px) → redDeep (2px) */}
          <div
            className={`${sidebarOpen ? 'block' : 'hidden'} md:block pointer-events-none`}
            style={{
              position: 'absolute',
              left: sidebarOpen && isMobile
                ? 'calc(clamp(7.5rem, 24vw, 16rem) - 6px)'
                : isMobile
                ? 'calc(clamp(3.75rem, 12vw, 8rem) - 6px)'
                : 'calc(clamp(3.75rem, 12vw, 8rem))',
              top: 0,
              width: '8px',
              height: '100%',
              background: `linear-gradient(to right, ${colors.brand.redDark} 0px, ${colors.brand.redDark} 6px, ${colors.brand.redDeep} 6px, ${colors.brand.redDeep} 8px)`,
              zIndex: 9,
            }}
          />

          <div className="flex-1 flex flex-col">
            <main className={`flex-1 p-4 md:p-8 overflow-auto${isChatVisible(location.pathname) ? ' pb-16 md:pb-8' : ''}`}>
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
      <div style={{ position: "relative", zIndex: 60 }}>
        {isChatVisible(location.pathname) && <ChatPanel />}
      </div>
      {isChenVisible(location.pathname) && <ChenPanel />}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}