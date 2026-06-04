import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

// Carregamento lazy — cada página vira um chunk separado
// O browser só baixa o código quando o usuário navega para aquela rota
const Home         = lazy(() => import('./pages/Home.jsx'));
const Evento       = lazy(() => import('./pages/Evento.jsx'));
const Checkout     = lazy(() => import('./pages/Checkout.jsx'));
const Pedido       = lazy(() => import('./pages/Pedido.jsx'));
const Nominar      = lazy(() => import('./pages/Nominar.jsx'));
const Login        = lazy(() => import('./pages/Login.jsx'));
const Cadastro     = lazy(() => import('./pages/Cadastro.jsx'));
const MinhaConta   = lazy(() => import('./pages/MinhaConta.jsx'));
const RecuperaSenha = lazy(() => import('./pages/RecuperaSenha.jsx'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                    element={<Home />} />
            <Route path="/eventos/:gticketId"  element={<Evento />} />
            <Route path="/checkout/:gticketId" element={<Checkout />} />
            <Route path="/pedido/:orderCode"   element={<Pedido />} />
            <Route path="/nominar/:pagId"      element={<Nominar />} />
            <Route path="/login"               element={<Login />} />
            <Route path="/cadastro"            element={<Cadastro />} />
            <Route path="/minha-conta"         element={<MinhaConta />} />
            <Route path="/recupera-senha"      element={<RecuperaSenha />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
