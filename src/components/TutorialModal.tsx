import React from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-lg z-10">
          <h2 className="text-2xl font-bold text-gray-800">Tutorial de Utilização</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
          <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">OBSERVAÇÕES IMPORTANTES</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">            
                <li><strong>Esse sistema foi pensando e desenvolvido para o estilo de lista atual da rota PATOS NOITE, sendo possível seu uso por qualquer rota desde que sigam o padrão</strong></li>
                <button
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
                  onClick={() => alert(`LISTA 30/04\n\nLISTA UFM\n\n1. João Pedro UFM (VOLTA)\n2. Mariana Souza UFM (VOLTA)\n3. Carlos Alberto UFM\n4. Ana Clara UFM\n\nLISTA IFPB\n\n1. Bruno Silva IFPB\n2. Fernanda Oliveira IFPB\n3. José Ricardo IFPB\n4. Larissa Mendes IFPB\n\nLISTA RHEMA\n\n1. Gabriel Santos (Rhema)\n2. Laura Pereira (Rhema)\n3. Eduardo Lima (Rhema)`)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ver Exemplo de Lista
                </button>
                <li><strong>O sistema faz a identificação da faculdade de forma automática, sem necessidade do aluno colocar a mesma após o seu nome</strong></li>
                <li><strong>O sistema faz o cálculo total dos alunos da lista</strong></li>
                <li><strong>O sistema faz o cálculo total dos alunos da UNIFIP de forma individualmente</strong></li>
                OBS: Caso não tenham alunos UNIFIP, o sistema apenas irá ignorar
                <li><strong>O sistema faz a remoção de espaços vazio entre alunos</strong></li>
                <li><strong>O sistema faz a identificação dos alunos IDA e VOLTA de forma automática</strong></li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 1: Copiar e Colar a Lista</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Copie a lista de alunos e universidades do grupo</li>
                <li>Cole a lista na aplicação. A aplicação processará automaticamente a lista, separando os alunos e as universidades</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 2: Definir a Capacidade do Ônibus</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Digite a quantidade de assentos disponíveis no ônibus</li>
                <li>O número de assentos pode ser qualquer valor desejado (por exemplo, 15, 20, 44, 51, ou qualquer outro número conforme necessário)</li>
                <li>A aplicação calculará automaticamente a alocação dos alunos de acordo com a capacidade definida</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 3: Selecionar o Motorista</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Escolha o motorista da lista disponível</li>
                <li>Se o motorista não estiver na lista, selecione a opção "Outro". Uma caixa de texto será exibida para que você digite o nome do motorista manualmente</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 4: Selecionar as Universidades</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Escolha as universidades que irão naquele ônibus</li>
                <li>O sistema calculará automaticamente o número total de alunos das universidades selecionadas</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 5: Preenchimento Automático de Vagas</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Se o número total de alunos das universidades selecionadas for menor do que o total de assentos disponíveis, o sistema preencherá automaticamente as vagas restantes com alunos da UNIFIP</li>
                <li>Exemplo: Se o ônibus possui 40 lugares e são selecionados 30 alunos da UEPB e da UNIPLAN, o sistema irá preencher as 10 vagas restantes com os primeiros 10 alunos da lista da UNIFIP</li>
                <li><strong>OBS: O sistema só preenche automaticamente com alunos da UNIFIP</strong></li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 6: Preenchimento Manual de Vagas</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Caso prefira, você pode escolher manualmente os alunos para preencher as vagas restantes:</li>
                <li>Clique no botão verde "Criar ônibus manualmente"</li>
                <li>Selecione os alunos da UNIFIP que deseja alocar para o ônibus</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 7: Excluir Alunos da Lista</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Exclua um aluno da lista de alocados ao clicar na opção "Excluir" do lado do nome</li>
                <li>A numeração dos alunos será ajustada automaticamente, subindo a numeração dos alunos que permanecem na lista</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Passo 8: Copiar Listas</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Copie as listas individualmente para gerenciamento ou exportação, ou copie a lista completa no formato pronto para uso</li>
                <li>A lista estará pronta para ser usada ou compartilhada de acordo com suas necessidades</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}