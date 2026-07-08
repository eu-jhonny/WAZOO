import { Navigate, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/context/AppProviders";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/Toast";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminRoute } from "@/routes/AdminRoute";

// Páginas do cliente
import { Home } from "@/pages/Home";
import { Checkout } from "@/pages/Checkout";
import { Cachorros } from "@/pages/Cachorros";
import { Gatos } from "@/pages/Gatos";
import { Products } from "@/pages/Products";
import { ProductDetail } from "@/pages/ProductDetail";
import { Kits } from "@/pages/Kits";
import { ComoFunciona } from "@/pages/ComoFunciona";
import { Cart } from "@/pages/Cart";
import { Login } from "@/pages/Login";
import { Cadastro } from "@/pages/Cadastro";
import { Perfil } from "@/pages/Perfil";
import { Pedidos } from "@/pages/Pedidos";
import { Sobre } from "@/pages/Sobre";
import { Avaliacoes } from "@/pages/Avaliacoes";
import { PoliticaSobEncomenda } from "@/pages/PoliticaSobEncomenda";
import { PoliticaTroca } from "@/pages/PoliticaTroca";
import { NotFound } from "@/pages/NotFound";

// Páginas do admin
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLogin } from "@/pages/admin/AdminLogin";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminReviews } from "@/pages/admin/AdminReviews";
import { AdminEmails } from "@/pages/admin/AdminEmails";
import { AdminSettings } from "@/pages/admin/AdminSettings";

export default function App() {
  return (
    <AppProviders>
      <ScrollToTop />
      <Routes>
        {/* ---------- Área pública ---------- */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="cachorros" element={<Cachorros />} />
          <Route path="gatos" element={<Gatos />} />
          <Route path="produtos" element={<Products />} />
          <Route path="produtos/:id" element={<ProductDetail />} />
          <Route path="kits" element={<Kits />} />
          <Route path="como-funciona" element={<ComoFunciona />} />
          <Route path="carrinho" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="login" element={<Login />} />
          <Route path="cadastro" element={<Cadastro />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="avaliacoes" element={<Avaliacoes />} />
          <Route path="politica-sob-encomenda" element={<PoliticaSobEncomenda />} />
          <Route path="politica-troca" element={<PoliticaTroca />} />
          <Route
            path="perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="pedidos"
            element={
              <ProtectedRoute>
                <Pedidos />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ---------- Login administrativo (separado) ---------- */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ---------- Área administrativa (protegida) ---------- */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="produtos" element={<AdminProducts />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="avaliacoes" element={<AdminReviews />} />
          <Route path="emails" element={<AdminEmails />} />
          <Route path="configuracoes" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>

      <Toaster />
    </AppProviders>
  );
}
