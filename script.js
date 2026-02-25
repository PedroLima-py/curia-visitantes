// Configuração do Supabase
const supabaseUrl = 'https://rkqbjgbctamlrwkceiob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcWJqZ2JjdGFtbHJ3a2NlaW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDQyOTMsImV4cCI6MjA4NzYyMDI5M30.MtNP3-F38-t63tGxBz0biFCGCWG6fxmXWWzMBtZEZJs';

// Verifica se o supabase já foi declarado
if (typeof window.supabaseClient === 'undefined') {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
}
const supabase = window.supabaseClient;

// Aguarda o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema da Cúria iniciado!');
    
    // Elementos do DOM
    const elements = {
        form: document.getElementById('formCadastro'),
        btnSalvar: document.getElementById('btnSalvar'),
        mensagemDiv: document.getElementById('mensagem'),
        dataSpan: document.getElementById('dataAtual'),
        horaSpan: document.getElementById('horaAtual'),
        corpoTabela: document.getElementById('corpoTabela'),
        cpfInput: document.getElementById('cpf'),
        nomeInput: document.getElementById('nome'),
        setorSelect: document.getElementById('setor'),
        observacaoInput: document.getElementById('observacao'),
        btnText: document.querySelector('.btn-text'),
        btnLoader: document.querySelector('.btn-loader')
    };

    // Verifica se todos os elementos existem
    for (const [key, element] of Object.entries(elements)) {
        if (!element && key !== 'btnText' && key !== 'btnLoader') {
            console.error(`❌ Elemento não encontrado: ${key}`);
            return;
        }
    }

    // Lista completa de setores para referência
    const setores = [
        { value: 'Gabinete Episcopal', label: '🏛️ Gabinete Episcopal', grupo: 'Gabinete' },
        { value: 'Chancelaria', label: '📜 Chancelaria', grupo: 'Gabinete' },
        { value: 'Tribunal Eclesiástico', label: '⚖️ Tribunal Eclesiástico', grupo: 'Jurídico' },
        { value: 'Coordenação de Pastoral', label: '🙏 Coordenação de Pastoral', grupo: 'Pastoral' },
        { value: 'Comunicação/Imprensa', label: '📺 Comunicação/Imprensa', grupo: 'Comunicação' },
        { value: 'Administração', label: '📊 Administração', grupo: 'Administração' },
        { value: 'Contabilidade', label: '💰 Contabilidade', grupo: 'Financeiro' },
        { value: 'Tesouraria', label: '💵 Tesouraria', grupo: 'Financeiro' },
        { value: 'Economato', label: '🛒 Economato', grupo: 'Financeiro' },
        { value: 'Gestão de Pessoas', label: '👥 Gestão de Pessoas', grupo: 'RH' },
        { value: 'Jurídico (COVAC)', label: '📋 Jurídico (COVAC)', grupo: 'Jurídico' },
        { value: 'Tecnologia da Informação', label: '💻 Tecnologia da Informação', grupo: 'TI' },
        { value: 'Patrimônio', label: '🏢 Patrimônio', grupo: 'Administração' },
        { value: 'Infraestrutura', label: '🔧 Infraestrutura', grupo: 'Infra' },
        { value: 'Secretaria dos MESCE', label: '📝 Secretaria dos MESCE', grupo: 'Pastoral' },
        { value: 'Banheiro', label: '🚽 Banheiro', grupo: 'Infra' }
    ];

    // Função para formatar CPF
    function formatarCPF(value) {
        if (!value) return '';
        let cpf = value.replace(/\D/g, '');
        if (cpf.length <= 11) {
            cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
            cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
            cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return cpf;
    }

    // Formata CPF enquanto digita
    elements.cpfInput.addEventListener('input', function(e) {
        e.target.value = formatarCPF(e.target.value);
    });

    // Atualiza data e hora
    function updateDateTime() {
        const now = new Date();
        const dataOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const horaOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        };
        
        elements.dataSpan.textContent = now.toLocaleDateString('pt-BR', dataOptions);
        elements.horaSpan.textContent = now.toLocaleTimeString('pt-BR', horaOptions);
    }

    setInterval(updateDateTime, 1000);
    updateDateTime();

    // Carrega registros
    async function carregarRegistros() {
        try {
            const { data, error } = await supabase
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15);

            if (error) throw error;

            if (data && data.length > 0) {
                elements.corpoTabela.innerHTML = data.map(visita => {
                    const dataVisita = new Date(visita.created_at);
                    const cpfFormatado = formatarCPF(visita.cpf);
                    const setorCompleto = setores.find(s => s.value === visita.setor)?.label || visita.setor;
                    
                    return `
                        <tr>
                            <td><strong>${dataVisita.toLocaleDateString('pt-BR')}</strong><br><small>${dataVisita.toLocaleTimeString('pt-BR')}</small></td>
                            <td><strong>${visita.nome}</strong></td>
                            <td>${cpfFormatado}</td>
                            <td><span style="background: var(--azul-bebe); padding: 4px 8px; border-radius: 20px; font-size: 0.9rem;">${setorCompleto}</span></td>
                            <td>${visita.observacao || '-'}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                elements.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 Nenhum registro encontrado</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            elements.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">❌ Erro ao carregar registros</td></tr>';
        }
    }

    // Mostra mensagem
    function mostrarMensagem(texto, tipo) {
        elements.mensagemDiv.textContent = texto;
        elements.mensagemDiv.className = `mensagem ${tipo}`;
        elements.mensagemDiv.style.display = 'block';
        
        setTimeout(() => {
            elements.mensagemDiv.style.display = 'none';
        }, 4000);
    }

    // Reseta formulário
    function resetForm() {
        elements.form.reset();
        updateDateTime();
        elements.nomeInput.focus();
    }

    // Valida CPF (apenas dígitos)
    function validarCPF(cpf) {
        return cpf.replace(/\D/g, '').length === 11;
    }

    // Evento de submit
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Desabilita botão
        elements.btnSalvar.disabled = true;
        if (elements.btnText) elements.btnText.style.display = 'none';
        if (elements.btnLoader) elements.btnLoader.style.display = 'inline';
        
        // Coleta dados
        const formData = {
            nome: elements.nomeInput.value.trim().toUpperCase(),
            cpf: elements.cpfInput.value.replace(/\D/g, ''),
            setor: elements.setorSelect.value,
            observacao: elements.observacaoInput.value.trim() || null
        };
        
        try {
            // Validações
            if (!formData.nome) throw new Error('Por favor, digite o nome do visitante');
            if (!formData.cpf) throw new Error('Por favor, digite o CPF');
            if (!validarCPF(formData.cpf)) throw new Error('CPF deve ter 11 dígitos');
            if (!formData.setor) throw new Error('Selecione um setor de destino');
            
            // Insere no banco
            const { data, error } = await supabase
                .from('visitantes')
                .insert([formData])
                .select();

            if (error) {
                if (error.message.includes('relation')) {
                    throw new Error('Tabela não encontrada. Execute o SQL de configuração no Supabase.');
                }
                if (error.message.includes('policy')) {
                    throw new Error('Erro de permissão. Configure as políticas de segurança no Supabase.');
                }
                throw error;
            }
            
            // Sucesso
            mostrarMensagem(`✅ Registro de ${formData.nome} realizado com sucesso!`, 'sucesso');
            resetForm();
            await carregarRegistros();
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarMensagem(`❌ ${error.message}`, 'erro');
        } finally {
            // Restaura botão
            elements.btnSalvar.disabled = false;
            if (elements.btnText) elements.btnText.style.display = 'inline';
            if (elements.btnLoader) elements.btnLoader.style.display = 'none';
        }
    });

    // Auto-complete para nome (opcional)
    elements.nomeInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            elements.cpfInput.focus();
        }
    });

    // Atalho para setor com Enter no CPF
    elements.cpfInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' && elements.cpfInput.value.replace(/\D/g, '').length === 11) {
            elements.setorSelect.focus();
        }
    });

    // Inicializa
    carregarRegistros();
    elements.nomeInput.focus();

    // Recarrega registros a cada 30 segundos
    setInterval(carregarRegistros, 30000);

    console.log('✅ Sistema pronto para uso!');
});