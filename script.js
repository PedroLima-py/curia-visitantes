
(function() {
    console.log('Inicializando Sistema da Cúria...');
    
    // Configuração do Supabase
    const SUPABASE_CONFIG = {
        url: 'https://rkqbjgbctamlrwkceiob.supabase.co',
        key: 'sb_publishable_pWBLvfOwFB4sjeL4mDZy_A_ziMgkTfW'
    };

    let supabaseClient = null;
    let elementos = {};
    let setoresSelecionados = [];

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    function iniciar() {
        try {
            // Inicializa Supabase
            if (typeof window.supabase === 'undefined') {
                console.error('Biblioteca do Supabase não carregada');
                mostrarErroCritico('Erro ao carregar bibliotecas. Verifique sua conexão.');
                return;
            }

            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            
            // Captura elementos
            elementos = {
                form: document.getElementById('formCadastro'),
                btnSalvar: document.getElementById('btnSalvar'),
                mensagemDiv: document.getElementById('mensagem'),
                dataSpan: document.getElementById('dataAtual'),
                horaSpan: document.getElementById('horaAtual'),
                corpoTabela: document.getElementById('corpoTabela'),
                nomeInput: document.getElementById('nome'),
                cpfInput: document.getElementById('cpf'),
                documentoInput: document.getElementById('documento'),
                setorSelector: document.getElementById('setorSelector'),
                btnAdicionarSetor: document.getElementById('btnAdicionarSetor'),
                setoresSelecionadosDiv: document.getElementById('setoresSelecionados'),
                setoresHidden: document.getElementById('setores'),
                observacaoInput: document.getElementById('observacao'),
                btnText: document.querySelector('.btn-text'),
                btnLoader: document.querySelector('.btn-loader')
            };

            // Verifica elementos obrigatórios
            const obrigatorios = ['form', 'btnSalvar', 'nomeInput', 'cpfInput', 'setoresHidden'];
            const faltando = obrigatorios.filter(id => !elementos[id]);
            
            if (faltando.length > 0) {
                console.error('Elementos faltando:', faltando);
                return;
            }

            // Configurações
            configurarFormatacaoCPF();
            configurarDataHora();
            configurarSelecaoSetores();
            configurarEventos();
            
            // Carrega dados
            carregarRegistros();
            
            // Foco inicial
            if (elementos.nomeInput) elementos.nomeInput.focus();
            
            console.log('Sistema pronto!');
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }

    function mostrarErroCritico(mensagem) {
        if (elementos.corpoTabela) {
            elementos.corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #DC2626;">${mensagem}</td></tr>`;
        }
    }

    function configurarFormatacaoCPF() {
        if (!elementos.cpfInput) return;
        
        elementos.cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            e.target.value = value;
        });
    }

    function configurarDataHora() {
        function atualizar() {
            const agora = new Date();
            const opcoesData = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            const opcoesHora = { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
            };
            
            if (elementos.dataSpan) {
                elementos.dataSpan.textContent = agora.toLocaleDateString('pt-BR', opcoesData);
            }
            if (elementos.horaSpan) {
                elementos.horaSpan.textContent = agora.toLocaleTimeString('pt-BR', opcoesHora);
            }
        }
        
        atualizar();
        setInterval(atualizar, 1000);
    }

    function configurarSelecaoSetores() {
        if (!elementos.btnAdicionarSetor || !elementos.setorSelector) return;

        // Adicionar setor
        elementos.btnAdicionarSetor.addEventListener('click', adicionarSetor);
        
        // Adicionar com Enter no select
        elementos.setorSelector.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                adicionarSetor();
            }
        });
    }

    function adicionarSetor() {
        const select = elementos.setorSelector;
        if (!select || !select.value) return;
        
        const setor = {
            value: select.value,
            label: select.options[select.selectedIndex].text
        };
        
        if (!setoresSelecionados.some(s => s.value === setor.value)) {
            setoresSelecionados.push(setor);
            atualizarInterfaceSetores();
        }
        
        select.value = '';
    }

    function removerSetor(valor) {
        setoresSelecionados = setoresSelecionados.filter(s => s.value !== valor);
        atualizarInterfaceSetores();
    }

    function atualizarInterfaceSetores() {
        if (!elementos.setoresSelecionadosDiv || !elementos.setoresHidden) return;
        
        // Atualiza visualização
        if (setoresSelecionados.length === 0) {
            elementos.setoresSelecionadosDiv.innerHTML = '<span style="color: var(--cinza-600); font-size: 0.875rem;">Nenhum setor selecionado</span>';
        } else {
            elementos.setoresSelecionadosDiv.innerHTML = setoresSelecionados.map(setor => `
                <span class="tag-setor">
                    ${setor.label}
                    <button type="button" onclick="window.removerSetor('${setor.value}')" title="Remover">×</button>
                </span>
            `).join('');
        }
        
        // Atualiza campo hidden
        elementos.setoresHidden.value = JSON.stringify(setoresSelecionados.map(s => s.value));
        
        // Expõe função global para remoção
        window.removerSetor = removerSetor;
    }

    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        return true;
    }

    async function carregarRegistros() {
        if (!elementos.corpoTabela || !supabaseClient) return;
        
        try {
            const { data, error } = await supabaseClient
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            if (data && data.length > 0) {
                elementos.corpoTabela.innerHTML = data.map(item => {
                    const dataVisita = new Date(item.created_at);
                    let setores = [];
                    
                    try {
                        setores = JSON.parse(item.setor);
                    } catch {
                        setores = [item.setor];
                    }
                    
                    const setoresHtml = Array.isArray(setores) 
                        ? setores.map(s => `<span class="setor-badge">${s}</span>`).join('')
                        : `<span class="setor-badge">${item.setor}</span>`;
                    
                    return `
                        <tr>
                            <td>${dataVisita.toLocaleDateString('pt-BR')}<br><small>${dataVisita.toLocaleTimeString('pt-BR')}</small></td>
                            <td><strong>${item.nome}</strong></td>
                            <td>${item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                            <td><div class="setores-list">${setoresHtml}</div></td>
                            <td>${item.observacao || '-'}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                elementos.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum registro encontrado</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar:', error);
            elementos.corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #DC2626;">Erro ao carregar registros</td></tr>`;
        }
    }

    function mostrarMensagem(texto, tipo) {
        if (!elementos.mensagemDiv) return;
        
        elementos.mensagemDiv.textContent = texto;
        elementos.mensagemDiv.className = `mensagem ${tipo}`;
        elementos.mensagemDiv.style.display = 'block';
        
        setTimeout(() => {
            if (elementos.mensagemDiv) {
                elementos.mensagemDiv.style.display = 'none';
            }
        }, 4000);
    }

    function configurarEventos() {
        if (!elementos.form) return;
        
        elementos.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Desabilita botão
            if (elementos.btnSalvar) elementos.btnSalvar.disabled = true;
            if (elementos.btnText) elementos.btnText.style.display = 'none';
            if (elementos.btnLoader) elementos.btnLoader.style.display = 'inline';
            
            // Coleta dados
            const dados = {
                nome: elementos.nomeInput ? elementos.nomeInput.value.trim().toUpperCase() : '',
                cpf: elementos.cpfInput ? elementos.cpfInput.value.replace(/\D/g, '') : '',
                documento: elementos.documentoInput ? elementos.documentoInput.value.trim() || null : null,
                setor: elementos.setoresHidden ? elementos.setoresHidden.value : '[]',
                observacao: elementos.observacaoInput ? elementos.observacaoInput.value.trim() || null : null
            };
            
            try {
                // Validações
                if (!dados.nome) throw new Error('Digite o nome do visitante');
                if (!dados.cpf) throw new Error('Digite o CPF');
                if (!validarCPF(dados.cpf)) throw new Error('CPF inválido');
                
                const setoresArray = JSON.parse(dados.setor);
                if (setoresArray.length === 0) throw new Error('Selecione pelo menos um setor');
                
                // Insere no banco
                const { error } = await supabaseClient
                    .from('visitantes')
                    .insert([dados]);

                if (error) throw error;
                
                mostrarMensagem(`Registro de ${dados.nome} realizado com sucesso`, 'sucesso');
                
                // Limpa formulário
                elementos.form.reset();
                setoresSelecionados = [];
                atualizarInterfaceSetores();
                if (elementos.nomeInput) elementos.nomeInput.focus();
                
                // Recarrega lista
                await carregarRegistros();
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarMensagem(error.message, 'erro');
            } finally {
                // Restaura botão
                if (elementos.btnSalvar) elementos.btnSalvar.disabled = false;
                if (elementos.btnText) elementos.btnText.style.display = 'inline';
                if (elementos.btnLoader) elementos.btnLoader.style.display = 'none';
            }
        });
    }

    // Recarrega registros a cada 30 segundos
    setInterval(() => {
        if (supabaseClient) carregarRegistros();
    }, 30000);

})();