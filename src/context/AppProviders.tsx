import type { ReactNode } from "react";
import { ToastProvider } from "./ToastContext";
import { StoreProvider } from "./StoreContext";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";

/** Agrupa todos os provedores de contexto da aplicação. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <StoreProvider>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  );
}
