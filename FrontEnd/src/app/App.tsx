import { useState } from "react";
import { colors } from "./design/colors";
import { useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Footer from "./components/Footer";
import ChatPanel from "./components/ChatPanel";
import ChenPanel from "./components/ChenPanel";
import lab from "./components/images/lab2.png";
import { useIsMobile } from "./hooks/useIsMobile";
import { useNavigationBehavior } from "./hooks/useNavigationBehavior";
import AppRoutes, { isChenVisible, isChatVisible } from "./components/AppRoutes";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  useNavigationBehavior();

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
              <AppRoutes />
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