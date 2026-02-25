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
    
    // Variáveis para consulta
    let dadosCompletos = [];
    let dadosFiltrados = [];
    let paginaAtual = 1;
    const registrosPorPagina = 15;

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
                // Formulário
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
                btnLoader: document.querySelector('.btn-loader'),
                
                // Consulta
                btnBuscar: document.getElementById('btnBuscar'),
                btnLimpar: document.getElementById('btnLimparFiltros'),
                btnExportar: document.getElementById('btnExportar'),
                buscaNome: document.getElementById('buscaNome'),
                buscaCPF: document.getElementById('buscaCPF'),
                buscaSetor: document.getElementById('buscaSetor'),
                buscaDataInicio: document.getElementById('buscaDataInicio'),
                buscaDataFim: document.getElementById('buscaDataFim'),
                corpoTabelaConsulta: document.getElementById('corpoTabelaConsulta'),
                totalRegistros: document.getElementById('totalRegistros'),
                paginacao: document.getElementById('paginacao')
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
            configurarConsulta();
            
            // Carrega dados
            carregarRegistros();
            carregarDadosConsulta();
            carregarEstatisticas();
            
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
        
        // Formata CPF no campo de busca
        if (elementos.buscaCPF) {
            elementos.buscaCPF.addEventListener('input', function(e) {
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
            
            elementos.btnSalvar.disabled = true;
            if (elementos.btnText) elementos.btnText.style.display = 'none';
            if (elementos.btnLoader) elementos.btnLoader.style.display = 'inline';
            
            const dados = {
                nome: elementos.nomeInput ? elementos.nomeInput.value.trim().toUpperCase() : '',
                cpf: elementos.cpfInput ? elementos.cpfInput.value.replace(/\D/g, '') : '',
                documento: elementos.documentoInput ? elementos.documentoInput.value.trim() || null : null,
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
                
                mostrarMensagem(`Registro de ${dados.nome} realizado com sucesso`, 'sucesso');
                
                elementos.form.reset();
                setoresSelecionados = [];
                atualizarInterfaceSetores();
                if (elementos.nomeInput) elementos.nomeInput.focus();
                
                await carregarRegistros();
                await carregarDadosConsulta();
                await carregarEstatisticas();
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarMensagem(error.message, 'erro');
            } finally {
                elementos.btnSalvar.disabled = false;
                if (elementos.btnText) elementos.btnText.style.display = 'inline';
                if (elementos.btnLoader) elementos.btnLoader.style.display = 'none';
            }
        });
    }

    // ===== FUNÇÕES DE CONSULTA =====

    function configurarConsulta() {
        if (elementos.btnBuscar) elementos.btnBuscar.addEventListener('click', realizarBusca);
        if (elementos.btnLimpar) elementos.btnLimpar.addEventListener('click', limparFiltros);
        if (elementos.btnExportar) elementos.btnExportar.addEventListener('click', exportarCSV);
    }

    async function carregarDadosConsulta() {
        if (!supabaseClient) return;
        
        try {
            const { data, error } = await supabaseClient
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            dadosCompletos = data || [];
            return dadosCompletos;
        } catch (error) {
            console.error('Erro ao carregar dados para consulta:', error);
            return [];
        }
    }

    async function realizarBusca() {
        if (!elementos.corpoTabelaConsulta) return;
        
        elementos.corpoTabelaConsulta.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">🔍 Buscando...</td></tr>';
        
        if (dadosCompletos.length === 0) {
            await carregarDadosConsulta();
        }
        
        const filtroNome = elementos.buscaNome?.value.toLowerCase() || '';
        const filtroCPF = elementos.buscaCPF?.value.replace(/\D/g, '') || '';
        const filtroSetor = elementos.buscaSetor?.value || '';
        const filtroDataInicio = elementos.buscaDataInicio?.value;
        const filtroDataFim = elementos.buscaDataFim?.value;
        
        dadosFiltrados = dadosCompletos.filter(item => {
            if (filtroNome && !item.nome.toLowerCase().includes(filtroNome)) {
                return false;
            }
            
            if (filtroCPF && item.cpf !== filtroCPF) {
                return false;
            }
            
            if (filtroSetor) {
                let setoresItem = [];
                try {
                    setoresItem = JSON.parse(item.setor);
                } catch {
                    setoresItem = [item.setor];
                }
                
                if (!setoresItem.includes(filtroSetor) && item.setor !== filtroSetor) {
                    return false;
                }
            }
            
            if (filtroDataInicio || filtroDataFim) {
                const dataItem = new Date(item.created_at).setHours(0, 0, 0, 0);
                
                if (filtroDataInicio) {
                    const dataInicio = new Date(filtroDataInicio).setHours(0, 0, 0, 0);
                    if (dataItem < dataInicio) return false;
                }
                
                if (filtroDataFim) {
                    const dataFim = new Date(filtroDataFim).setHours(23, 59, 59, 999);
                    if (dataItem > dataFim) return false;
                }
            }
            
            return true;
        });
        
        if (elementos.totalRegistros) {
            elementos.totalRegistros.textContent = `${dadosFiltrados.length} registro${dadosFiltrados.length !== 1 ? 's' : ''} encontrado${dadosFiltrados.length !== 1 ? 's' : ''}`;
        }
        
        paginaAtual = 1;
        exibirPaginaAtual();
    }

    function exibirPaginaAtual() {
        if (!elementos.corpoTabelaConsulta) return;
        
        if (dadosFiltrados.length === 0) {
            elementos.corpoTabelaConsulta.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum registro encontrado com os filtros aplicados</td></tr>';
            if (elementos.paginacao) elementos.paginacao.innerHTML = '';
            return;
        }
        
        const inicio = (paginaAtual - 1) * registrosPorPagina;
        const fim = inicio + registrosPorPagina;
        const dadosPagina = dadosFiltrados.slice(inicio, fim);
        
        elementos.corpoTabelaConsulta.innerHTML = dadosPagina.map(item => {
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
                    <td>${item.documento || '-'}</td>
                    <td><div class="setores-list">${setoresHtml}</div></td>
                    <td>${item.observacao || '-'}</td>
                </tr>
            `;
        }).join('');
        
        gerarPaginacao();
    }

    function gerarPaginacao() {
        if (!elementos.paginacao) return;
        
        const totalPaginas = Math.ceil(dadosFiltrados.length / registrosPorPagina);
        
        if (totalPaginas <= 1) {
            elementos.paginacao.innerHTML = '';
            return;
        }
        
        let html = '';
        
        html += `<button class="btn-pagina" onclick="window.mudarPagina(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''}>‹</button>`;
        
        for (let i = 1; i <= totalPaginas; i++) {
            if (
                i === 1 || 
                i === totalPaginas || 
                (i >= paginaAtual - 2 && i <= paginaAtual + 2)
            ) {
                html += `<button class="btn-pagina ${i === paginaAtual ? 'ativo' : ''}" onclick="window.mudarPagina(${i})">${i}</button>`;
            } else if (i === paginaAtual - 3 || i === paginaAtual + 3) {
                html += `<span class="btn-pagina" style="border: none; background: none;">...</span>`;
            }
        }
        
        html += `<button class="btn-pagina" onclick="window.mudarPagina(${paginaAtual + 1})" ${paginaAtual === totalPaginas ? 'disabled' : ''}>›</button>`;
        
        elementos.paginacao.innerHTML = html;
        
        window.mudarPagina = function(novaPagina) {
            paginaAtual = novaPagina;
            exibirPaginaAtual();
        };
    }

    function limparFiltros() {
        if (elementos.buscaNome) elementos.buscaNome.value = '';
        if (elementos.buscaCPF) elementos.buscaCPF.value = '';
        if (elementos.buscaSetor) elementos.buscaSetor.value = '';
        if (elementos.buscaDataInicio) elementos.buscaDataInicio.value = '';
        if (elementos.buscaDataFim) elementos.buscaDataFim.value = '';
        
        dadosFiltrados = [...dadosCompletos];
        paginaAtual = 1;
        
        if (elementos.totalRegistros) {
            elementos.totalRegistros.textContent = `${dadosFiltrados.length} registro${dadosFiltrados.length !== 1 ? 's' : ''} encontrado${dadosFiltrados.length !== 1 ? 's' : ''}`;
        }
        
        exibirPaginaAtual();
    }

    function exportarCSV() {
        if (dadosFiltrados.length === 0) {
            alert('Nenhum dado para exportar');
            return;
        }
        
        const cabecalhos = ['Data', 'Hora', 'Nome', 'CPF', 'Documento', 'Setores', 'Observação'];
        
        const linhas = dadosFiltrados.map(item => {
            const data = new Date(item.created_at);
            let setores = [];
            
            try {
                setores = JSON.parse(item.setor);
            } catch {
                setores = [item.setor];
            }
            
            return [
                data.toLocaleDateString('pt-BR'),
                data.toLocaleTimeString('pt-BR'),
                item.nome,
                item.cpf,
                item.documento || '',
                setores.join('; '),
                item.observacao || ''
            ];
        });
        
        const csv = [
            cabecalhos.join(','),
            ...linhas.map(linha => linha.map(campo => `"${campo}"`).join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = `visitantes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    async function carregarEstatisticas() {
        if (!supabaseClient) return;
        
        try {
            const { count: total } = await supabaseClient
                .from('visitantes')
                .select('*', { count: 'exact', head: true });
            
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            const { count: hojeCount } = await supabaseClient
                .from('visitantes')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', hoje.toISOString());
            
            const mes = new Date();
            mes.setDate(1);
            mes.setHours(0, 0, 0, 0);
            
            const { count: mesCount } = await supabaseClient
                .from('visitantes')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', mes.toISOString());
            
            const statsHtml = `
                <div class="estatisticas-rapidas">
                    <div class="estatistica-card">
                        <div class="numero">${total || 0}</div>
                        <div class="rotulo">Total de Visitantes</div>
                    </div>
                    <div class="estatistica-card">
                        <div class="numero">${hojeCount || 0}</div>
                        <div class="rotulo">Hoje</div>
                    </div>
                    <div class="estatistica-card">
                        <div class="numero">${mesCount || 0}</div>
                        <div class="rotulo">Este Mês</div>
                    </div>
                </div>
            `;
            
            const consultaSection = document.querySelector('.consulta-section');
            if (consultaSection && !document.querySelector('.estatisticas-rapidas')) {
                consultaSection.insertAdjacentHTML('beforeend', statsHtml);
            }
            
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    setInterval(() => {
        if (supabaseClient) {
            carregarRegistros();
            carregarDadosConsulta();
        }
    }, 30000);

})();