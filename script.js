// Verifica se o supabase já foi declarado globalmente
if (typeof window._supabase === 'undefined') {
    // Configuração do Supabase
    const supabaseUrl = 'https://rkqbjgbctamlrwkceiob.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcWJqZ2JjdGFtbHJ3a2NlaW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDQyOTMsImV4cCI6MjA4NzYyMDI5M30.MtNP3-F38-t63tGxBz0biFCGCWG6fxmXWWzMBtZEZJs';
    
    // Cria o cliente Supabase e guarda no window para evitar duplicidade
    window._supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
}

// Usa a instância global
const supabase = window._supabase;

// IIFE para isolar o escopo e evitar conflitos
(function() {
    // Aguarda o DOM carregar completamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarSistema);
    } else {
        iniciarSistema();
    }

    function iniciarSistema() {
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

        // Verifica elementos essenciais
        for (const [key, element] of Object.entries(elements)) {
            if (!element && key !== 'btnText' && key !== 'btnLoader') {
                console.error(`❌ Elemento não encontrado: ${key}`);
                return;
            }
        }

        // Lista de setores com emojis
        const setores = [
            { value: 'Gabinete Episcopal', label: '🏛️ Gabinete Episcopal' },
            { value: 'Chancelaria', label: '📜 Chancelaria' },
            { value: 'Tribunal Eclesiástico', label: '⚖️ Tribunal Eclesiástico' },
            { value: 'Coordenação de Pastoral', label: '🙏 Coordenação de Pastoral' },
            { value: 'Comunicação/Imprensa', label: '📺 Comunicação/Imprensa' },
            { value: 'Administração', label: '📊 Administração' },
            { value: 'Contabilidade', label: '💰 Contabilidade' },
            { value: 'Tesouraria', label: '💵 Tesouraria' },
            { value: 'Economato', label: '🛒 Economato' },
            { value: 'Gestão de Pessoas', label: '👥 Gestão de Pessoas' },
            { value: 'Jurídico (COVAC)', label: '📋 Jurídico (COVAC)' },
            { value: 'Tecnologia da Informação', label: '💻 Tecnologia da Informação' },
            { value: 'Patrimônio', label: '🏢 Patrimônio' },
            { value: 'Infraestrutura', label: '🔧 Infraestrutura' },
            { value: 'Secretaria dos MESCE', label: '📝 Secretaria dos MESCE' },
            { value: 'Banheiro', label: '🚽 Banheiro' }
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
        if (elements.cpfInput) {
            elements.cpfInput.addEventListener('input', function(e) {
                e.target.value = formatarCPF(e.target.value);
            });
        }

        // Atualiza data e hora
        function updateDateTime() {
            try {
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
                
                if (elements.dataSpan) {
                    elements.dataSpan.textContent = now.toLocaleDateString('pt-BR', dataOptions);
                }
                if (elements.horaSpan) {
                    elements.horaSpan.textContent = now.toLocaleTimeString('pt-BR', horaOptions);
                }
            } catch (error) {
                console.error('Erro ao atualizar data/hora:', error);
            }
        }

        setInterval(updateDateTime, 1000);
        updateDateTime();

        // Carrega registros
        async function carregarRegistros() {
            try {
                if (!elements.corpoTabela) return;
                
                elements.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">⏳ Carregando...</td></tr>';
                
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
                        const setorEncontrado = setores.find(s => s.value === visita.setor);
                        const setorLabel = setorEncontrado ? setorEncontrado.label : visita.setor;
                        
                        return `
                            <tr>
                                <td><strong>${dataVisita.toLocaleDateString('pt-BR')}</strong><br><small>${dataVisita.toLocaleTimeString('pt-BR')}</small></td>
                                <td><strong>${visita.nome}</strong></td>
                                <td>${cpfFormatado}</td>
                                <td><span style="background: var(--azul-bebe, #B0C4DE); padding: 4px 8px; border-radius: 20px; font-size: 0.9rem;">${setorLabel}</span></td>
                                <td>${visita.observacao || '-'}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    elements.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 Nenhum registro encontrado</td></tr>';
                }
            } catch (error) {
                console.error('Erro ao carregar registros:', error);
                if (elements.corpoTabela) {
                    elements.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">❌ Erro ao carregar registros</td></tr>';
                }
            }
        }

        // Mostra mensagem
        function mostrarMensagem(texto, tipo) {
            if (!elements.mensagemDiv) return;
            
            elements.mensagemDiv.textContent = texto;
            elements.mensagemDiv.className = `mensagem ${tipo}`;
            elements.mensagemDiv.style.display = 'block';
            
            setTimeout(() => {
                if (elements.mensagemDiv) {
                    elements.mensagemDiv.style.display = 'none';
                }
            }, 4000);
        }

        // Reseta formulário
        function resetForm() {
            if (elements.form) elements.form.reset();
            updateDateTime();
            if (elements.nomeInput) elements.nomeInput.focus();
        }

        // Valida CPF
        function validarCPF(cpf) {
            return cpf.replace(/\D/g, '').length === 11;
        }

        // Evento de submit
        if (elements.form) {
            elements.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Desabilita botão
                if (elements.btnSalvar) elements.btnSalvar.disabled = true;
                if (elements.btnText) elements.btnText.style.display = 'none';
                if (elements.btnLoader) elements.btnLoader.style.display = 'inline';
                
                // Coleta dados
                const formData = {
                    nome: elements.nomeInput ? elements.nomeInput.value.trim().toUpperCase() : '',
                    cpf: elements.cpfInput ? elements.cpfInput.value.replace(/\D/g, '') : '',
                    setor: elements.setorSelect ? elements.setorSelect.value : '',
                    observacao: elements.observacaoInput ? elements.observacaoInput.value.trim() || null : null
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
                    if (elements.btnSalvar) elements.btnSalvar.disabled = false;
                    if (elements.btnText) elements.btnText.style.display = 'inline';
                    if (elements.btnLoader) elements.btnLoader.style.display = 'none';
                }
            });
        }

        // Atalhos de teclado
        if (elements.nomeInput) {
            elements.nomeInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter' && elements.cpfInput) {
                    elements.cpfInput.focus();
                }
            });
        }

        if (elements.cpfInput) {
            elements.cpfInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter' && elements.cpfInput.value.replace(/\D/g, '').length === 11) {
                    if (elements.setorSelect) elements.setorSelect.focus();
                }
            });
        }

        // Inicializa
        carregarRegistros();
        if (elements.nomeInput) elements.nomeInput.focus();

        // Recarrega registros a cada 30 segundos
        setInterval(carregarRegistros, 30000);

        console.log('✅ Sistema pronto para uso!');
    }
})();