import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useStore } from "./StoreContext";
import {
  addRedeemed, getRedeemed, pointsForBRL, brlForPoints, tierFor, nextTier,
  type Tier,
} from "@/lib/loyalty";

interface LoyaltyContextValue {
  enabled: boolean;       // há usuário logado
  lifetime: number;       // total acumulado (histórico)
  redeemed: number;       // já resgatados
  balance: number;        // saldo disponível
  balanceBRL: number;     // saldo em R$
  tier: Tier;
  next: Tier | null;
  progress: number;       // 0..100 rumo ao próximo nível
  redeem: (points: number) => void;
  toBRL: (points: number) => number;
}

const LoyaltyContext = createContext<LoyaltyContextValue | null>(null);

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { orders } = useStore();
  const [redeemedTick, setRedeemedTick] = useState(0);

  useEffect(() => {
    const bump = () => setRedeemedTick((t) => t + 1);
    window.addEventListener("wazoo:loyalty-updated", bump);
    return () => window.removeEventListener("wazoo:loyalty-updated", bump);
  }, []);

  const value = useMemo<LoyaltyContextValue>(() => {
    const lifetime = user
      ? orders
          .filter((o) => o.userId === user.id && o.status !== "Cancelado")
          .reduce((s, o) => s + pointsForBRL(o.total), 0)
      : 0;
    const redeemed = user ? getRedeemed(user.id) : 0;
    const balance = Math.max(0, lifetime - redeemed);
    const tier = tierFor(lifetime);
    const next = nextTier(lifetime);
    const progress = next
      ? Math.min(100, Math.round(((lifetime - tier.min) / (next.min - tier.min)) * 100))
      : 100;

    return {
      enabled: !!user,
      lifetime,
      redeemed,
      balance,
      balanceBRL: brlForPoints(balance),
      tier,
      next,
      progress,
      toBRL: brlForPoints,
      redeem: (points) => {
        if (user && points > 0) addRedeemed(user.id, points);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orders, redeemedTick]);

  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
}

export function useLoyalty() {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) throw new Error("useLoyalty deve ser usado dentro de <LoyaltyProvider>");
  return ctx;
}
