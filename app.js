// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://mmvieranrinduaxlgjua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8';

let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Biblioteca do Supabase não carregou corretamente.");
    }
} catch (e) {
    console.error("Erro ao inicializar Supabase:", e);
}

// --- FUNÇÕES GLOBAIS DE INTERFACE ---
// Navegação entre Telas - Agora totalmente segura contra falhas de rede
window.switchView = function(viewId, navElement) {
    // Esconder todas as seções
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });
    // Mostrar a selecionada
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active');

    // Atualizar menu lateral
    if (navElement) {
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        navElement.classList.add('active');
    }

    if (viewId === 'view-dashboard') {
        carregarDespesas();
    }
}

// Formatação
const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function formatData(dataISO) {
    if (!dataISO) return '--/--/----';
    const [ano, mes, dia] = dataISO.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

// Toast Notification
function mostrarToast() {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}


// --- LÓGICA DE DADOS ---
async function carregarDespesas() {
    const tbody = document.getElementById('expenses-tbody');
    
    if (!supabase) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-td">Erro: Supabase não conectado. Verifique a internet.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="loading-td"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</td></tr>';

    try {
        const { data: despesas, error } = await supabase
            .from('despesas')
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;

        let totalGasto = 0;
        let html = '';

        if (!despesas || despesas.length === 0) {
            html = '<tr><td colspan="4" class="loading-td">Nenhuma despesa lançada ainda!</td></tr>';
            document.getElementById('total-gasto').innerText = 'R$ 0,00';
            document.getElementById('total-lancamentos').innerText = '0';
            document.getElementById('ultima-data').innerText = '--/--/----';
        } else {
            despesas.forEach(d => {
                totalGasto += Number(d.valor);
                html += `
                    <tr>
                        <td>${formatData(d.data)}</td>
                        <td>${d.descricao}</td>
                        <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">${d.categoria}</span></td>
                        <td class="val-negative">${formatter.format(d.valor)}</td>
                    </tr>
                `;
            });
            
            document.getElementById('ultima-data').innerText = formatData(despesas[0].data);
            document.getElementById('total-gasto').innerText = formatter.format(totalGasto);
            document.getElementById('total-lancamentos').innerText = despesas.length;
        }

        tbody.innerHTML = html;

    } catch (err) {
        console.error('Erro ao carregar:', err);
        tbody.innerHTML = '<tr><td colspan="4" class="loading-td" style="color: var(--accent-red)">Erro ao carregar os dados do Supabase.</td></tr>';
    }
}

// Salvar Nova Despesa
document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabase) {
        alert("Supabase não carregado! Verifique sua conexão.");
        return;
    }

    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const categoria = document.getElementById('categoria').value;
    const data = document.getElementById('data').value;

    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    btnSubmit.disabled = true;

    try {
        const { error } = await supabase
            .from('despesas')
            .insert([{ descricao, valor, categoria, data }]);

        if (error) throw error;

        // Limpa form e volta pro inicio
        document.getElementById('expense-form').reset();
        mostrarToast();
        switchView('view-dashboard', document.getElementById('nav-dashboard'));

    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert('Erro ao salvar despesa. Tem certeza que a tabela foi criada?');
    } finally {
        btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Salvar Despesa';
        btnSubmit.disabled = false;
    }
});


// --- LÓGICA DE LOGIN E INICIALIZAÇÃO ---

function initApp() {
    const isLoggedIn = localStorage.getItem('despesas_auth') === 'true';
    
    if (isLoggedIn) {
        // Mostra o app e esconde o login
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        carregarDespesas();
    } else {
        // Mostra a tela de login
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value.trim();
    const erroDiv = document.getElementById('login-error');

    if (user === 'vitor' && pass === '@19216801Gg') {
        localStorage.setItem('despesas_auth', 'true');
        erroDiv.style.display = 'none';
        initApp();
    } else {
        erroDiv.style.display = 'block';
    }
});

// Ao carregar a tela
window.onload = () => {
    initApp();
};
