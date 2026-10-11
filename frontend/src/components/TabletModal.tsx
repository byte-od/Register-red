import React, { useState, useEffect } from 'react';
import { X, Tablet, Copy, Check, Wifi, QrCode } from 'lucide-react';

interface TabletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TabletModal: React.FC<TabletModalProps> = ({ isOpen, onClose }) => {
  const [networkInfo, setNetworkInfo] = useState<{ ip: string; port: number; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/network-info')
        .then((res) => res.json())
        .then((data) => setNetworkInfo(data))
        .catch(() => {
          setNetworkInfo({
            ip: '192.168.1.250',
            port: 8000,
            url: 'http://192.168.1.250:8000',
          });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const url = networkInfo?.url || 'http://192.168.1.250:8000';

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-center">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-left">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Acessar no Tablet ou Celular
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesso direto pela sua rede Wi-Fi local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Wi-Fi Alert */}
          <div className="flex items-center justify-center space-x-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span>Certifique-se de que o tablet está no mesmo Wi-Fi que o Mac</span>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
              <img
                src="/api/qrcode"
                alt="QR Code de Acesso"
                className="w-48 h-48 object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Aponte a câmera do seu tablet para conectar instantaneamente
            </p>
          </div>

          {/* URL Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ou acesse digitando no navegador:
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 select-all">
                {url}
              </span>
              <button
                onClick={handleCopy}
                title="Copiar Link"
                className="ml-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
