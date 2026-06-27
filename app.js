// --- CONFIGURAÇÃO SUPABASE ---
// Aqui nós vamos colocar a chave que você me mandar
const SUPABASE_URL = 'https://mmvieranrinduaxlgjua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmllcmFucmluZHVheGxnanVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MzQxMTAsImV4cCI6MjA5ODExMDExMH0.qR1XZYpmvWEaA-PhCBJg06PJodhqu4U5XI_SM2gsPz8';

let supabase = null;
if (SUPABASE_ANON_KEY !== 'AQUI_VAI_A_SUA_CHAVE_ANON') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Formatação de Moeda
const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

// Formatação de Data
function formatData(dataISO) {
    if (!dataISO) return '--/--/----';
    const [ano, mes, dia] = dataISO.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

// Navegação entre Telas
function switchView(viewId, navElement) {
    // Esconder todas as seções
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });
    // Mostrar a selecionada
    document.getElementById(viewId).classList.add('active');

    // Atualizar menu lateral
    if (navElement) {
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        navElement.classList.add('active');
    }

    if (viewId === 'view-dashboard') {
        carregarDespesas();
    }
}

// Carregar Despesas do Banco de Dados
async function carregarDespesas() {
    const tbody = document.getElementById('expenses-tbody');
    
    if (!supabase) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading-td">Supabase não configurado. Adicione a chave no app.js</td></tr>';
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

        if (despesas.length === 0) {
            html = '<tr><td colspan="4" class="loading-td">Nenhuma despesa lançada ainda!</td></tr>';
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
            
            // Atualiza Dashboard
            document.getElementById('ultima-data').innerText = formatData(despesas[0].data);
        }

        tbody.innerHTML = html;
        document.getElementById('total-gasto').innerText = formatter.format(totalGasto);
        document.getElementById('total-lancamentos').innerText = despesas.length;

    } catch (err) {
        console.error('Erro ao carregar:', err);
        tbody.innerHTML = '<tr><td colspan="4" class="loading-td" style="color: var(--accent-red)">Erro ao carregar os dados. Verifique o console.</td></tr>';
    }
}

// Salvar Nova Despesa
document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabase) {
        alert("Supabase não configurado! Coloque a chave anon no app.js");
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
            .insert([
                { descricao, valor, categoria, data }
            ]);

        if (error) throw error;

        // Limpa form e volta pro inicio
        document.getElementById('expense-form').reset();
        mostrarToast();
        switchView('view-dashboard', document.getElementById('nav-dashboard'));

    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert('Erro ao salvar despesa. Verifique se a tabela foi criada corretamente.');
    } finally {
        btnSubmit.innerHTML = '<i class="fa-solid fa-check"></i> Salvar Despesa';
        btnSubmit.disabled = false;
    }
});

// Toast Notification
function mostrarToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Iniciar app carregando dados se a chave estiver configurada
window.onload = () => {
    if (supabase) carregarDespesas();
};
