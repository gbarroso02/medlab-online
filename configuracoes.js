document.addEventListener('DOMContentLoaded', async function() {
    
    // --- ESTADO DA APLICAÇÃO ---
    let insumos = [];
    let unidades = [];
    let associacoesAtuais = {};

    // --- SELETORES DO DOM (agora completos) ---
    const formInsumoConfig = document.getElementById('form-insumo-config');
    const inputNomeInsumoConfig = document.getElementById('nome-insumo-config');
    const selectUnidadeMedidaConfig = document.getElementById('unidade-medida-config');
    const inputValorCompraConfig = document.getElementById('valor-compra-config');
    const selectTipoValorCompraConfig = document.getElementById('tipo-valor-compra-config');
    const divEmbalagemDetailsConfig = document.getElementById('embalagem-details-config');
    const inputItensPorEmbalagemConfig = document.getElementById('itens-por-embalagem-config');
    const inputQtdEstoqueMatrizConfig = document.getElementById('qtd-estoque-matriz-config');
    const inputQtdMinimaInsumoConfig = document.getElementById('qtd-minima-insumo-config');
    const listaInsumosUIConfig = document.getElementById('lista-ultimos-insumos-config');

    const formUnidadeConfig = document.getElementById('form-unidade-config');
    const inputNomeUnidadeConfig = document.getElementById('nome-unidade-config');
    const inputLoginUnidadeConfig = document.getElementById('login-unidade-config');
    const inputSenhaUnidadeConfig = document.getElementById('senha-unidade-config');
    const selectTipoAcessoConfig = document.getElementById('tipo-acesso-config');
    const listaUnidadesUIConfig = document.getElementById('lista-unidades-config');
    
    const selectUnidadeConfig = document.getElementById('select-unidade-config');
    const checkboxesInsumosContainerConfig = document.getElementById('checkboxes-insumos-config');
    const btnSalvarAssociacaoConfig = document.getElementById('salvar-insumos-unidade-config');

    // --- FUNÇÕES DE DADOS ---
    async function carregarDadosIniciais() {
        try {
            const [resInsumos, resUsuarios] = await Promise.all([
                fetch('https://medlab-sistema-completo.https://medlab-api-final.onrender.com.com/api/insumos'),
                fetch('https://medlab-sistema-completo.https://medlab-api-final.onrender.com.com/api/usuarios')
            ]);
            const dataInsumos = await resInsumos.json();
            const dataUsuarios = await resUsuarios.json();
            if (dataInsumos.success) insumos = dataInsumos.data;
            if (dataUsuarios.success) unidades = dataUsuarios.data;

            const unidadesParaBuscar = unidades.filter(u => u.tipo_acesso && u.tipo_acesso.includes('unidade'));
            for (const unidade of unidadesParaBuscar) {
                const res = await fetch(`https://medlab-sistema-completo.https://medlab-api-final.onrender.com.com/api/unidade/${unidade.id}/insumos`);
                const data = await res.json();
                if (data.success) {
                    associacoesAtuais[unidade.id] = data.data.map(i => ({ insumoId: i.id, minimo: i.estoque_minimo_unidade }));
                }
            }
        } catch (error) {
            showNotification('Erro de Conexão', 'Não foi possível carregar os dados do servidor.', false);
        }
    }

    // --- LÓGICA DE EVENTOS ---
    if (formInsumoConfig) {
        formInsumoConfig.addEventListener('submit', async function(event) {
            event.preventDefault();
            const novoInsumo = {
                nome: inputNomeInsumoConfig.value.trim(),
                unidadeMedida: selectUnidadeMedidaConfig.value,
                valorCompra: parseFloat(inputValorCompraConfig.value),
                tipoValorCompra: selectTipoValorCompraConfig.value,
                itensPorEmbalagem: parseInt(inputItensPorEmbalagemConfig.value, 10) || 1,
                qtdEstoqueMatriz: parseInt(inputQtdEstoqueMatrizConfig.value, 10),
                qtdMinima: parseInt(inputQtdMinimaInsumoConfig.value, 10)
            };
            try {
                const response = await fetch('https://medlab-sistema-completo.https://medlab-api-final.onrender.com.com/api/insumos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoInsumo)
                });
                const result = await response.json();
                if (result.success) {
                    showNotification('Sucesso!', result.message);
                    formInsumoConfig.reset();
                    insumos.unshift(result.data);
                    renderizarUltimosInsumosConfig();
                    renderizarCheckboxesInsumosConfig();
                } else {
                    showNotification('Erro!', result.message, false);
                }
            } catch (error) {
                showNotification('Erro de Conexão', 'Não foi possível enviar os dados para o servidor.', false);
            }
        });
    }

    if (formUnidadeConfig) {
        formUnidadeConfig.addEventListener('submit', async function(event) {
            event.preventDefault();
            const novaUnidade = {
                nome: inputNomeUnidadeConfig.value.trim(),
                login: inputLoginUnidadeConfig.value.trim(),
                senha: inputSenhaUnidadeConfig.value,
                tipoAcesso: selectTipoAcessoConfig.value
            };
            if (!novaUnidade.nome || !novaUnidade.login || !novaUnidade.senha || !novaUnidade.tipoAcesso) {
                 return showNotification('Erro!', 'Todos os campos são obrigatórios.', false);
            }
            try {
                const response = await fetch('https://medlab-sistema-completo.https://medlab-api-final.onrender.com.com/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novaUnidade)
                });
                const result = await response.json();
                if (result.success) {
                    showNotification('Sucesso!', result.message);
                    formUnidadeConfig.reset();
                    unidades.push(result.data);
                    renderizarListaUnidadesConfig();
                } else {
                    showNotification('Erro!', result.message, false);
                }
            } catch (error) {
                showNotification('Erro de Conexão', 'Não foi possível salvar a unidade.', false);
            }
        });
    }

    if (listaUnidadesUIConfig) {
        listaUnidadesUIConfig.addEventListener('click', async function(event) {
            const deleteButton = event.target.closest('.excluir-usuario-btn');
            if (deleteButton) {
                const usuarioId = deleteButton.dataset.id;
                const usuarioNome = deleteButton.dataset.nome;
                if (confirm(`Tem certeza que deseja excluir "${usuarioNome}"? Esta ação não pode ser desfeita.`)) {
                    try {
                        const response = await fetch(`https://medlab-sistema-completo.https://medlab-api-final.onrender.com.com/api/usuarios/${usuarioId}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (result.success) {
                            showNotification('Sucesso!', result.message);
                            unidades = unidades.filter(u => u.id != usuarioId);
                            renderizarListaUnidadesConfig();
                        } else {
                            showNotification('Erro!', result.message, false);
                        }
                    } catch (error) {
                        showNotification('Erro de Conexão', 'Não foi possível apagar a unidade.', false);
                    }
                }
            }
        });
    }
    
    if (selectUnidadeConfig) {
        selectUnidadeConfig.addEventListener('change', renderizarCheckboxesInsumosConfig);
    }

    if (btnSalvarAssociacaoConfig) {
        btnSalvarAssociacaoConfig.addEventListener('click', async function() {
            const unidadeId = selectUnidadeConfig.value;
            if (!unidadeId) return showNotification('Atenção!', 'Selecione uma unidade.', false);
            const novasAssociacoes = [];
            const insumoItems = checkboxesInsumosContainerConfig.querySelectorAll('.insumo-item-config');
            insumoItems.forEach(item => {
                const checkbox = item.querySelector('.insumo-checkbox');
                if (checkbox.checked) {
                    const inputMinimo = item.querySelector('.input-minimo-unidade');
                    novasAssociacoes.push({
                        insumoId: checkbox.dataset.insumoId,
                        minimo: parseInt(inputMinimo.value, 10) || 0
                    });
                }
            });
            try {
                const response = await fetch('https://medlab-sistema-completo.onrender.com/api/unidade-insumos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unidadeId, associacoes: novasAssociacoes })
                });
                const result = await response.json();
                if (result.success) {
                    showNotification('Sucesso!', result.message);
                    associacoesAtuais[unidadeId] = novasAssociacoes.map(a => ({ insumoId: parseInt(a.insumoId), minimo: a.minimo }));
                } else {
                    showNotification('Erro!', result.message, false);
                }
            } catch (error) {
                showNotification('Erro de Conexão', 'Não foi possível salvar as associações.', false);
            }
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    function renderizarUltimosInsumosConfig() {
        if (!listaInsumosUIConfig) return;
        listaInsumosUIConfig.innerHTML = '';
        if (insumos.length === 0) {
            listaInsumosUIConfig.innerHTML = '<li class="text-gray-500 italic">Nenhum insumo cadastrado.</li>';
            return;
        }
        const ultimos = insumos.slice(0, 5);
        ultimos.forEach(insumo => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm';
            li.innerHTML = `<span class="font-medium text-gray-800">${insumo.nome}</span>
                            <span class="block list-item-detail">Estoque Matriz: ${insumo.quantidade_estoque_matriz} ${insumo.unidade_medida}(s)</span>`;
            listaInsumosUIConfig.appendChild(li);
        });
    }

    function renderizarListaUnidadesConfig() {
        if(!listaUnidadesUIConfig || !selectUnidadeConfig) return;
        listaUnidadesUIConfig.innerHTML = '';
        selectUnidadeConfig.innerHTML = '<option value="">-- Selecione uma Unidade --</option>'; 
        const unidadesOrdenadas = [...unidades].sort((a, b) => a.nome.localeCompare(b.nome));
        unidadesOrdenadas.forEach(unidade => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 rounded-md shadow-sm flex justify-between items-center';
            const tipoAcessoTexto = unidade.tipo_acesso && unidade.tipo_acesso.includes('admin') ? 'Admin' : 'Unidade';
            li.innerHTML = `<div><span class="font-medium text-gray-800">${unidade.nome}</span><span class="block list-item-detail">Login: ${unidade.username} | Tipo: ${tipoAcessoTexto}</span></div>
                            <div class="space-x-2">
                                <button data-id="${unidade.id}" data-nome="${unidade.nome}" class="action-btn edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                                <button data-id="${unidade.id}" data-nome="${unidade.nome}" class="action-btn delete-btn excluir-usuario-btn" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                            </div>`;
            listaUnidadesUIConfig.appendChild(li);
            if (unidade.tipo_acesso && unidade.tipo_acesso.includes('unidade')) {
                const option = document.createElement('option'); 
                option.value = unidade.id;
                option.textContent = unidade.nome; 
                selectUnidadeConfig.appendChild(option);
            }
        });
    }

    function renderizarCheckboxesInsumosConfig() {
        if (!checkboxesInsumosContainerConfig || !selectUnidadeConfig) return;
        checkboxesInsumosContainerConfig.innerHTML = '';
        const unidadeId = selectUnidadeConfig.value;
        if (!unidadeId) {
            checkboxesInsumosContainerConfig.innerHTML = '<p class="text-gray-500 italic">Selecione uma unidade para ver os insumos.</p>';
            return;
        }
        const insumosAssociados = associacoesAtuais[unidadeId] || [];
        insumos.forEach(insumo => {
            const associacao = insumosAssociados.find(a => a.insumoId === insumo.id);
            const isChecked = !!associacao;
            const minimo = isChecked ? associacao.minimo : 0;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'insumo-item-config';
            itemDiv.innerHTML = `<input type="checkbox" data-insumo-id="${insumo.id}" class="h-4 w-4 insumo-checkbox" ${isChecked ? 'checked' : ''}>
                                 <label class="text-sm text-gray-700">${insumo.nome}</label>
                                 <input type="number" value="${minimo}" min="0" class="input-minimo-unidade" ${!isChecked ? 'disabled' : ''}>`;
            const checkbox = itemDiv.querySelector('.insumo-checkbox');
            const inputMinimo = itemDiv.querySelector('.input-minimo-unidade');
            checkbox.addEventListener('change', () => { inputMinimo.disabled = !checkbox.checked; });
            checkboxesInsumosContainerConfig.appendChild(itemDiv);
        });
    }
    
    // --- INICIALIZAÇÃO ---
    async function inicializar() {
        await carregarDadosIniciais();
        renderizarListaUnidadesConfig();
        renderizarUltimosInsumosConfig();
        renderizarCheckboxesInsumosConfig();
    }
    inicializar();
});