import { Navigate, useNavigate } from "react-router-dom";
import { PawPrint, ShieldCheck, Sparkles } from "lucide-react";
import { img } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { Decor } from "@/components/ui/Decor";

const perks = [
  { icon: Sparkles, text: "Tudo para o seu pet em um só lugar" },
  { icon: ShieldCheck, text: "Compra segura e sem compromisso" },
  { icon: PawPrint, text: "Atendimento personalizado pelo WhatsApp" },
];

export function Cadastro() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (isLoggedIn) return <Navigate to="/perfil" replace />;

  return (
    <section className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      {/* Painel da marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-teal/15 via-cream-50 to-orange-50 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <Decor />
        <div className="relative">
          <img src={img.mascot.brincando} alt="Mascote Wazoo" className="h-48 w-auto animate-float-slow" />
          <h2 className="mt-6 font-display text-3xl font-bold text-navy-700">
            Crie sua conta e mime seu pet
          </h2>
          <p className="mt-2 max-w-md text-navy-500">
            Leva menos de um minuto. Depois é só montar seu pedido e a gente
            cuida do resto.
          </p>
          <ul className="mt-8 space-y-4">
            {perks.map((perk) => (
              <li key={perk.text} className="flex items-center gap-3 text-navy-600">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-soft">
                  <perk.icon size={20} className="text-orange-500" />
                </span>
                <span className="font-semibold">{perk.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-cream-50 px-4 py-12">
        <div className="w-full max-w-lg">
          <h1 className="font-display text-3xl font-bold text-navy-700">Criar conta</h1>
          <p className="mt-1 text-navy-500">Cadastre-se para acompanhar seus pedidos.</p>
          <div className="card mt-6 p-6 sm:p-8">
            <RegisterForm onSuccess={() => navigate("/perfil", { replace: true })} />
          </div>
        </div>
      </div>
    </section>
  );
}
