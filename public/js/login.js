const API_URL = 'https://localhost:443/api'; //para https
const dashboardUrl = '/dashboard.html'

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está logado
    checkIfLoggedIn();
    
    // Configurar event listeners
    setupEventListeners();
});

// ========================================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ========================================

function checkIfLoggedIn() {
    const token = localStorage.getItem('token');
    if (token) {
        globalThis.location.href = dashboardUrl;
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Tabs (Login/Registro)
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });

    // Formulários
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('form-register').addEventListener('submit', handleRegister);
}

// ========================================
// HANDLERS DE TABS
// ========================================

function handleTabClick(e) {
    const tab = e.target.dataset.tab; //modo moderno
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabButtons = document.querySelectorAll('.tab-btn');

    // Remover active de todas as tabs
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Adicionar active na tab clicada
    e.target.classList.add('active');

    // Mostrar formulário correto
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }

    hideMessage();
}

// ========================================
// HANDLERS DE FORMULÁRIOS
// ========================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Salvar token e usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            
            setTimeout(() => {
                globalThis.location.href = dashboardUrl;
            }, 1000);
        } else {
            showMessage(data.message || 'Erro ao fazer login', 'error');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const btn = document.getElementById('register-btn');

    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Salvar token e usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showMessage('Conta criada com sucesso! Redirecionando...', 'success');
            
            setTimeout(() => {
                globalThis.location.href = dashboardUrl;
            }, 1000);
        } else {
            showMessage(data.message || 'Erro ao criar conta', 'error');
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        showMessage('Erro ao conectar com o servidor', 'error');
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
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
}

function hideMessage() {
    const message = document.getElementById('message');
    message.style.display = 'none';

}


