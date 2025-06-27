// Este arquivo terá nossas funções compartilhadas

function showNotification(title, message, isSuccess = true) {
    const notificationModal = document.getElementById('notification-modal');
    const modalIconContainer = document.getElementById('modal-icon-container');
    const modalTitleText = document.getElementById('modal-title-text');
    const modalMessageText = document.getElementById('modal-message-text');

    if (!notificationModal) {
        // Se não encontrar o modal, apenas mostra um alerta simples.
        alert(title + "\n\n" + message);
        return;
    }

    // Define o título e a mensagem
    modalTitleText.textContent = title;
    modalMessageText.textContent = message;

    // Define o ícone e a cor (sucesso ou erro)
    modalIconContainer.innerHTML = isSuccess ?
        '<svg class="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' :
        '<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>';
    
    modalIconContainer.className = `mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`;
    
    // Mostra o modal na tela
    notificationModal.classList.remove('hidden', 'opacity-0');
    notificationModal.querySelector('.modal-content').classList.remove('scale-95');
}

// Funções ajudantes para chaves dinâmicas do localStorage
function getStockKeyFor(unidadeLogin) {
    return `stockLocal_${unidadeLogin}`;
}

function getSolicitacoesKeyFor(unidadeLogin) {
    return `solicitacoesUnidade_${unidadeLogin}`;
}