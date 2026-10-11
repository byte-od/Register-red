import React, { useState } from 'react';
import { 
  X, Sparkles, Smartphone, Mic, Copy, Check, ExternalLink, 
  Bot, Zap, Globe, FileCode, Layers, ShieldCheck
} from 'lucide-react';

interface GeminiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl: string;
}

export const GeminiGuideModal: React.FC<GeminiGuideModalProps> = ({
  isOpen,
  onClose,
  serverUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'gemini_spark'>('gemini_spark');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    {
      title: 'Lançar em Gastos (Não Previsto)',
      prompt: 'Almoço 45 em Gastos',
      desc: 'Adiciona diretamente na categoria Gastos sem replicar para o próximo mês',
      url: `${serverUrl}/api/gemini/action?cmd=Almoco+45+em+Gastos`,
    },
    {
      title: 'Lançar em Casa',
      prompt: 'Conta de luz 180 em Casa',
      desc: 'Adiciona na categoria Casa com vencimento automático',
      url: `${serverUrl}/api/gemini/action?cmd=Conta+de+luz+180+em+Casa`,
    },
    {
      title: 'Lançar em Pessoal',
      prompt: 'Uber 28.50 em Pessoal',
      desc: 'Adiciona na categoria Pessoal',
      url: `${serverUrl}/api/gemini/action?cmd=Uber+28.50+em+Pessoal`,
    },
    {
      title: 'Dar Baixa / Pagar Conta',
      prompt: 'Pagar conta de luz',
      desc: 'Busca a conta pelo nome em qualquer categoria e marca como PAGA',
      url: `${serverUrl}/api/gemini/action?cmd=Pagar+conta+de+luz`,
    },
    {
      title: 'Pedir Resumo / Ler Contas',
      prompt: 'Quanto gastei este mês?',
      desc: 'Retorna receitas, despesas, saldo e quantas contas faltam pagar',
      url: `${serverUrl}/api/gemini/briefing`,
    },
  ];

  const gemInstructions = `Você é o assistente financeiro pessoal oficial integrado às planilhas Numbers do Google Drive.
Sua função é permitir que o usuário consulte despesas, adicione novos gastos em qualquer categoria (Gastos, Casa, Pessoal, Crédito) e marque contas como pagas.

Diretrizes:
1. Sempre que o usuário mencionar um gasto do dia a dia não previsto (ex: almoço, farmácia, lanche, compras avulsas), lance diretamente na categoria "gastos".
2. Se o usuário especificar uma categoria (ex: "Casa", "Pessoal", "Crédito"), lance na categoria solicitada.
3. Quando o usuário disser que pagou algo (ex: "quitei a luz", "paguei o aluguel"), chame a ação de pagamento para dar baixa.
4. Quando o usuário perguntar quanto gastou ou pedir o resumo, use a ação de briefing/leitura e responda de forma clara e amigável em português com valores em Reais (R$).
5. Confirme sempre a operação realizada informando o nome do gasto, valor e o saldo restante no mês.`;

  const openApiYaml = `openapi: 3.0.1
info:
  title: Gestão Financeira Numbers API
  description: API personalizada para o Gemini gerenciar e consultar suas planilhas Numbers no Google Drive.
  version: 1.0.0
servers:
  - url: ${serverUrl}
paths:
  /api/gemini/action:
    post:
      summary: Executa comando financeiro inteligente
      operationId: executeAction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                command:
                  type: string
                  description: Comando em linguagem natural (ex 'Almoço 45 em Gastos', 'Pagar luz', 'Quanto gastei?')
                category:
                  type: string
                  enum: [gastos, casa, pessoal, credito]
                name:
                  type: string
                amount:
                  type: number
      responses:
        '200':
          description: Resposta com mensagem e confirmação
    get:
      summary: Executa comando via GET
      operationId: executeCommandGet
      parameters:
        - name: cmd
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Sucesso
  /api/gemini/briefing:
    get:
      summary: Resumo financeiro falado
      operationId: getBriefing
      responses:
        '200':
          description: Briefing atual`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Conectar ao Gemini Spark & Celular</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Integração como App Personalizado (Gem / Ação) e comandos por voz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('gemini_spark')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'gemini_spark'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Novo Gemini Spark / Gems</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>&quot;Ok, Google&quot; & Atalhos</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          
          {activeTab === 'gemini_spark' ? (
            <div className="space-y-5">
              
              {/* Introduction Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 space-y-2">
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Como conectar como App Personalizado (Gem / Extension)</span>
                </h4>
                <p className="text-xs text-indigo-800/90 dark:text-indigo-300/90 leading-relaxed">
                  No novo <strong>Gemini Spark / Gems Personalizados</strong> (no app do Gemini no tablet ou na web), você pode criar um assistente dedicado para suas planilhas Numbers fornecendo as <strong>Instruções do Sistema</strong> e o <strong>Schema OpenAPI</strong> abaixo.
                </p>
              </div>

              {/* Step 1: Instruções do Gem */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Instruções do Gem (System Prompt)
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(gemInstructions, 'instructions')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-xs"
                  >
                    {copiedKey === 'instructions' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copiar Instruções</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-36 whitespace-pre-wrap">
                  {gemInstructions}
                </pre>
              </div>

              {/* Step 2: Schema OpenAPI */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                      Schema OpenAPI 3.0 (YAML para Ações/Tools)
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(openApiYaml, 'yaml')}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-xs"
                  >
                    {copiedKey === 'yaml' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copiar Schema YAML</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-36 whitespace-pre">
                  {openApiYaml}
                </pre>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Ou importe direto por URL:</span>
                  <a
                    href={`${serverUrl}/api/gemini/openapi.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold underline flex items-center gap-1"
                  >
                    <span>/api/gemini/openapi.json</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 3: Dica de Conexão na Nuvem */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Dica de Acesso pela Nuvem (Fora do Wi-Fi):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  O Gemini na nuvem precisa alcançar o seu computador. Na rede de casa, use o IP local (<strong>{serverUrl}</strong>). Se quiser que o Gemini acerte os dados mesmo quando você estiver na rua no 4G/5G, basta usar um túnel HTTPS gratuito (como <code>cloudflared</code> ou <code>ngrok http 8000</code>).
                </p>
              </div>

            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Comandos Rápidos */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-purple-500" />
                  <span>Exemplos de Comandos para Falar</span>
                </h4>
                
                <div className="space-y-2">
                  {quickPrompts.map((item, idx) => (
                    <div
                      key={item.prompt}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl hover:border-indigo-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            &quot;{item.prompt}&quot;
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
                            • {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {item.desc}
                        </p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.prompt, `prompt_${idx}`)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex items-center gap-1"
                        >
                          {copiedKey === `prompt_${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Testar URL no navegador"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guia Atalhos */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Configurar no App &quot;Atalhos&quot; ou Google Assistente:</span>
                </h4>
                <ol className="space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Crie um atalho com nome <strong>&quot;Lançar Gasto&quot;</strong>.</li>
                  <li>Configure a ação para enviar para:
                    <div className="mt-1 p-2 bg-white dark:bg-slate-900 rounded-lg border font-mono text-[11px] text-indigo-600 dark:text-indigo-400 select-all">
                      {serverUrl}/api/gemini/action?cmd=[Texto_Ditado]
                    </div>
                  </li>
                  <li>O assistente faz a requisição e atualiza a planilha em 1 segundo!</li>
                </ol>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Endereço local: <strong>{serverUrl}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
