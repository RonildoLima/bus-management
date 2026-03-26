import { useState, useEffect } from 'react';

interface UpdateModalProps {
  darkMode: boolean;
}

export function UpdateModal({ darkMode }: UpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenHyphenUpdateModal');
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenHyphenUpdateModal', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-lg shadow-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Atualização do Sistema
          </h2>
          <div className={`space-y-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p className="text-base">
              Corrigido erro em que o sistema não identificava alunos com <strong>Número + Hífen</strong> na importação de listas:
            </p>
            <div className={`p-4 rounded-md font-mono text-xs ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              <span className="opacity-50">Antes: apenas "5. Nome" funcionava</span>
              <br />
              <span className={`font-bold mt-2 inline-block ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Agora suporta também:</span>
              <br />
              <span className={darkMode ? 'text-gray-100' : 'text-gray-900'}>27 - Anna - VOLTA (UNIFIP)</span>
            </div>
            <p>A lista será lida perfeitamente inclusive para estudantes nomeados assim!</p>
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
