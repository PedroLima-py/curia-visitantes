(function() {
    // Configuração do Supabase
    const SUPABASE_URL = 'https://rkqbjgbctamlrwkceiob.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_pWBLvfOwFB4sjeL4mDZy_A_ziMgkTfW';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Elementos do DOM
    const elementos = {
        form: document.getElementById('formCadastro'),
        nome: document.getElementById('nome'),
        cpf: document.getElementById('cpf'),
        setorSelector: document.getElementById('setorSelector'),
        btnAdicionarSetor: document.getElementById('btnAdicionarSetor'),
        setoresSelecionados: document.getElementById('setoresSelecionados'),
        setoresHidden: document.getElementById('setores'),
        observacao: document.getElementById('observacao'),
        btnSalvar: document.getElementById('btnSalvar'),
        btnText: document.querySelector('.btn-text'),
        btnLoader: document.querySelector('.btn-loader'),
        mensagem: document.getElementById('mensagem'),
        dataSpan: document.getElementById('dataAtual'),
        horaSpan: document.getElementById('horaAtual'),
        corpoTabela: document.getElementById('corpoTabela'),
        buscaRapida: document.getElementById('buscaRapida'),
        btnBuscar: document.getElementById('btnBuscar'),
        resultadoBusca: document.getElementById('resultadoBusca')
    };

    // Estado
    let setores = [];

    // Inicialização
    function iniciar() {
        configurarFormatacaoCPF();
        configurarDataHora();
        configurarSetores();
        configurarBusca();
        configurarFormulario();
        carregarUltimosRegistros();
        if (elementos.nome) elementos.nome.focus();
    }

    // Formata CPF enquanto digita
    function configurarFormatacaoCPF() {
        elementos.cpf.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            
            e.target.value = value;
        });
    }

    // Atualiza data/hora em tempo real
    function configurarDataHora() {
        function atualizar() {
            const agora = new Date();
            elementos.dataSpan.textContent = agora.toLocaleDateString('pt-BR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            elementos.horaSpan.textContent = agora.toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
        }
        atualizar();
        setInterval(atualizar, 1000);
    }

    // Configura seleção de múltiplos setores
    function configurarSetores() {
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
        if (!select.value) return;

        const setor = {
            valor: select.value,
            texto: select.options[select.selectedIndex].text
        };

        if (!setores.some(s => s.valor === setor.valor)) {
            setores.push(setor);
            renderizarSetores();
        }

        select.value = '';
    }

    function removerSetor(valor) {
        setores = setores.filter(s => s.valor !== valor);
        renderizarSetores();
    }

    function renderizarSetores() {
        if (setores.length === 0) {
            elementos.setoresSelecionados.innerHTML = '<span class="placeholder">Nenhum setor selecionado</span>';
        } else {
            elementos.setoresSelecionados.innerHTML = setores.map(s => `
                <span class="tag-setor">
                    ${s.texto}
                    <button type="button" onclick="window.removerSetor('${s.valor}')">×</button>
                </span>
            `).join('');
        }
        elementos.setoresHidden.value = JSON.stringify(setores.map(s => s.valor));
    }

    window.removerSetor = removerSetor;

    // Configura busca rápida
    function configurarBusca() {
        let timeout;
        elementos.buscaRapida.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(buscarVisitante, 500);
        });

        elementos.btnBuscar.addEventListener('click', buscarVisitante);
        elementos.buscaRapida.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') buscarVisitante();
        });

        document.addEventListener('click', (e) => {
            if (!elementos.resultadoBusca.contains(e.target) && e.target !== elementos.buscaRapida) {
                elementos.resultadoBusca.style.display = 'none';
            }
        });
    }

    async function buscarVisitante() {
        const termo = elementos.buscaRapida.value.trim();
        if (!termo) return;

        let query = supabase.from('visitantes').select('*').order('created_at', { ascending: false }).limit(10);

        const cpfLimpo = termo.replace(/\D/g, '');
        if (cpfLimpo.length === 11) {
            query = query.eq('cpf', cpfLimpo);
        } else {
            query = query.ilike('nome', `%${termo.toUpperCase()}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error(error);
            return;
        }

        if (data.length === 0) {
            elementos.resultadoBusca.innerHTML = '<div class="resultado-item">Nenhum resultado</div>';
        } else {
            elementos.resultadoBusca.innerHTML = data.map(v => `
                <div class="resultado-item" onclick="window.preencherFormulario('${v.id}')">
                    <div class="resultado-nome">${v.nome}</div>
                    <div class="resultado-cpf">${v.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</div>
                </div>
            `).join('');
        }

        elementos.resultadoBusca.style.display = 'block';

        window.preencherFormulario = async (id) => {
            const { data } = await supabase.from('visitantes').select('*').eq('id', id).single();
            if (data) {
                elementos.nome.value = data.nome;
                elementos.cpf.value = data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                elementos.observacao.value = data.observacao || '';
                setores = [];
                renderizarSetores();
                elementos.resultadoBusca.style.display = 'none';
                elementos.buscaRapida.value = '';
                elementos.setorSelector.focus();
                mostrarMensagem('✅ Dados copiados!', 'sucesso');
            }
        };
    }

    // Configura envio do formulário
    function configurarFormulario() {
        elementos.form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validações
            if (!elementos.nome.value.trim()) {
                mostrarMensagem('❌ Digite o nome', 'erro');
                return;
            }

            const cpfLimpo = elementos.cpf.value.replace(/\D/g, '');
            if (cpfLimpo.length !== 11) {
                mostrarMensagem('❌ CPF inválido', 'erro');
                return;
            }

            if (setores.length === 0) {
                mostrarMensagem('❌ Selecione pelo menos um setor', 'erro');
                return;
            }

            // Desabilita botão
            elementos.btnSalvar.disabled = true;
            elementos.btnText.style.display = 'none';
            elementos.btnLoader.style.display = 'inline';

            // Prepara dados
            const dados = {
                nome: elementos.nome.value.trim().toUpperCase(),
                cpf: cpfLimpo,
                setor: JSON.stringify(setores.map(s => s.valor)),
                observacao: elementos.observacao.value.trim() || null
            };

            // Envia
            const { error } = await supabase.from('visitantes').insert([dados]);

            if (error) {
                mostrarMensagem('❌ Erro ao registrar: ' + error.message, 'erro');
            } else {
                mostrarMensagem(`✅ ${dados.nome} registrado com sucesso!`, 'sucesso');
                elementos.form.reset();
                setores = [];
                renderizarSetores();
                carregarUltimosRegistros();
                elementos.nome.focus();
            }

            // Reabilita botão
            elementos.btnSalvar.disabled = false;
            elementos.btnText.style.display = 'inline';
            elementos.btnLoader.style.display = 'none';
        });
    }

    // Carrega últimos registros na tabela
    async function carregarUltimosRegistros() {
        const { data, error } = await supabase
            .from('visitantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            elementos.corpoTabela.innerHTML = '<tr><td colspan="5">Erro ao carregar</td></tr>';
            return;
        }

        if (data.length === 0) {
            elementos.corpoTabela.innerHTML = '<tr><td colspan="5">Nenhum registro</td></tr>';
            return;
        }

        elementos.corpoTabela.innerHTML = data.map(item => {
            const dataVisita = new Date(item.created_at);
            let setoresLista = [];
            try {
                setoresLista = JSON.parse(item.setor);
            } catch {
                setoresLista = [item.setor];
            }

            const setoresHtml = setoresLista.map(s => `<span class="setor-badge">${s}</span>`).join(' ');

            return `
                <tr>
                    <td>${dataVisita.toLocaleDateString('pt-BR')}<br><small>${dataVisita.toLocaleTimeString('pt-BR')}</small></td>
                    <td>${item.nome}</td>
                    <td>${item.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                    <td>${setoresHtml}</td>
                    <td>${item.observacao || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    // Mostra mensagem temporária
    function mostrarMensagem(texto, tipo) {
        elementos.mensagem.textContent = texto;
        elementos.mensagem.className = `mensagem ${tipo}`;
        elementos.mensagem.style.display = 'block';

        setTimeout(() => {
            elementos.mensagem.style.display = 'none';
        }, 4000);
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();