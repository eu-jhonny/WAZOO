import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, Heart, PawPrint } from "lucide-react";
import { img } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/forms/LoginForm";
import { Decor } from "@/components/ui/Decor";

const perks = [
  { icon: ClipboardList, text: "Acompanhe o status dos seus pedidos" },
  { icon: Heart, text: "Cadastre seus pets e personalize a compra" },
  { icon: PawPrint, text: "Peça novamente com poucos cliques" },
];

export function Login() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (isLoggedIn) return <Navigate to="/perfil" replace />;

  return (
    <section className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      {/* Painel da marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-cream-100 via-white to-orange-50 lg:flex lg:flex-col lg:justify-center lg:p-12">
        <Decor />
        <div className="relative">
          <img src={img.mascot.saudacao} alt="Mascote Wazoo" className="h-48 w-auto animate-float-slow" />
          <h2 className="mt-6 font-display text-3xl font-bold text-navy-700">
            Que bom ter você de volta!
          </h2>
          <p className="mt-2 max-w-md text-navy-500">
            Entre na sua conta para acompanhar pedidos, cadastrar seus pets e
            pedir com ainda mais praticidade.
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
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-bold text-navy-700">Entrar</h1>
          <p className="mt-1 text-navy-500">Acesse a sua conta Wazoo Pet Express.</p>
          <div className="card mt-6 p-6 sm:p-8">
            <LoginForm onSuccess={() => navigate(from ?? "/perfil", { replace: true })} />
          </div>
        </div>
      </div>
    </section>
  );
}
