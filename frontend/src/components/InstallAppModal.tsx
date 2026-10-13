import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Download, Share2, PlusSquare, 
  Check, ShieldCheck, Zap, MonitorSmartphone, Laptop, HelpCircle, MoreVertical
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [platformTab, setPlatformTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Detect device type to select default tab
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos) {
      setPlatformTab('ios');
    } else if (isAndroid) {
      setPlatformTab('android');
    } else {
      setPlatformTab('desktop');
    }

    // Detect if already installed in standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        onInstallSuccess?.();
        onClose();
      }
    } catch (err) {
      console.warn('Erro ao disparar prompt de instalação:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 shrink-0">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/icon-192.png" 
                alt="Ícone do App" 
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Smartphone className="w-5 h-5 text-white absolute pointer-events-none opacity-0" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Instalar Gestão Numbers</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  App
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acesse como aplicativo nativo em tela cheia
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

        {/* Modal Body (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Já instalado em standalone */}
          {isStandalone ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                O aplicativo já está instalado!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Você já está utilizando o Gestão Numbers no modo de aplicativo nativo de tela cheia.
              </p>
            </div>
          ) : (
            <>
              {/* Vantagens do App */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <MonitorSmartphone className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Tela Cheia</div>
                  <div className="text-[10px] text-slate-400">Sem barra do browser</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1 fill-amber-500/20" />
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Acesso Rápido</div>
                  <div className="text-[10px] text-slate-400">Na sua tela inicial</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <ShieldCheck className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Sincronizado</div>
                  <div className="text-[10px] text-slate-400">Google Drive 24h</div>
                </div>
              </div>

              {/* Botão de instalação nativa (se o navegador tiver capturado o evento) */}
              {deferredPrompt && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{installing ? 'Instalando...' : 'Instalar Agora no Navegador'}</span>
                  </button>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 text-center font-medium">
                    Seu navegador suporta instalação direta com 1 clique!
                  </p>
                </div>
              )}

              {/* Explicação: Por que o navegador não mostra o botão automático? */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-start space-x-2.5 text-left">
                <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">
                    Seu navegador não mostrou o botão automático?
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    O <strong>Safari (iOS)</strong> nunca exibe banners automáticos por política da Apple, e o <strong>Chrome</strong> em conexões de rede local (Wi-Fi sem HTTPS) requer adicionar manualmente pelo menu. Siga o passo a passo abaixo:
                  </p>
                </div>
              </div>

              {/* Seletor de Plataforma */}
              <div className="space-y-3">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPlatformTab('ios')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      platformTab === 'ios'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <span>🍎 iPhone / iPad</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatformTab('android')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      platformTab === 'android'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <span>🤖 Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatformTab('desktop')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      platformTab === 'desktop'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Computador</span>
                  </button>
                </div>

                {/* Conteúdo: iPhone / iPad */}
                {platformTab === 'ios' && (
                  <div className="space-y-2.5 text-left animate-in fade-in duration-200">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      No <strong>Safari</strong> do iOS:
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Toque no botão <strong className="text-slate-900 dark:text-white">Compartilhar</strong>{' '}
                        <Share2 className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> na barra inferior do Safari (ou superior no iPad).
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Role a lista para baixo e toque em{' '}
                        <strong className="text-slate-900 dark:text-white">"Adicionar à Tela de Início"</strong>{' '}
                        <PlusSquare className="w-3.5 h-3.5 inline text-slate-600 dark:text-slate-300 ml-0.5" />.
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Toque em <strong className="text-emerald-600 dark:text-emerald-400 font-bold">"Adicionar"</strong> no canto superior direito. Pronto! O app aparecerá na tela do celular.
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo: Android */}
                {platformTab === 'android' && (
                  <div className="space-y-2.5 text-left animate-in fade-in duration-200">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      No <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong>:
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Toque no menu de <strong className="text-slate-900 dark:text-white">Três Pontinhos</strong>{' '}
                        <MoreVertical className="w-3.5 h-3.5 inline text-slate-600 dark:text-slate-300" /> no canto superior direito do navegador.
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Selecione a opção <strong className="text-slate-900 dark:text-white">"Adicionar à tela inicial"</strong> ou <strong className="text-slate-900 dark:text-white">"Instalar aplicativo"</strong>.
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Toque em <strong className="text-emerald-600 dark:text-emerald-400 font-bold">"Instalar"</strong> para confirmar. O ícone oficial será adicionado.
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo: Computador Desktop */}
                {platformTab === 'desktop' && (
                  <div className="space-y-2.5 text-left animate-in fade-in duration-200">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Instruções por navegador no computador:
                    </div>

                    {/* Arc Browser Card */}
                    <div className="flex items-start space-x-3 p-3 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        Arc
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <div>
                          <strong className="text-slate-900 dark:text-white">Arc Browser (macOS / Windows):</strong>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          O Arc <strong>não possui botão de instalar PWAs</strong> por filosofia própria dos criadores (eles removeram esse recurso do Chromium). Para utilizá-lo como app:
                        </p>
                        <div className="text-[11px] space-y-1 font-medium text-purple-900 dark:text-purple-200 pt-0.5">
                          <div>⭐ <strong>Fixe nos Favoritos:</strong> Arraste esta aba para o topo da barra lateral esquerda do Arc (atalho <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px]">Cmd + D</code>). Ela fica sempre pronta como um app dedicado.</div>
                          <div>🪟 <strong>Little Arc:</strong> Use em janela minimalista sem abas (<code className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px]">Cmd + Option + N</code>).</div>
                          <div>🍎 <strong>App no Dock:</strong> Se você quer um aplicativo separado no Dock do Mac, abra <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border text-[10px]">localhost:8000</code> no <strong>Safari</strong> e clique em <em>Arquivo &gt; Adicionar ao Dock</em>.</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        Chrome
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        Olhe no canto direito da barra de endereços (onde digita o link), ao lado da estrela de favoritos. Clique no ícone de <strong className="text-slate-900 dark:text-white">computador com seta ⤓</strong> ou acesse o menu (⋮) &gt; <strong className="text-slate-900 dark:text-white">Salvar e Compartilhar &gt; Instalar Gestão Numbers</strong>.
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        Safari
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        No Mac (macOS Sonoma ou mais recente), clique no menu do topo: <strong className="text-slate-900 dark:text-white">Arquivo &gt; Adicionar ao Dock...</strong>.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            Entendido, fechar
          </button>
        </div>

      </div>
    </div>
  );
};
