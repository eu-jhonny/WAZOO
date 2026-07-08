import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./ToastContext";
import { StoreProvider } from "./StoreContext";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";
import { ComparisonProvider } from "./ComparisonContext";
import { LoyaltyProvider } from "./LoyaltyContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/** Agrupa todos os provedores de contexto da aplicação. */
export function AppProviders({ children }: { children: ReactNode }) {
  const inner = (
    <ToastProvider>
      <StoreProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ComparisonProvider>
                <LoyaltyProvider>{children}</LoyaltyProvider>
              </ComparisonProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </StoreProvider>
    </ToastProvider>
  );

  // Só envolve com GoogleOAuthProvider se a variável estiver configurada
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {inner}
      </GoogleOAuthProvider>
    );
  }

  return inner;
}
