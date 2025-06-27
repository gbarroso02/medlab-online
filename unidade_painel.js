document.addEventListener('DOMContentLoaded', async function() {
    
    // --- SELETORES E ESTADO ---
    const nomeUnidadeLogadaSpan = document.getElementById('nome-unidade-logada');
    const logoutButton = document.getElementById('logout-button');
    const stockUnidadeContainer = document.getElementById('stock-unidade-container');
    const formSolicitarInsumo = document.getElementById('form-solicitar-insumo');
    const listaInsumosParaSolicitacaoUI = document.getElementById('lista-insumos-para-solicitacao');
    const listaMinhasSolicitacoesUI = document.getElementById('lista-minhas-solicitacoes');
    
    let insumosDaUnidade = [];
    let minhasSolicitacoes = [];
    
    // Pega o objeto completo do usuário que foi salvo durante o login
    const unidadeLogada = JSON.parse(localStorage.getItem('unidadeLogada'));

    // --- PONTO DE VERIFICAÇÃO 1 ---
    console.log("Tentando carregar o painel para o usuário:", unidadeLogada);

    if (!unidadeLogada || !unidadeLogada.id) {
        console.error("Não encontrei dados de usuário válidos no localStorage. Redirecionando para login.");
        window.location.href = 'unidade_login.html';
        return;
    }
    
    nomeUnidadeLogadaSpan.textContent = unidadeLogada.nome;

    // --- FUNÇÃO PRINCIPAL DE CARREGAMENTO ---
    async function carregarDadosDoPainel() {
        try {
            const urlInsumos = `https://medlab-sistema-completo.onrender.com/api/unidade/${unidadeLogada.id}/insumos`;
            // --- PONTO DE VERIFICAÇÃO 2 ---
            console.log("Fazendo pergunta ao servidor no endereço:", urlInsumos);

            const response = await fetch(urlInsumos);
            const result = await response.json();

            // --- PONTO DE VERIFICAÇÃO 3 ---
            console.log("Resposta recebida do servidor:", result);

            if (result.success && result.data) {
                insumosDaUnidade = result.data;
                // Se chegamos aqui, os dados foram recebidos com sucesso.
                // Agora, vamos desenhar a tela.
                renderizarStockUnidade();
                renderizarInsumosParaSolicitacao();
            } else {
                throw new Error(result.message || "A resposta do servidor não indicou sucesso.");
            }
            
            // Carregando solicitações (separadamente para simplificar)
            const resSolicitacoes = await fetch(`https://medlab-sistema-completo.onrender.com/api/solicitacoes/${unidadeLogada.login}`);
            const resultSolicitacoes = await resSolicitacoes.json();
            if (resultSolicitacoes.success) {
                minhasSolicitacoes = resultSolicitacoes.data;
                renderizarMinhasSolicitacoes();
            }

        } catch (error) {
            console.error("Ocorreu um erro fatal ao carregar dados do painel:", error);
            showNotification('Erro de Conexão', 'Não foi possível carregar os dados do painel. Verifique o console para mais detalhes.', false);
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO (sem alterações) ---
    function renderizarStockUnidade() {
        stockUnidadeContainer.innerHTML = '';
        if (insumosDaUnidade.length === 0) {
            stockUnidadeContainer.innerHTML = '<p class="text-gray-500 italic">Nenhum insumo associado a esta unidade.</p>';
            return;
        }
        insumosDaUnidade.forEach(insumo => {
            const qtdAtualLocal = insumo.estoque_local;
            const qtdMinimaUnidade = insumo.estoque_minimo_unidade;
            const divInsumo = document.createElement('div');
            divInsumo.className = 'p-3 bg-gray-50 rounded-md shadow-sm flex justify-between items-center';
            divInsumo.innerHTML = `
                <div>
                    <span class="font-medium text-gray-800">${insumo.nome}</span>
                    <span class="block text-sm text-gray-600">Estoque Local: 
                        <strong class="${qtdAtualLocal < qtdMinimaUnidade && qtdMinimaUnidade > 0 ? 'text-red-500 font-bold' : 'text-green-600'}">${qtdAtualLocal}</strong> 
                    </span>
                    <span class="block text-xs text-gray-500">Mínimo para esta Unidade: ${qtdMinimaUnidade}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <input type="number" value="${qtdAtualLocal}" min="0" class="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-red-500 focus:border-red-500 input-focus-primary-red">
                    <button class="atualizar-stock-btn text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded-md shadow-sm transition-colors" data-insumo-id="${insumo.id}">Atualizar</button>
                </div>`;
            stockUnidadeContainer.appendChild(divInsumo);
        });
    }
    
    function renderizarInsumosParaSolicitacao() {
        listaInsumosParaSolicitacaoUI.innerHTML = '';
        if (insumosDaUnidade.length === 0) {
            listaInsumosParaSolicitacaoUI.innerHTML = '<p class="text-gray-500 italic text-sm">Nenhum insumo definido para você solicitar.</p>';
            return;
        }
        insumosDaUnidade.forEach(insumo => {
            const insumoId = `solicitar-${insumo.id}`;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'insumo-item-solicitacao items-center'; 
            itemDiv.innerHTML = `<input type="checkbox" id="${insumoId}" name="insumoSolicitado" value="${insumo.nome}" class="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 checkbox-primary-red">
                                 <label for="${insumoId}" class="ml-2 flex-grow text-sm text-gray-700 cursor-pointer">${insumo.nome} (Estoque Matriz: ${insumo.quantidade_estoque_matriz || 0})</label>`;
            listaInsumosParaSolicitacaoUI.appendChild(itemDiv);
        });
    }

    function renderizarMinhasSolicitacoes() {
        listaMinhasSolicitacoesUI.innerHTML = '';
        if (minhasSolicitacoes.length === 0) {
            listaMinhasSolicitacoesUI.innerHTML = '<li class="text-gray-500 italic">Nenhuma solicitação feita.</li>';
            return;
        }
        minhasSolicitacoes.slice(0, 10).forEach(sol => {
            const li = document.createElement('li');
            li.className = 'p-2 bg-gray-50 rounded-md text-sm flex justify-between items-center shadow-sm';
            const dataFormatada = new Date(sol.data).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
            let statusClass = 'text-yellow-700 bg-yellow-100';
            if (sol.status === 'Confirmado') statusClass = 'text-green-700 bg-green-100';
            if (sol.status === 'Recusado' || sol.status.includes('Cancelada')) statusClass = 'text-gray-500 bg-gray-200';
            li.innerHTML = `<div><strong>${sol.insumo_nome}</strong> <span class="text-xs text-gray-500">(${dataFormatada})</span></div>
                            <span class="font-semibold text-xs px-2 py-0.5 rounded-full ${statusClass}">${sol.status.toUpperCase()}</span>`;
            listaMinhasSolicitacoesUI.appendChild(li);
        });
    }

    // --- O restante dos listeners de eventos (atualizar estoque, solicitar, etc.) continua aqui ---
    // (O código que você já tem para eles está correto)
    
    // --- INICIALIZAÇÃO ---
    carregarDadosDoPainel();
});