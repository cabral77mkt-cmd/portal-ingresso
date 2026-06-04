import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Marca */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="none" stroke="#C5FF00" strokeWidth="2.5"/>
                <rect x="8" y="6" width="16" height="20" rx="3" fill="none" stroke="#C5FF00" strokeWidth="2"/>
                <rect x="13" y="8" width="5" height="16" rx="2" fill="#3B82F6"/>
                <circle cx="21" cy="16" r="1.5" fill="#C5FF00"/>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>Portal</span>
                <span style={{ color: '#C5FF00', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>do Ingresso</span>
              </div>
            </Link>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              O acesso oficial aos eventos que movem a cidade. Compra segura, tecnologia confiável.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold mb-3">Institucional</p>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-500 cursor-default">Quem somos</span></li>
              <li><span className="text-gray-500 cursor-default">Dúvidas frequentes</span></li>
              <li><span className="text-gray-500 cursor-default">Nossas políticas</span></li>
              <li><span className="text-gray-500 cursor-default">Fale conosco</span></li>
            </ul>
          </div>

          {/* Conta */}
          <div>
            <p className="text-white font-semibold mb-3">Minha Conta</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="text-gray-500 hover:text-primary transition-colors">
                  Entrar
                </Link>
              </li>
              <li>
                <Link to="/cadastro" className="text-gray-500 hover:text-primary transition-colors">
                  Criar conta
                </Link>
              </li>
              <li>
                <Link to="/minha-conta" className="text-gray-500 hover:text-primary transition-colors">
                  Meus ingressos
                </Link>
              </li>
              <li>
                <Link to="/recupera-senha" className="text-gray-500 hover:text-primary transition-colors">
                  Recuperar senha
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Portal do Ingresso. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
