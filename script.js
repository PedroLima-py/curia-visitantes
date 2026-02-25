
(function() {
    console.log('Sistema de Registro Rápido iniciado...');
    
    // Configuração do Supabase
    const SUPABASE_CONFIG = {
        url: 'https://rkqbjgbctamlrwkceiob.supabase.co',
        key: 'sb_publishable_pWBLvfOwFB4sjeL4mDZy_A_ziMgkTfW'
    };

    let supabaseClient = null;
    let elementos = {};
    let setoresSelecionados = [];
    let timeoutBusca = null;

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
                setorSelector: document.getElementById('setorSelector'),
                btnAdicionarSetor: document.getElementById('btnAdicionarSetor'),
                setoresSelecionadosDiv: document.getElementById('setoresSelecionados'),
                setoresHidden: document.getElementById('setores'),
                observacaoInput: document.getElementById('observacao'),
                btnText: document.querySelector('.btn-text'),
                btnLoader: document.querySelector('.btn-loader'),
                
                // Elementos de busca rápida
                buscaRapida: document.getElementById('buscaRapida'),
                btnBuscarRapido: document.getElementById('btnBuscarRapido'),
                btnLimparBusca: document.getElementById('btnLimparBusca'),
                resultadoBusca: document.getElementById('resultadoBusca')
            };

            // Configurações
            configurarFormatacaoCPF();
            configurarDataHora();
            configurarSelecaoSetores();
            configurarBuscaRapida();
            configurarEventos();
            
            // Carrega últimos registros
            carregarUltimosRegistros();
            
            // Foco inicial
            if (elementos.buscaRapida) elementos.buscaRapida.focus();
            
            console.log('Sistema pronto para uso rápido!');
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
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

        elementos.btnAdicionarSetor.addEventListener('click', adicionarSetor);
        
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
        
        elementos.setoresHidden.value = JSON.stringify(setoresSelecionados.map(s => s.value));
        window.removerSetor = removerSetor;
    }

    function configurarBuscaRapida() {
        if (!elementos.buscaRapida || !elementos.btnBuscarRapido) return;

        // Busca ao digitar (com debounce)
        elementos.buscaRapida.addEventListener('input', () => {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(realizarBuscaRapida, 500);
        });

        // Busca ao clicar no botão
        elementos.btnBuscarRapido.addEventListener('click', realizarBuscaRapida);

        // Busca ao pressionar Enter
        elementos.buscaRapida.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                realizarBuscaRapida();
            }
        });

        // Limpar busca
        if (elementos.btnLimparBusca) {
            elementos.btnLimparBusca.addEventListener('click', limparBusca);
        }

        // Fechar resultados ao clicar fora
        document.addEventListener('click', (e) => {
            if (!elementos.resultadoBusca.contains(e.target) && 
                !elementos.buscaRapida.contains(e.target) && 
                !elementos.btnBuscarRapido.contains(e.target)) {
                elementos.resultadoBusca.style.display = 'none';
            }
        });
    }

    async function realizarBuscaRapida() {
        const termo = elementos.buscaRapida.value.trim();
        if (!termo || !supabaseClient) return;

        try {
            let query = supabaseClient
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            // Busca por nome ou CPF
            if (termo.replace(/\D/g, '').length >= 11) {
                // É CPF
                const cpfLimpo = termo.replace(/\D/g, '');
                query = query.eq('cpf', cpfLimpo);
            } else {
                // É nome
                query = query.ilike('nome', `%${termo.toUpperCase()}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            exibirResultadosBusca(data);

        } catch (error) {
            console.error('Erro na busca:', error);
            elementos.resultadoBusca.innerHTML = '<div class="resultado-item" style="color: var(--vermelho);">Erro ao buscar. Tente novamente.</div>';
            elementos.resultadoBusca.style.display = 'block';
        }
    }

    function exibirResultadosBusca(resultados) {
        if (!elementos.resultadoBusca) return;

        if (!resultados || resultados.length === 0) {
            elementos.resultadoBusca.innerHTML = '<div class="resultado-item" style="color: var(--cinza-600);">Nenhum visitante encontrado</div>';
            elementos.resultadoBusca.style.display = 'block';
            return;
        }

        const html = resultados.map(visitante => {
            const ultimaVisita = new Date(visitante.created_at).toLocaleDateString('pt-BR');
            return `
                <div class="resultado-item" onclick="window.copiarDados('${visitante.id}')">
                    <div class="resultado-info">
                        <div class="resultado-nome">${visitante.nome}</div>
                        <div class="resultado-cpf">${visitante.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div>
                        <div class="resultado-ultima">Última visita: ${ultimaVisita}</div>
                    </div>
                    <span class="resultado-badge">Copiar</span>
                </div>
            `;
        }).join('');

        elementos.resultadoBusca.innerHTML = html;
        elementos.resultadoBusca.style.display = 'block';

        // Função global para copiar dados
        window.copiarDados = async (id) => {
            const visitante = resultados.find(v => v.id === id);
            if (visitante) {
                copiarParaFormulario(visitante);
                elementos.resultadoBusca.style.display = 'none';
                elementos.buscaRapida.value = '';
                mostrarNotificacao('Dados copiados com sucesso!');
            }
        };
    }

    function copiarParaFormulario(visitante) {
        // Copia nome e CPF
        if (elementos.nomeInput) elementos.nomeInput.value = visitante.nome;
        if (elementos.cpfInput) {
            const cpfFormatado = visitante.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            elementos.cpfInput.value = cpfFormatado;
        }
        
        // Limpa setores anteriores
        setoresSelecionados = [];
        atualizarInterfaceSetores();
        
        // Foco no seletor de setores
        if (elementos.setorSelector) elementos.setorSelector.focus();
        
        // Rola até o formulário
        elementos.form.scrollIntoView({ behavior: 'smooth' });
    }

    function limparBusca() {
        if (elementos.buscaRapida) elementos.buscaRapida.value = '';
        if (elementos.resultadoBusca) elementos.resultadoBusca.style.display = 'none';
        if (elementos.nomeInput) elementos.nomeInput.focus();
    }

    function mostrarNotificacao(mensagem) {
        const notificacao = document.createElement('div');
        notificacao.className = 'copiado-indicator';
        notificacao.textContent = mensagem;
        document.body.appendChild(notificacao);
        
        setTimeout(() => {
            notificacao.remove();
        }, 3000);
    }

    async function carregarUltimosRegistros() {
        if (!elementos.corpoTabela || !supabaseClient) return;
        
        try {
            const { data, error } = await supabaseClient
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

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
                            <td>
                                <button class="btn-copiar" onclick="window.copiarDadosTabela('${item.id}')">
                                    Copiar
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Função para copiar da tabela
                window.copiarDadosTabela = async (id) => {
                    const item = data.find(v => v.id === id);
                    if (item) {
                        copiarParaFormulario(item);
                        mostrarNotificacao('Dados copiados da tabela!');
                    }
                };

            } else {
                elementos.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum registro encontrado</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar:', error);
            elementos.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--vermelho);">Erro ao carregar registros</td></tr>';
        }
    }

    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        return true;
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
            
            elementos.btnSalvar.disabled = true;
            if (elementos.btnText) elementos.btnText.style.display = 'none';
            if (elementos.btnLoader) elementos.btnLoader.style.display = 'inline';
            
            const dados = {
                nome: elementos.nomeInput ? elementos.nomeInput.value.trim().toUpperCase() : '',
                cpf: elementos.cpfInput ? elementos.cpfInput.value.replace(/\D/g, '') : '',
                setor: elementos.setoresHidden ? elementos.setoresHidden.value : '[]',
                observacao: elementos.observacaoInput ? elementos.observacaoInput.value.trim() || null : null
            };
            
            try {
                if (!dados.nome) throw new Error('Digite o nome do visitante');
                if (!dados.cpf) throw new Error('Digite o CPF');
                if (!validarCPF(dados.cpf)) throw new Error('CPF inválido');
                
                const setoresArray = JSON.parse(dados.setor);
                if (setoresArray.length === 0) throw new Error('Selecione pelo menos um setor');
                
                const { error } = await supabaseClient
                    .from('visitantes')
                    .insert([dados]);

                if (error) throw error;
                
                mostrarMensagem(`Registro de ${dados.nome} realizado!`, 'sucesso');
                
                // Limpa formulário mas mantém nome e CPF se vieram de cópia
                setoresSelecionados = [];
                atualizarInterfaceSetores();
                if (elementos.observacaoInput) elementos.observacaoInput.value = '';
                
                // Foco no seletor de setores para o próximo registro
                if (elementos.setorSelector) elementos.setorSelector.focus();
                
                // Recarrega últimos registros
                await carregarUltimosRegistros();
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarMensagem(`${error.message}`, 'erro');
            } finally {
                elementos.btnSalvar.disabled = false;
                if (elementos.btnText) elementos.btnText.style.display = 'inline';
                if (elementos.btnLoader) elementos.btnLoader.style.display = 'none';
            }
        });
    }

    // Recarrega últimos registros a cada 30 segundos
    setInterval(() => {
        if (supabaseClient) carregarUltimosRegistros();
    }, 30000);

})();