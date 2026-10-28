
// ==========================================
// LOJA 3D - CONFIGURAÇÕES DO SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://ewcatvwkotqpjxvxtwki.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "COLE_A_PUBLISHABLE_KEY_AQUI";

const ADMIN_UID = "COLE_SEU_UID_AQUI";

const WHATSAPP = "5544933007211";
const BUCKET = "produtos";

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function criar(tag, classe = "", texto = "") {
  const el = document.createElement(tag);

  if (classe) el.className = classe;

  el.textContent = texto;

  return el;
}

function moeda(valor) {
  return Number(valor).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}

// VALIDAR ENDEREÇO DAS IMAGENS
function validarFoto(foto) {
  if (!foto) return true;

  if (/^https?:\/\//i.test(foto)) {
    try {
      return ["http:", "https:"].includes(
        new URL(foto).protocol
      );
    } catch {
      return false;
    }
  }

  const caminho = foto.replace(/^\.\//, "");

  return (
    caminho.startsWith("imagens/") &&
    caminho.length > 8 &&
    !caminho.includes("..") &&
    !/[\\:?#]/.test(caminho)
  );
}

// ==========================================
// INICIAR LOJA
// ==========================================

async function iniciarLoja() {

  const admin = document.querySelector(".admin");

  const topo = document.querySelector(".topo");

  const catalogo = document.getElementById(
    "catalogo"
  );

  const listaCores = document.getElementById(
    "listaFilamentos"
  );

  const formModelo = document.getElementById(
    "formModelo"
  );

  const formFilamento = document.getElementById(
    "formFilamento"
  );

  const filtro = document.getElementById(
    "filtroCategoria"
  );

  const botaoTema = document.getElementById(
    "alternarTema"
  );

  const fotoTexto = document.getElementById(
    "fotoModelo"
  );

  if (
    !admin ||
    !topo ||
    !catalogo ||
    !listaCores ||
    !formModelo ||
    !formFilamento
  ) {
    console.error(
      "Elementos da loja não encontrados. Confira o HTML."
    );
    return;
  }

  // ========================================
  // MODO CLARO E ESCURO
  // ========================================

  let tema = "escuro";

  try {
    if (
      localStorage.getItem("loja3d_tema") ===
      "claro"
    ) {
      tema = "claro";
    }
  } catch {}

  function aplicarTema() {

    document.documentElement.dataset.tema = tema;

    if (botaoTema) {
      botaoTema.textContent =
        tema === "escuro"
          ? "☀️ Modo claro"
          : "🌙 Modo escuro";

      botaoTema.setAttribute(
        "aria-pressed",
        String(tema === "claro")
      );
    }
  }

  aplicarTema();

  botaoTema?.addEventListener("click", () => {

    tema = tema === "escuro"
      ? "claro"
      : "escuro";

    aplicarTema();

    try {
      localStorage.setItem(
        "loja3d_tema",
        tema
      );
    } catch {}
  });

  // ========================================
  // MENSAGENS DO SITE
  // ========================================

  const aviso = criar("div");

  aviso.setAttribute("role", "status");

  aviso.style.cssText = `
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    background: #15803d;
    color: white;
    padding: 12px 18px;
    border-radius: 10px;
    max-width: 90vw;
    box-shadow: 0 5px 20px #0006;
    display: none;
  `;

  document.body.appendChild(aviso);

  let tempoAviso;

  function informar(texto, erro = false) {

    aviso.textContent = texto;

    aviso.style.background = erro
      ? "#b91c1c"
      : "#15803d";

    aviso.style.display = "block";

    clearTimeout(tempoAviso);

    tempoAviso = setTimeout(() => {
      aviso.style.display = "none";
    }, 6000);

    if (erro) console.error(texto);
  }

  // ========================================
  // JANELA DE CONFIRMAÇÃO DE EXCLUSÃO
  // ========================================

  function confirmarExclusao(nome) {

    return new Promise(resolve => {

      const fundo = criar("div");

      fundo.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: #0009;
        display: grid;
        place-items: center;
        padding: 20px;
      `;

      const caixa = criar("div");

      caixa.style.cssText = `
        width: 100%;
        max-width: 420px;
        padding: 24px;
        border-radius: 14px;
        background: var(--cartao, #172033);
        color: var(--texto, white);
        border: 1px solid var(--borda, #334155);
      `;

      caixa.setAttribute("role", "dialog");
      caixa.setAttribute("aria-modal", "true");

      caixa.setAttribute(
        "aria-label",
        "Confirmar exclusão"
      );

      caixa.append(
        criar("h3", "", "Excluir item?"),
        criar(
          "p",
          "",
          `Deseja excluir “${nome}”?`
        )
      );

      const botoes = criar("div");

      botoes.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      `;

      const cancelar = criar(
        "button",
        "",
        "Cancelar"
      );

      const excluir = criar(
        "button",
        "",
        "Sim, excluir"
      );

      cancelar.type = "button";
      excluir.type = "button";

      cancelar.style.cssText = `
        background: #64748b;
        color: white;
        padding: 11px;
        border: 0;
        border-radius: 8px;
      `;

      excluir.style.cssText = `
        background: #b91c1c;
        color: white;
        padding: 11px;
        border: 0;
        border-radius: 8px;
      `;

      function finalizar(valor) {

        document.removeEventListener(
          "keydown",
          aoTeclar
        );

        fundo.remove();
        resolve(valor);
      }

      function aoTeclar(e) {
        if (e.key === "Escape") {
          finalizar(false);
        }
      }

      cancelar.onclick = () => finalizar(false);
      excluir.onclick = () => finalizar(true);

      fundo.onclick = e => {
        if (e.target === fundo) {
          finalizar(false);
        }
      };

      document.addEventListener(
        "keydown",
        aoTeclar
      );

      botoes.append(cancelar, excluir);

      caixa.appendChild(botoes);
      fundo.appendChild(caixa);

      document.body.appendChild(fundo);

      excluir.focus();
    });
  }

  // ========================================
  // CONECTAR AO SUPABASE
  // ========================================

  if (!window.supabase?.createClient) {

    informar(
      "A biblioteca Supabase não foi carregada. Confira o index.html.",
      true
    );

    return;
  }

  if (
    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY.includes("COLE_")
  ) {

    informar(
      "Falta preencher SUPABASE_PUBLISHABLE_KEY no script.js.",
      true
    );

    return;
  }

  if (
    !ADMIN_UID ||
    ADMIN_UID.includes("COLE_")
  ) {

    informar(
      "Falta preencher ADMIN_UID no script.js.",
      true
    );

    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  let modelos = [];
  let filamentos = [];
  let administrador = false;

  // ========================================
  // ÁREA ADMINISTRATIVA
  // ========================================

  const botaoAdmin = criar(
    "button",
    "",
    "⚙️ Administração"
  );

  botaoAdmin.type = "button";

  botaoAdmin.style.cssText = `
    padding: 10px 14px;
    border-radius: 25px;
    background: var(--cartao);
    color: var(--texto);
    border: 1px solid var(--borda);
    cursor: pointer;
  `;

  topo.appendChild(botaoAdmin);

  admin.hidden = true;

  botaoAdmin.onclick = () => {

    admin.hidden = !admin.hidden;

    if (!admin.hidden) {
      admin.scrollIntoView({
        behavior: "smooth"
      });
    }
  };

  const painelLogin = criar(
    "div",
    "painel"
  );

  admin.prepend(painelLogin);

  const paineisCadastro = [
    ...admin.querySelectorAll("details")
  ];

  // ========================================
  // PAINEL PARA EXCLUIR ITENS
  // ========================================

  let painelExcluir = document.getElementById(
    "painelExcluirItens"
  );

  if (!painelExcluir) {

    painelExcluir = criar(
      "details",
      "painel"
    );

    painelExcluir.id = "painelExcluirItens";

    painelExcluir.appendChild(
      criar(
        "summary",
        "",
        "🗑️ Gerenciar e excluir itens"
      )
    );

    admin.appendChild(painelExcluir);
  }

  const listaGerenciar = criar("div");

  listaGerenciar.style.paddingTop = "15px";

  painelExcluir.appendChild(listaGerenciar);
  paineisCadastro.push(painelExcluir);

  // ========================================
  // CAMPO PARA ENVIAR FOTO
  // ========================================

  const campoArquivo = criar("input");

  campoArquivo.type = "file";

  campoArquivo.accept =
    "image/png,image/jpeg,image/webp";

  campoArquivo.id = "fotoArquivo";

  if (fotoTexto) {

    const rotulo = criar(
      "label",
      "",
      "Ou escolha uma foto do computador:"
    );

    rotulo.htmlFor = "fotoArquivo";

    fotoTexto.parentElement.append(
      rotulo,
      campoArquivo
    );
  }

  // ========================================
  // VERIFICAR LOGIN
  // ========================================

  async function verificarSessao() {

    const { data, error } = await db.auth.getUser();

    administrador =
      !error &&
      data?.user?.id === ADMIN_UID;

    mostrarLogin();
    renderizar();
  }

  // ========================================
  // INTERFACE DE LOGIN
  // ========================================

  function mostrarLogin() {

    painelLogin.replaceChildren();

    paineisCadastro.forEach(p => {
      p.hidden = !administrador;
    });

    if (administrador) {

      painelLogin.appendChild(
        criar(
          "p",
          "",
          "✅ Administrador conectado"
        )
      );

      const sair = criar(
        "button",
        "btn-salvar",
        "Sair da conta"
      );

      sair.type = "button";

      sair.onclick = async () => {

        const { error } = await db.auth.signOut();

        if (error) {
          return informar(error.message, true);
        }

        administrador = false;

        mostrarLogin();
        renderizar();
      };

      painelLogin.appendChild(sair);

      return;
    }

    painelLogin.appendChild(
      criar(
        "h3",
        "",
        "Entrar como administrador"
      )
    );

    const form = criar("form");

    const email = criar("input");
    email.type = "email";
    email.placeholder = "E-mail";
    email.autocomplete = "username";
    email.required = true;

    const senha = criar("input");
    senha.type = "password";
    senha.placeholder = "Senha";
    senha.autocomplete = "current-password";
    senha.required = true;

    const entrar = criar(
      "button",
      "btn-salvar",
      "Entrar"
    );

    entrar.type = "submit";

    form.append(email, senha, entrar);

    form.onsubmit = async e => {

      e.preventDefault();

      entrar.disabled = true;

      try {

        const { data, error } =
          await db.auth.signInWithPassword({
            email: email.value.trim(),
            password: senha.value
          });

        if (error) throw error;

        if (data.user?.id !== ADMIN_UID) {

          await db.auth.signOut();

          throw new Error(
            "Esta conta não é administradora."
          );
        }

        administrador = true;

        mostrarLogin();
        renderizar();

        informar("Login realizado!");

      } catch (erro) {

        informar(
          "Erro no login: " + erro.message,
          true
        );

      } finally {
        entrar.disabled = false;
      }
    };

    painelLogin.appendChild(form);
  }

  // ========================================
  // CARREGAR PRODUTOS DO SUPABASE
  // ========================================

  async function carregarCatalogo() {

    const [resModelos, resFilamentos] =
      await Promise.all([

        db.from("modelos")
          .select("*")
          .order("criado_em", {
            ascending: false
          }),

        db.from("filamentos")
          .select("*")
          .order("criado_em", {
            ascending: false
          })

      ]);

    if (resModelos.error) {

      informar(
        "Erro ao buscar modelos: " +
        resModelos.error.message,
        true
      );

    } else {

      modelos = resModelos.data || [];
    }

    if (resFilamentos.error) {

      informar(
        "Erro ao buscar filamentos: " +
        resFilamentos.error.message,
        true
      );

    } else {

      filamentos = resFilamentos.data || [];
    }

    renderizar();
  }

  // ========================================
  // EXCLUIR PRODUTO DO SUPABASE
  // ========================================

  async function excluirItem(tipo, item) {

    if (!administrador) {

      return informar(
        "Entre como administrador.",
        true
      );
    }

    const nome = tipo === "modelo"
      ? item.nome
      : `${item.tipo} - ${item.cor}`;

    if (!(await confirmarExclusao(nome))) {
      return;
    }

    const tabela = tipo === "modelo"
      ? "modelos"
      : "filamentos";

    const { data, error } = await db
      .from(tabela)
      .delete()
      .eq("id", item.id)
      .select("id");

    if (error) {

      return informar(
        "Erro ao excluir: " + error.message,
        true
      );
    }

    if (!data?.length) {

      return informar(
        "Exclusão não autorizada. Confira as regras RLS.",
        true
      );
    }

    // REMOVER FOTO ENVIADA PELO FORMULÁRIO
    if (tipo === "modelo" && item.foto) {

      const prefixo =
        `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/catalogo/`;

      if (item.foto.startsWith(prefixo)) {

        const nomeArquivo = decodeURIComponent(
          item.foto
            .slice(prefixo.length)
            .split("?")[0]
        );

        const resultado = await db.storage
          .from(BUCKET)
          .remove([`catalogo/${nomeArquivo}`]);

        if (resultado.error) {

          console.warn(
            "Foto não removida:",
            resultado.error.message
          );
        }
      }
    }

    await carregarCatalogo();

    informar("Item excluído com sucesso!");
  }

  // ========================================
  // MOSTRAR GERENCIAMENTO
  // ========================================

  function mostrarGerenciamento() {

    listaGerenciar.replaceChildren();

    if (!administrador) return;

    const grupos = [
      ["modelo", modelos],
      ["filamento", filamentos]
    ];

    for (const [tipo, itens] of grupos) {

      listaGerenciar.appendChild(
        criar(
          "h3",
          "",
          tipo === "modelo"
            ? "Modelos 3D"
            : "Filamentos"
        )
      );

      if (!itens.length) {

        listaGerenciar.appendChild(
          criar(
            "p",
            "",
            "Nenhum item cadastrado."
          )
        );
      }

      itens.forEach(item => {

        const linha = criar("div");

        linha.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--borda);
          border-radius: 9px;
          padding: 10px;
          margin: 8px 0;
        `;

        const nome = criar(
          "span",
          "",
          tipo === "modelo"
            ? item.nome
            : `${item.tipo} - ${item.cor}`
        );

        nome.style.overflowWrap = "anywhere";

        const excluir = criar(
          "button",
          "",
          "🗑️ Excluir"
        );

        excluir.type = "button";

        excluir.style.cssText = `
          background: #b91c1c;
          color: white;
          border: 0;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
        `;

        excluir.onclick = () => {
          excluirItem(tipo, item);
        };

        linha.append(nome, excluir);

        listaGerenciar.appendChild(linha);
      });
    }
  }

  // ========================================
  // MOSTRAR FILAMENTOS
  // ========================================

  function mostrarFilamentos() {

    listaCores.replaceChildren();

    if (!filamentos.length) {

      listaCores.appendChild(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum filamento cadastrado."
        )
      );

      return;
    }

    filamentos.forEach(f => {

      const linha = criar("div", "cor-item");

      const bolinha = criar(
        "div",
        "cor-bolinha"
      );

      bolinha.style.backgroundColor = f.hex;

      linha.append(
        bolinha,
        criar(
          "span",
          "cor-nome",
          `${f.tipo} - ${f.cor}` +
          (f.marca ? ` (${f.marca})` : "")
        )
      );

      if (administrador) {

        const excluir = criar(
          "button",
          "cor-remover",
          "×"
        );

        excluir.type = "button";

        excluir.onclick = () => {
          excluirItem("filamento", f);
        };

        linha.appendChild(excluir);
      }

      listaCores.appendChild(linha);
    });
  }

  // ========================================
  // MOSTRAR MODELOS 3D
  // ========================================

  function mostrarModelos() {

    catalogo.replaceChildren();

    const categoria = filtro?.value || "Todos";

    const visiveis = modelos.filter(
      m =>
        categoria === "Todos" ||
        m.categoria === categoria
    );

    if (!visiveis.length) {

      catalogo.appendChild(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );

      return;
    }

    visiveis.forEach(m => {

      const card = criar("article", "card");

      // FOTO
      const semFoto = () =>
        criar(
          "div",
          "foto-produto sem-foto",
          "3D"
        );

      if (m.foto) {

        const img = criar(
          "img",
          "foto-produto"
        );

        img.src = m.foto;
        img.alt = m.nome;
        img.loading = "lazy";

        img.onerror = () => {
          img.replaceWith(semFoto());
        };

        card.appendChild(img);

      } else {

        card.appendChild(semFoto());
      }

      // INFORMAÇÕES
      const info = criar(
        "div",
        "info-produto"
      );

      info.append(
        criar("span", "tag", m.categoria),
        criar("h3", "", m.nome),
        criar(
          "p",
          "descricao",
          m.descricao ||
          "Modelo impresso em 3D."
        )
      );

      const temPreco =
        m.preco !== null &&
        m.preco !== undefined &&
        m.preco !== "";

      info.appendChild(
        criar(
          "div",
          "preco",
          temPreco
            ? moeda(m.preco)
            : "Consultar preço"
        )
      );

      // PERSONALIZAÇÃO
      const personalizacao = criar(
        "div",
        "personalizacao"
      );

      const rotuloCor = criar(
        "label",
        "",
        "Cor e material:"
      );

      const seletor = criar("select");

      if (!filamentos.length) {

        const opt = criar(
          "option",
          "",
          "A combinar"
        );

        opt.value = "";

        seletor.appendChild(opt);

      } else {

        filamentos.forEach(f => {

          const opt = criar(
            "option",
            "",
            `${f.tipo} - ${f.cor}`
          );

          opt.value = f.id;

          seletor.appendChild(opt);
        });
      }

      rotuloCor.appendChild(seletor);

      const rotuloQtd = criar(
        "label",
        "",
        "Quantidade:"
      );

      const quantidade = criar("input");

      quantidade.type = "number";
      quantidade.min = "1";
      quantidade.max = "999";
      quantidade.step = "1";
      quantidade.value = "1";

      rotuloQtd.appendChild(quantidade);

      personalizacao.append(
        rotuloCor,
        rotuloQtd
      );

      info.appendChild(personalizacao);

      // WHATSAPP
      const pedir = criar(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      pedir.target = "_blank";
      pedir.rel = "noopener noreferrer";

      function atualizarWhatsApp() {

        const filamento = filamentos.find(
          f => String(f.id) === seletor.value
        );

        const qtd = Math.max(
          1,
          Math.min(
            999,
            Math.floor(
              Number(quantidade.value) || 1
            )
          )
        );

        let mensagem =
          "Olá! Quero encomendar uma impressão 3D.\n\n" +
          `Modelo: ${m.nome}\n` +
          `Categoria: ${m.categoria}\n` +
          `Material e cor: ${
            filamento
              ? `${filamento.tipo} - ${filamento.cor}`
              : "A combinar"
          }\n` +
          `Quantidade: ${qtd}\n`;

        if (temPreco) {

          mensagem +=
            `Preço unitário: ${moeda(m.preco)}\n` +
            `Total estimado: ${
              moeda(Number(m.preco) * qtd)
            }\n`;
        }

        mensagem +=
          "\nGostaria de confirmar a disponibilidade e o valor final!";

        pedir.href =
          `https://wa.me/${WHATSAPP}?text=` +
          encodeURIComponent(mensagem);
      }

      seletor.addEventListener(
        "change",
        atualizarWhatsApp
      );

      quantidade.addEventListener(
        "input",
        atualizarWhatsApp
      );

      pedir.addEventListener(
        "click",
        atualizarWhatsApp
      );

      atualizarWhatsApp();

      info.appendChild(pedir);

      // EXCLUIR MODELO
      if (administrador) {

        const excluir = criar(
          "button",
          "btn-remover",
          "🗑️ Excluir modelo"
        );

        excluir.type = "button";

        excluir.onclick = () => {
          excluirItem("modelo", m);
        };

        info.appendChild(excluir);
      }

      card.appendChild(info);
      catalogo.appendChild(card);
    });
  }

  // ========================================
  // ATUALIZAR A TELA
  // ========================================

  function renderizar() {
    mostrarFilamentos();
    mostrarModelos();
    mostrarGerenciamento();
  }

  // ========================================
  // ENVIAR FOTO AO SUPABASE STORAGE
  // ========================================

  async function enviarFoto(arquivo) {

    const extensoes = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp"
    };

    if (!extensoes[arquivo.type]) {

      throw new Error(
        "Use uma imagem JPG, PNG ou WebP."
      );
    }

    if (arquivo.size > 5 * 1024 * 1024) {

      throw new Error(
        "A foto deve ter até 5 MB."
      );
    }

    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36).slice(2)}`;

    const caminho =
      `catalogo/${id}.${extensoes[arquivo.type]}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(caminho, arquivo, {
        contentType: arquivo.type,
        upsert: false
      });

    if (error) throw error;

    const { data } = db.storage
      .from(BUCKET)
      .getPublicUrl(caminho);

    return {
      url: data.publicUrl,
      caminho
    };
  }

  // ========================================
  // CADASTRAR MODELO NO SUPABASE
  // ========================================

  formModelo.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {

        return informar(
          "Entre como administrador.",
          true
        );
      }

      const nome = document.getElementById(
        "nomeModelo"
      ).value.trim();

      const categoria = document.getElementById(
        "categoriaModelo"
      ).value;

      const descricao = document.getElementById(
        "descricaoModelo"
      ).value.trim();

      const precoTexto = document.getElementById(
        "precoModelo"
      ).value;

      const fotoDigitada =
        fotoTexto?.value.trim() || "";

      const arquivo = campoArquivo.files?.[0];

      const preco = precoTexto === ""
        ? null
        : Number(precoTexto);

      if (!nome) {

        return informar(
          "Preencha o nome do modelo.",
          true
        );
      }

      if (!validarFoto(fotoDigitada)) {

        return informar(
          "Use imagens/foto.png ou um link https:// válido.",
          true
        );
      }

      if (
        preco !== null &&
        (!Number.isFinite(preco) || preco < 0)
      ) {

        return informar(
          "Preço inválido.",
          true
        );
      }

      const botao = formModelo.querySelector(
        '[type="submit"]'
      );

      if (botao) botao.disabled = true;

      let caminhoNovo = null;

      try {

        let foto = fotoDigitada || null;

        if (arquivo) {

          const resultado = await enviarFoto(
            arquivo
          );

          foto = resultado.url;
          caminhoNovo = resultado.caminho;
        }

        const { error } = await db
          .from("modelos")
          .insert({
            nome,
            categoria,
            descricao,
            preco,
            foto
          });

        if (error) throw error;

        formModelo.reset();

        if (filtro) filtro.value = "Todos";

        await carregarCatalogo();

        informar(
          "Modelo salvo no Supabase!"
        );

      } catch (erro) {

        if (caminhoNovo) {

          const limpeza = await db.storage
            .from(BUCKET)
            .remove([caminhoNovo]);

          if (limpeza.error) {

            console.warn(
              "Falha ao limpar foto:",
              limpeza.error
            );
          }
        }

        informar(
          "Erro ao cadastrar modelo: " +
          erro.message,
          true
        );

      } finally {

        if (botao) botao.disabled = false;
      }
    }
  );

  // ========================================
  // CADASTRAR FILAMENTO NO SUPABASE
  // ========================================

  formFilamento.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {

        return informar(
          "Entre como administrador.",
          true
        );
      }

      const cor = document.getElementById(
        "nomeCor"
      ).value.trim();

      const tipo = document.getElementById(
        "tipoFilamento"
      ).value;

      const marca = document.getElementById(
        "marcaFilamento"
      ).value.trim();

      const hex = document.getElementById(
        "corFilamento"
      ).value;

      if (!cor) {

        return informar(
          "Preencha a cor.",
          true
        );
      }

      const botao = formFilamento.querySelector(
        '[type="submit"]'
      );

      if (botao) botao.disabled = true;

      try {

        const { error } = await db
          .from("filamentos")
          .insert({
            cor,
            tipo,
            marca,
            hex
          });

        if (error) throw error;

        formFilamento.reset();

        await carregarCatalogo();

        informar(
          "Filamento salvo no Supabase!"
        );

      } catch (erro) {

        informar(
          "Erro ao cadastrar filamento: " +
          erro.message,
          true
        );

      } finally {

        if (botao) botao.disabled = false;
      }
    }
  );

  filtro?.addEventListener(
    "change",
    mostrarModelos
  );

  // ========================================
  // INICIAR CATÁLOGO E LOGIN
  // ========================================

  await Promise.all([
    carregarCatalogo(),
    verificarSessao()
  ]);
}

// ==========================================
// AGUARDAR O HTML CARREGAR
// ==========================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja,
    { once: true }
  );

} else {

  iniciarLoja();
}
