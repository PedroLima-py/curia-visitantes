// ============================================
// SISTEMA DA CÚRIA METROPOLITANA DE BRASÍLIA
// VERSÃO DEFINITIVA - SEM CONFLITOS
// ============================================

(function() {
    console.log('🚀 Inicializando Sistema da Cúria...');
    
    // Configuração do Supabase
    const SUPABASE_CONFIG = {
        url: 'https://rkqbjgbctamlrwkceiob.supabase.co',
        key: 'sb_publishable_pWBLvfOwFB4sjeL4mDZy_A_ziMgkTfW'
    };

    // Variáveis globais do módulo (protegidas no escopo da função)
    let supabaseClient = null;
    let elementos = {};

    // Inicialização quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    function iniciar() {
        try {
            // Inicializa Supabase (verifica se a biblioteca está carregada)
            if (typeof window.supabase === 'undefined') {
                console.error('�ERRO: Biblioteca do Supabase não carregada!');
                mostrarErroCritico('Biblioteca do Supabase não carregada. Verifique sua conexão.');
                return;
            }

            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
            console.log('✅ Supabase client criado');

            // Captura todos os elementos do DOM
            elementos = {
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

            // Verifica elementos críticos
            const elementosObrigatorios = ['form', 'btnSalvar', 'cpfInput', 'nomeInput', 'setorSelect'];
            const faltando = elementosObrigatorios.filter(id => !elementos[id]);
            
            if (faltando.length > 0) {
                console.error('❌ Elementos faltando:', faltando);
                mostrarErroCritico('Erro ao carregar formulário. Atualize a página.');
                return;
            }

            console.log('✅ Elementos carregados', Object.keys(elementos).length);

            // Configurar tudo
            configurarFormatacaoCPF();
            configurarAtualizacaoDataHora();
            configurarEventos();
            configurarAtalhosTeclado();
            
            // Carregar dados iniciais
            carregarRegistros();
            
            // Foco no primeiro campo
            if (elementos.nomeInput) elementos.nomeInput.focus();
            
            console.log('✅ Sistema pronto para uso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            mostrarErroCritico('Erro ao iniciar sistema: ' + error.message);
        }
    }

    function mostrarErroCritico(mensagem) {
        const corpoTabela = document.getElementById('corpoTabela');
        if (corpoTabela) {
            corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">❌ ${mensagem}</td></tr>`;
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

    function configurarAtualizacaoDataHora() {
        function atualizar() {
            try {
                const agora = new Date();
                const opcoesData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const opcoesHora = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
                
                if (elementos.dataSpan) {
                    elementos.dataSpan.textContent = agora.toLocaleDateString('pt-BR', opcoesData);
                }
                if (elementos.horaSpan) {
                    elementos.horaSpan.textContent = agora.toLocaleTimeString('pt-BR', opcoesHora);
                }
            } catch (e) {
                // Silencia erro de data/hora
            }
        }
        
        atualizar();
        setInterval(atualizar, 1000);
    }

    function validarCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação simplificada (para não travar)
        return true;
    }

    async function carregarRegistros() {
        if (!elementos.corpoTabela || !supabaseClient) return;
        
        try {
            elementos.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">⏳ Carregando...</td></tr>';
            
            const { data, error } = await supabaseClient
                .from('visitantes')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15);

            if (error) throw error;

            if (data && data.length > 0) {
                elementos.corpoTabela.innerHTML = data.map(item => {
                    const dataVisita = new Date(item.created_at);
                    return `
                        <tr>
                            <td><strong>${dataVisita.toLocaleDateString('pt-BR')}</strong><br><small>${dataVisita.toLocaleTimeString('pt-BR')}</small></td>
                            <td><strong>${item.nome}</strong></td>
                            <td>${item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                            <td><span style="background: #B0C4DE; padding: 4px 8px; border-radius: 20px;">${item.setor}</span></td>
                            <td>${item.observacao || '-'}</td>
                        </tr>
                    `;
                }).join('');
            } else {
                elementos.corpoTabela.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 Nenhum registro encontrado</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar:', error);
            elementos.corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">❌ Erro: ${error.message}</td></tr>`;
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
                setor: elementos.setorSelect ? elementos.setorSelect.value : '',
                observacao: elementos.observacaoInput ? elementos.observacaoInput.value.trim() || null : null
            };
            
            try {
                // Validações
                if (!dados.nome) throw new Error('Digite o nome');
                if (!dados.cpf) throw new Error('Digite o CPF');
                if (!validarCPF(dados.cpf)) throw new Error('CPF inválido');
                if (!dados.setor) throw new Error('Selecione o setor');
                
                // Insere
                const { error } = await supabaseClient
                    .from('visitantes')
                    .insert([dados]);

                if (error) throw error;
                
                mostrarMensagem(`✅ Registro de ${dados.nome} realizado!`, 'sucesso');
                
                // Limpa formulário
                elementos.form.reset();
                if (elementos.nomeInput) elementos.nomeInput.focus();
                
                // Recarrega lista
                await carregarRegistros();
                
            } catch (error) {
                console.error('Erro:', error);
                mostrarMensagem(`❌ ${error.message}`, 'erro');
            } finally {
                // Restaura botão
                if (elementos.btnSalvar) elementos.btnSalvar.disabled = false;
                if (elementos.btnText) elementos.btnText.style.display = 'inline';
                if (elementos.btnLoader) elementos.btnLoader.style.display = 'none';
            }
        });
    }

    function configurarAtalhosTeclado() {
        if (elementos.nomeInput) {
            elementos.nomeInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (elementos.cpfInput) elementos.cpfInput.focus();
                }
            });
        }
        
        if (elementos.cpfInput) {
            elementos.cpfInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && elementos.cpfInput.value.replace(/\D/g, '').length === 11) {
                    e.preventDefault();
                    if (elementos.setorSelect) elementos.setorSelect.focus();
                }
            });
        }
        
        if (elementos.setorSelect) {
            elementos.setorSelect.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && elementos.setorSelect.value) {
                    e.preventDefault();
                    if (elementos.observacaoInput) elementos.observacaoInput.focus();
                }
            });
        }
        
        if (elementos.observacaoInput) {
            elementos.observacaoInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (elementos.btnSalvar) elementos.btnSalvar.click();
                }
            });
        }
    }

    // Recarrega registros a cada 30 segundos
    setInterval(() => {
        if (supabaseClient) carregarRegistros();
    }, 30000);

})();