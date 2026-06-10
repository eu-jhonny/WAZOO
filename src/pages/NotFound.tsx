import { Link } from "react-router-dom";
import { Home, ShoppingBag } from "lucide-react";
import { img } from "@/config/site";

export function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream-grad">
      <div className="container-app py-16 text-center">
        <img
          src={img.mascot.dormindo}
          alt="Mascote dormindo"
          className="mx-auto h-48 w-auto animate-float-slow drop-shadow-xl sm:h-56"
        />
        <p className="mt-6 font-display text-7xl font-bold text-orange-500">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy-700 sm:text-3xl">
          Ops! Esta página tirou um cochilo.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-navy-500">
          Não encontramos o que você procurava. Que tal voltar e continuar
          escolhendo mimos para o seu pet?
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home size={18} /> Voltar ao início
          </Link>
          <Link to="/produtos" className="btn-outline">
            <ShoppingBag size={18} /> Ver produtos
          </Link>
        </div>
      </div>
    </section>
  );
}
