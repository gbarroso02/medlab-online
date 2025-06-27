document.addEventListener('DOMContentLoaded', async function() {
    // Endereço da nossa API online
    const API_URL = 'https://medlab-sistema-completo.onrender.com';

    // --- ESTADO DA APLICAÇÃO ---
    let insumos = [];
    let unidades = [];
    let solicitacoes = [];
    let filtroDataSolicitacoes = 'todos'; // Filtro padrão

    // --- SELETORES DO DOM ---
    const tabelaEstoqueMatrizUI = document.getElementById('tabela-estoque-matriz');
    const tabelaSolicitacoesUI = document.getElementById('tabela-solicitacoes');
    const filtrosSolicitacoesContainer = document.getElementById('filtros-solicitacoes-container');
    const totalInsumosMatrizSpan = document.getElementById('total-insumos-matriz');
    const totalUnidadesCadastradasSpan = document.getElementById('total-unidades-cadastradas');
    const solicitacoesPendentesSpan = document.getElementById('solicitacoes-pendentes');

    // --- FUNÇÕES DE DADOS ---
    async function carregarDadosDoDashboard() {
        try {
            const [resInsumos, resUsuarios, resSolicitacoes] = await Promise.all([
                fetch(`${API_URL}/api/insumos`),
                fetch(`${API_URL}/api/usuarios`),
                fetch(`${API_URL}/api/solicitacoes`)
            ]);

            const dataInsumos = await resInsumos.json();
            const dataUsuarios = await resUsuarios.json();
            const dataSolicitacoes = await resSolicitacoes.json();

            if (dataInsumos.success) insumos = dataInsumos.data;
            if (dataUsuarios.success) unidades = dataUsuarios.data;
            if (dataSolicitacoes.success) solicitacoes = dataSolicitacoes.data;

        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            showNotification('Erro de Conexão', 'Não foi possível carregar os dados do painel.', false);
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderizarTabelaEstoqueMatriz() {
        if (!tabelaEstoqueMatrizUI) return;
        tabelaEstoqueMatrizUI.innerHTML = '';
        if (insumos.length === 0) {
            tabelaEstoqueMatrizUI.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center italic text-gray-500">Nenhum insumo cadastrado.</td></tr>';
            return;
        }

        insumos.forEach(insumo => {
            const tr = document.createElement('tr');
            const statusClass = insumo.quantidade_estoque_matriz < insumo.quantidade_minima ? 'estoque-baixo' : 'estoque-ok';
            const statusTexto = insumo.quantidade_estoque_matriz < insumo.quantidade_minima ? 'Baixo' : 'OK';
            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${insumo.nome}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${insumo.unidade_medida}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">R$ ${parseFloat(insumo.valor_compra || 0).toFixed(2)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${insumo.quantidade_estoque_matriz}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${insumo.quantidade_minima}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm ${statusClass}">${statusTexto}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button class="text-green-600 hover:text-green-900" title="Repor Estoque">Repor</button>
                    <button class="text-red-600 hover:text-red-900" title="Excluir Insumo">Excluir</button>
                </td>
            `;
            tabelaEstoqueMatrizUI.appendChild(tr);
        });
    }
    
    function renderizarTabelaSolicitacoes() {
        if (!tabelaSolicitacoesUI) return;
        tabelaSolicitacoesUI.innerHTML = '';
        const solicitacoesFiltradas = solicitacoes.filter(s => isDateInRange(s.data, filtroDataSolicitacoes));

        if (solicitacoesFiltradas.length === 0) {
            tabelaSolicitacoesUI.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center italic text-gray-500">Nenhuma solicitação encontrada.</td></tr>';
            return;
        }

        solicitacoesFiltradas.forEach(sol => {
            const tr = document.createElement('tr');
            const dataFormatada = new Date(sol.data).toLocaleDateString('pt-BR');
            let statusClass = 'status-pendente';
            if (sol.status === 'Confirmado') statusClass = 'status-confirmado';
            if (sol.status.includes('Cancelada') || sol.status.includes('Excluído')) statusClass = 'status-cancelado';

            tr.innerHTML = `
                <td class="py-2 px-1 text-sm text-gray-500">${sol.id}</td>
                <td class="py-2 px-1 text-sm text-gray-900 font-medium">${sol.unidade_nome}</td>
                <td class="py-2 px-1 text-sm text-gray-500">${sol.insumo_nome}</td>
                <td class="py-2 px-1 text-sm text-gray-500">${sol.quantidade_solicitada === 0 ? 'A definir' : sol.quantidade_solicitada}</td>
                <td class="py-2 px-1 text-sm text-gray-500">${dataFormatada}</td>
                <td class="py-2 px-1 text-sm"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${sol.status}</span></td>
                <td class="py-2 px-1 text-sm font-medium">
                    ${sol.status === 'Pendente' ? `
                        <div class="flex items-center space-x-1">
                            <input type="number" class="input-qtd-admin" placeholder="Qtd." data-solicitacao-id="${sol.id}">
                            <button class="action-btn add-qty-btn confirmar-solicitacao-btn" data-solicitacao-id="${sol.id}">OK</button>
                        </div>
                    ` : (sol.quantidade_confirmada_admin ?? '-')}
                </td>
            `;
            tabelaSolicitacoesUI.appendChild(tr);
        });
    }

    function isDateInRange(isoDateString, range) {
        if (range === 'todos') return true;
        const agora = new Date();
        const dataSolicitacao = new Date(isoDateString);
        let dataLimite = new Date();

        if (range === 'hoje') dataLimite.setDate(agora.getDate() - 1);
        if (range === '7dias') dataLimite.setDate(agora.getDate() - 7);
        if (range === '15dias') dataLimite.setDate(agora.getDate() - 15);
        if (range === '1mes') dataLimite.setMonth(agora.getMonth() - 1);
        
        return dataSolicitacao > dataLimite;
    }

    function atualizarDashboard() {
        if (!totalInsumosMatrizSpan) return; // Se não estamos no dashboard, não faz nada
        totalInsumosMatrizSpan.textContent = insumos.length;
        totalUnidadesCadastradasSpan.textContent = unidades.length;
        solicitacoesPendentesSpan.textContent = solicitacoes.filter(s => s.status === 'Pendente').length;
    }

    // --- LÓGICA DE EVENTOS ---
    if (filtrosSolicitacoesContainer) {
        filtrosSolicitacoesContainer.addEventListener('click', function(event) {
            const botao = event.target.closest('.filtro-solicitacao-btn');
            if(botao){
                filtrosSolicitacoesContainer.querySelector('.active').classList.remove('active');
                botao.classList.add('active');
                filtroDataSolicitacoes = botao.dataset.range;
                renderizarTabelaSolicitacoes();
            }
        });
    }
    
    if (tabelaSolicitacoesUI) {
        tabelaSolicitacoesUI.addEventListener('click', async function(event) {
            const botaoConfirmar = event.target.closest('.confirmar-solicitacao-btn');
            if (botaoConfirmar) {
                const solicitacaoId = botaoConfirmar.dataset.solicitacaoId;
                const inputQtd = document.querySelector(`input[data-solicitacao-id="${solicitacaoId}"]`);
                const quantidadeConfirmada = parseInt(inputQtd.value, 10);

                if (isNaN(quantidadeConfirmada) || quantidadeConfirmada < 0) {
                    return showNotification('Erro', 'Por favor, insira uma quantidade válida (0 ou mais).', false);
                }

                try {
                    const response = await fetch(`${API_URL}/api/solicitacoes/${solicitacaoId}/confirmar`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantidadeConfirmadaAdmin: quantidadeConfirmada })
                    });
                    const result = await response.json();

                    if (result.success) {
                        showNotification('Sucesso!', 'Solicitação confirmada.');
                        // Atualiza a lista local e redesenha a tela
                        const index = solicitacoes.findIndex(s => s.id == solicitacaoId);
                        if(index > -1) {
                            solicitacoes[index].status = 'Confirmado';
                            solicitacoes[index].quantidade_confirmada_admin = quantidadeConfirmada;
                        }
                        renderizarTabelaSolicitacoes();
                        atualizarDashboard();
                    } else {
                        showNotification('Erro', result.message, false);
                    }
                } catch (error) {
                    showNotification('Erro de Conexão', 'Não foi possível confirmar a solicitação.', false);
                }
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    async function inicializarPainelPrincipal() {
        await carregarDadosDoDashboard();
        atualizarDashboard();
        renderizarTabelaEstoqueMatriz();
        renderizarTabelaSolicitacoes();
    }

    inicializarPainelPrincipal();
});