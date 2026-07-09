import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { WhatsAppButton } from "../WhatsAppButton";
import { NotificationSystem } from "../ui/NotificationSystem";
import { WazooAI } from "../ui/WazooAI";
import { ThemeApplier } from "../ui/ThemeApplier";
import { BackToTop } from "../ui/BackToTop";
import { AbandonedCartWatcher } from "../ui/AbandonedCartWatcher";
import { ComparisonBar } from "../ui/ComparisonBar";

/** Layout público: header + conteúdo + footer + botão de WhatsApp. */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <WhatsAppButton />
      <BackToTop />
      <NotificationSystem />
      <WazooAI />
      <ThemeApplier />
      <AbandonedCartWatcher />
      <ComparisonBar />
    </div>
  );
}
