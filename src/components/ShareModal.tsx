import { Copy, Share2, Check, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  url: string;
  busName: string;
  status: 'loading' | 'success' | 'error';
  darkMode: boolean;
}

export function ShareModal({ isOpen, onClose, onRetry, url, busName, status, darkMode }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lista de Chamada: ${busName}`,
          text: `Acesse a lista de chamada do ${busName}:\n\n`,
          url: url,
        });
        onClose();
      } catch (err) {
        console.log('User canceled share or error', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsapp = () => {
    const text = encodeURIComponent(`Acesse a lista de chamada do *${busName}*:\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        
        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <Loader2 className={`w-12 h-12 animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className="text-xl font-bold">Processando Link...</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Gerando e encurtando Link Mágico para <strong>{busName}</strong>.<br />
              Este processo pode levar alguns segundos.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="bg-red-500/20 p-3 rounded-full">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Falha na Conexão</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              O serviço de encurtados falhou repetidas vezes ou pode estar indisponível no ambiente atual (ex: localhost).
            </p>
            <div className="w-full flex-col gap-3 flex pt-4">
              <button
                onClick={onRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onClose}
                className={`w-full py-3 rounded-lg font-medium transition-colors border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}
              >
                Sair (Usar Botão de Copiar)
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <>
            <div className={`p-4 flex items-center gap-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-100 bg-gray-50'}`}>
              <div className="bg-green-500/20 p-2 rounded-full">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-lg font-bold">Link Gerado com Sucesso!</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                O link mágico para <strong>{busName}</strong> foi empacotado e está pronto. Como você deseja enviá-lo?
              </p>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleWhatsapp}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-lg font-medium transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enviar pelo WhatsApp
                </button>

                {typeof navigator.share === 'function' && (
                  <button
                    onClick={handleShare}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors border ${darkMode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'}`}
                  >
                    <Share2 className="w-5 h-5" />
                    Compartilhar... (Celular)
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors border ${copied ? 'bg-blue-500 text-white border-blue-500' : darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-600' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copiado para Área de Transferência!' : 'Apenas Copiar Link'}
                </button>
              </div>
            </div>
            
            <div className={`p-3 border-t text-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={onClose} className={`text-sm font-medium px-4 py-2 rounded ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                Fechar e Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
