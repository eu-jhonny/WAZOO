import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "../WhatsAppButton";
import { NotificationSystem } from "../ui/NotificationSystem";

/** Layout público: header + conteúdo + footer + botão de WhatsApp. */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <NotificationSystem />
    </div>
  );
}
