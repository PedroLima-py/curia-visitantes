// Configuração do Supabase - ATUALIZADO COM SUAS CREDENCIAIS
const supabaseUrl = 'https://rkqbjgbctamlrwkceiob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcWJqZ2JjdGFtbHJ3a2NlaW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDQyOTMsImV4cCI6MjA4NzYyMDI5M30.MtNP3-F38-t63tGxBz0biFCGCWG6fxmXWWzMBtZEZJs';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Elementos do DOM
const form = document.getElementById('formCadastro');
const btnSalvar = document.getElementById('btnSalvar');
const mensagemDiv = document.getElementById('mensagem');
const dataSpan = document.getElementById('dataAtual');
const horaSpan = document.getElementById('horaAtual');
const corpoTabela = document.getElementById('corpoTabela');

// Formata CPF enquanto digita
document.getElementById('cpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    e.target.value = value;
});

// Atualiza data e hora em tempo real
function updateDateTime() {
    const now = new Date();
    
    const dataOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dataSpan.textContent = now.toLocaleDateString('pt-BR', dataOptions);
    
    const horaOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    horaSpan.textContent = now.toLocaleTimeString('pt-BR', horaOptions);
}

setInterval(updateDateTime, 1000);
updateDateTime();

// Função para carregar os últimos registros
async function carregarRegistros() {
    try {
        const { data, error } = await supabase
            .from('visitantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
            corpoTabela.innerHTML = data.map(visita => {
                const dataVisita = new Date(visita.created_at);
                return `
                    <tr>
                        <td>${dataVisita.toLocaleDateString('pt-BR')} ${dataVisita.toLocaleTimeString('pt-BR')}</td>
                        <td>${visita.nome}</td>
                        <td>${visita.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                        <td>${visita.setor}</td>
                        <td>${visita.observacao || '-'}</td>
                    </tr>
                `;
            }).join('');
        } else {
            corpoTabela.innerHTML = '<tr><td colspan="5">Nenhum registro encontrado</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
        corpoTabela.innerHTML = '<tr><td colspan="5">Erro ao carregar registros. Verifique sua conexão.</td></tr>';
    }
}

// Função para mostrar mensagem
function mostrarMensagem(texto, tipo) {
    mensagemDiv.textContent = texto;
    mensagemDiv.className = `mensagem ${tipo}`;
    mensagemDiv.style.display = 'block';
    
    setTimeout(() => {
        mensagemDiv.style.display = 'none';
    }, 5000);
}

// Função para resetar o formulário
function resetForm() {
    form.reset();
    updateDateTime();
}

// Evento de submit do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Muda estado do botão para "carregando"
    btnSalvar.disabled = true;
    btnSalvar.querySelector('.btn-text').style.display = 'none';
    btnSalvar.querySelector('.btn-loader').style.display = 'inline';
    
    // Coleta os dados
    const formData = {
        nome: document.getElementById('nome').value.trim(),
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
        setor: document.getElementById('setor').value,
        observacao: document.getElementById('observacao').value.trim() || null
    };
    
    try {
        // Validações básicas
        if (!formData.nome || !formData.cpf || !formData.setor) {
            throw new Error('Por favor, preencha todos os campos obrigatórios');
        }
        
        if (formData.cpf.length !== 11) {
            throw new Error('CPF inválido. Digite um CPF com 11 dígitos');
        }
        
        // Insere no Supabase
        const { data, error } = await supabase
            .from('visitantes')
            .insert([formData])
            .select();

        if (error) {
            // Verifica se é erro de política de segurança
            if (error.message.includes('policy')) {
                throw new Error('Erro de permissão. Execute o SQL de configuração no Supabase primeiro.');
            }
            throw error;
        }
        
        // Sucesso!
        mostrarMensagem('✅ Entrada registrada com sucesso!', 'sucesso');
        resetForm();
        carregarRegistros();
        
    } catch (error) {
        console.error('Erro detalhado:', error);
        mostrarMensagem(`❌ Erro: ${error.message}`, 'erro');
    } finally {
        // Restaura o botão
        btnSalvar.disabled = false;
        btnSalvar.querySelector('.btn-text').style.display = 'inline';
        btnSalvar.querySelector('.btn-loader').style.display = 'none';
    }
});

// Carrega os registros iniciais
carregarRegistros();

// Atualiza a cada 30 segundos
setInterval(carregarRegistros, 30000);