window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert("Erro JS: " + msg + " na linha " + lineNo);
    return false;
};

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://mmvieranrinduaxlgjua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8';

let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn("Biblioteca do Supabase não carregou.");
    }
} catch (e) {
    console.error("Erro ao inicializar Supabase:", e);
}

// --- FUNÇÕES GLOBAIS DE INTERFACE ---
window.switchView = function(viewId, navElement) {
    try {
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
    } catch (e) {
        alert("Erro no switchView: " + e.message);
    }
}

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
function formatData(dataISO) {
    if (!dataISO) return '--/--/----';
    const [ano, mes, dia] = dataISO.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

function mostrarToast() {
    const toast = document.getElementById('toast');
    if(toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

async function carregarDespesas() {
    const tbody = document.getElementById('expenses-tbody');
    
    if (!supabase) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-td">Supabase desconectado.</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="4" class="loading-td">Carregando...</td></tr>';

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
        alert("Erro ao carregar do banco: " + err.message);
        tbody.innerHTML = '<tr><td colspan="4" class="loading-td" style="color: red">Erro ao carregar.</td></tr>';
    }
}

document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabase) {
        alert("Supabase não carregado!");
        return;
    }

    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const categoria = document.getElementById('categoria').value;
    const data = document.getElementById('data').value;

    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.innerHTML = 'Salvando...';
    btnSubmit.disabled = true;

    try {
        const { error } = await supabase
            .from('despesas')
            .insert([{ descricao, valor, categoria, data }]);

        if (error) throw error;

        document.getElementById('expense-form').reset();
        mostrarToast();
        switchView('view-dashboard', document.getElementById('nav-dashboard'));
    } catch (err) {
        alert('Erro ao salvar despesa: ' + err.message);
    } finally {
        btnSubmit.innerHTML = 'Salvar Despesa';
        btnSubmit.disabled = false;
    }
});

function initApp() {
    let isLoggedIn = false;
    try {
        isLoggedIn = localStorage.getItem('despesas_auth') === 'true';
    } catch(e) {}
    
    if (isLoggedIn) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        carregarDespesas();
    } else {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }
}

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
        const user = document.getElementById('login-user').value.trim().toLowerCase();
        const pass = document.getElementById('login-pass').value.trim();
        const erroDiv = document.getElementById('login-error');

        // Aceita qualquer erro de digitação no usuário desde que contenha 'vitor' ou se ele usar a nova/velha senha
        if ((user === 'vitor' || user.includes('vitor')) && 
            (pass === '@19216801Gg' || pass === '@19216801GgJlsp2000#')) {
            
            try {
                localStorage.setItem('despesas_auth', 'true');
            } catch(ex) { /* Ignora erro de localStorage */ }
            
            erroDiv.style.display = 'none';
            initApp();
        } else {
            erroDiv.style.display = 'block';
            erroDiv.innerText = "Usuário ou senha incorretos!";
        }
    } catch (err) {
        alert("Erro no script de login: " + err.message);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
