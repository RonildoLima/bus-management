import { useState, useEffect } from 'react';

interface UpdateModalProps {
  darkMode: boolean;
}

export function UpdateModal({ darkMode }: UpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenMagicLinkUpdateModal');
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenMagicLinkUpdateModal', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className={`p-6 max-h-[85vh] overflow-y-auto`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            ✨ Atualização do Sistema
          </h2>
          <div className={`space-y-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className={`p-4 rounded-md border-l-4 ${darkMode ? 'bg-gray-700 border-blue-500' : 'bg-blue-50 border-blue-600'}`}>
              <p className={`font-bold text-base mb-2 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                🔗 Nova Função: Link Mágico
              </p>
              <p className="mb-2">
                Agora você gera links da sua Lista e compartilha com apenas 1 clique!
              </p>
              <ul className="list-disc pl-4 space-y-1 mb-2">
                <li>Clique no novo ícone de <strong>Link</strong> próximo ao botão de Copiar em qualquer ônibus.</li>
                <li>Ao receberem o link, os organizadores abrem o site diretamente na aba <strong>Chamada</strong> com a lista prontinha.</li>
              </ul>
              <p className={`text-xs p-2 rounded mt-2 border ${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                <strong>⏳ Observação:</strong> Como listas completas podem ser muito grandes, o sistema pode levar alguns segundos empacotando os dados na primeira vez. Aguarde o aviso de Sucesso!
              </p>
            </div>

            <div className={`p-4 rounded-md border-l-4 ${darkMode ? 'bg-gray-700 border-green-500' : 'bg-green-50 border-green-600'}`}>
              <p className={`font-bold text-base mb-2 flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                🔧 Correção: Leitura com Hífen
              </p>
              <p className="mb-2">
                O aplicativo corrigiu a detecção para alunos que entram colados com número e hífen na lista.
              </p>
              <div className={`p-2 rounded font-mono text-xs ${darkMode ? 'bg-gray-900 border border-gray-600' : 'bg-white border border-gray-300'}`}>
                <span className="opacity-50 line-through">Antes exigia ponto: "5. Anna"</span>
                <br />
                <span className={`font-bold mt-1 inline-block ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Agora lê perfeitamente: "27 - Anna"</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
