const API_URL = 'https://localhost:443/api'; //para https
const loginUrl = '/login.html';
let currentMode = 'create';

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    checkAuth();
    
    // Mostrar nome do usuário
    displayUserName();
    
    // Carregar usuários
    loadUsers();
    
    // Configurar event listeners
    setupEventListeners();
});

// ========================================
// AUTENTICAÇÃO
// ========================================

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        globalThis.location.href = loginUrl;
        return null;  // Retorna null (compatível com string)
    }
    return token;     // Retorna string
}

function displayUserName() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('user-name').textContent = user.name;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    globalThis.location.href = loginUrl;
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Botão Logout
    document.getElementById('btn-logout').addEventListener('click', logout);
    
    // Botão Novo Usuário
    document.getElementById('btn-new-user').addEventListener('click', () => {
        openModal('create');
    });
    
    // Botão Fechar Modal (X)
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    
    // Fechar modal clicando no fundo
    document.getElementById('user-modal').addEventListener('click', (e) => {
        if (e.target.id === 'user-modal') {
            closeModal();
        }
    });
    
    // Submit do formulário do modal
    document.getElementById('user-form').addEventListener('submit', handleSubmit);
    
    // Event delegation para botões da tabela (Editar/Deletar)
    document.getElementById('users-list').addEventListener('click', handleTableClick);
}

// ========================================
// HANDLERS DE EVENTOS
// ========================================

function handleTableClick(e) {
    const target = e.target;
    
    // Botão Editar
    if (target.classList.contains('btn-warning')) {
        const row = target.closest('tr');
        const id = Number.parseInt(row.cells[0].textContent);
        editUser(id);
    }
    
    // Botão Deletar
    if (target.classList.contains('btn-danger')) {
        const row = target.closest('tr');
        const id = Number.parseInt(row.cells[0].textContent);
        deleteUser(id);
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('user-name-input').value;
    const email = document.getElementById('user-email-input').value;
    const password = document.getElementById('user-password-input').value;

    if (currentMode === 'create') {
        await createUser({ name, email, password });
    } else {
        const id = document.getElementById('user-id').value;
        await updateUser(id, { name, email });
    }
}

// ========================================
// FUNÇÕES DE MENSAGEM
// ========================================

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

// ========================================
// CRUD - LISTAR USUÁRIOS (GET) aplicado leis de calistenia de objetos
// ========================================

async function loadUsers() {
    const token = checkAuth();
    if (!token) {
        logout();
        return;
    }

    showSection('loading');
    hideSection('users-table');
    hideSection('empty-state');

    let response;
    try {
        response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        hideSection('loading');
        showMessage('Erro ao conectar com o servidor', 'error');
        return;
    }

    const data = await response.json();
    hideSection('loading');

    // Fail Fast: interrompe rapidamente em caso de erro
    if (!response.ok) {
        if (response.status === 401) {
            logout();
            return;
        }
        showMessage(data.message || 'Erro ao carregar usuários', 'error');
        return;
    }

    const users = data.data || [];
    if (users.length === 0) {
        showSection('empty-state');
        return;
    }

    showSection('users-table');
    displayUsers(users);
}

/* Funções auxiliares (melhoram legibilidade e aderem à calistenia) */
function showSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

/*Função auxiliar da função loadUsers*/
function hideSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}


function displayUsers(users) {
    const tbody = document.getElementById('users-list');
    tbody.innerHTML = '';

    for (const user of users) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
            <td class="actions">
                <button class="btn btn-sm btn-warning">Editar</button>
                <button class="btn btn-sm btn-danger">Deletar</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('users-table').style.display = 'table';
}

// ========================================
// CRUD - CRIAR USUÁRIO (POST)
// ========================================

async function createUser(data) {
    const token = checkAuth();

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Usuário criado com sucesso!', 'success');
            closeModal();
            loadUsers();
        } else {
            showMessage(result.message || 'Erro ao criar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
    }
}

// ========================================
// CRUD - BUSCAR USUÁRIO POR ID (GET)
// ========================================

async function editUser(id) {
    const token = checkAuth();

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            openModal('edit', result.data);
        } else {
            showMessage(result.message || 'Erro ao buscar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
    }
}

// ========================================
// CRUD - ATUALIZAR USUÁRIO (PATCH)
// ========================================

async function updateUser(id, data) {
    const token = checkAuth();

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Usuário atualizado com sucesso!', 'success');
            closeModal();
            loadUsers();
        } else {
            showMessage(result.message || 'Erro ao atualizar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
    }
}

// ========================================
// CRUD - DELETAR USUÁRIO (DELETE)
// ========================================

async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) {
        return;
    }

    const token = checkAuth();

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Usuário deletado com sucesso!', 'success');
            loadUsers();
        } else {
            showMessage(result.message || 'Erro ao deletar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
    }
}

// ========================================
// MODAL
// ========================================

function openModal(mode, user = null) {
    currentMode = mode;
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const passwordGroup = document.getElementById('password-group');
    
    form.reset();

    if (mode === 'create') {
        document.getElementById('modal-title').textContent = 'Novo Usuário';
        document.getElementById('submit-btn').textContent = 'Criar Usuário';
        passwordGroup.style.display = 'block';
        document.getElementById('user-password-input').required = true;
    } else {
        document.getElementById('modal-title').textContent = 'Editar Usuário';
        document.getElementById('submit-btn').textContent = 'Atualizar Usuário';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name-input').value = user.name;
        document.getElementById('user-email-input').value = user.email;
        passwordGroup.style.display = 'none';
        document.getElementById('user-password-input').required = false;
    }

    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('user-modal').classList.remove('active');

}





