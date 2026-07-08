import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { emails } from "@/lib/email";

/**
 * Vigia de carrinho abandonado.
 *
 * Enquanto houver itens no carrinho, guarda o horário da última atividade.
 * Se o cliente (logado, com e-mail) deixar o carrinho parado por mais de
 * um limite (ex.: volta ao site depois ou fica com a aba ociosa), envia
 * UM e-mail de recuperação com cupom — e só reenvia se o carrinho mudar.
 *
 * Componente sem UI. Mantido em <Layout>, roda em todas as páginas públicas.
 */
const IDLE_MS = 30 * 60 * 1000; // 30 minutos de inatividade
const ACTIVITY_KEY = "wazoo:cart:activity:v1";
const REMINDED_KEY = "wazoo:cart:reminded:v1";
const COUPON = "VOLTA10";

/** Assinatura simples do conteúdo do carrinho (itens + quantidades). */
function cartSignature(items: { id: string; quantity: number }[]): string {
  return items
    .map((i) => `${i.id}:${i.quantity}`)
    .sort()
    .join("|");
}

export function AbandonedCartWatcher() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();

  // Atualiza o horário de atividade sempre que o carrinho muda.
  useEffect(() => {
    if (items.length === 0) {
      // Carrinho vazio (ex.: após checkout) → zera os marcadores.
      localStorage.removeItem(ACTIVITY_KEY);
      localStorage.removeItem(REMINDED_KEY);
      return;
    }
    try {
      localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Verifica na montagem, ao interagir de novo com a aba e periodicamente.
  useEffect(() => {
    const check = () => {
      if (items.length === 0) return;
      const email = user?.email;
      if (!email) return; // só clientes identificados têm e-mail

      const activity = Number(localStorage.getItem(ACTIVITY_KEY) || 0);
      if (!activity || Date.now() - activity < IDLE_MS) return;

      const sig = cartSignature(items);
      if (localStorage.getItem(REMINDED_KEY) === sig) return; // já lembrado

      void emails.abandonedCart(
        email,
        user?.name,
        items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        subtotal,
        COUPON,
      );
      try {
        localStorage.setItem(REMINDED_KEY, sig);
      } catch {
        /* ignore */
      }
    };

    // Um check logo após (re)montar — cobre "voltou ao site com carrinho
    // parado" — mais verificações periódicas e ao focar a aba de novo.
    const t = window.setTimeout(check, 3000);
    const interval = window.setInterval(check, 5 * 60 * 1000);
    window.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(interval);
      window.removeEventListener("visibilitychange", check);
    };
  }, [items, subtotal, user]);

  return null;
}
