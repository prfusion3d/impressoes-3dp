
// =======================================================
// LOJA 3D - MODELOS E FILAMENTOS COM FOTO / SUPABASE
// =======================================================

const SUPABASE_URL = "https://ewcatvwkotqpjxvxtwki.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_hddmRKnrt40Tvhr8q0-eXA_1jbaZWIj";
const ADMIN_UID = "e8634885-a9bb-4747-9e5e-4b7e11f77366";
const WHATSAPP = "5544933007211";
const BUCKET = "produtos";

function criar(tag, classe = "", texto = "") {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

function moeda(numero) {
  return Number(numero).toLocaleString("pt-BR", {
    style: "currency", currency: "BRL"
  });
}

function fotoValida(foto) {
  if (!foto) return true;

  if (/^https?:\/\//i.test(foto)) {
    try {
      return ["https:", "http:"].includes(
        new URL(foto).protocol
      );
    } catch {
      return false;
    }
  }

  const local = foto.replace(/^\.\//, "");

  return local.startsWith("imagens/") &&
    local.length > 8 &&
    !local.includes("..") &&
    !/[\\:?#]/.test(local);
}

// =======================================================
// INICIAR LOJA
// =======================================================

function iniciarLoja() {

  const admin = document.querySelector(".admin");
  const topo = document.querySelector(".topo");

  const catalogo =
    document.getElementById("catalogo");

  const listaCores =
    document.getElementById("listaFilamentos");

  const formModelo =
    document.getElementById("formModelo");

  const formFilamento =
    document.getElementById("formFilamento");

  const filtro =
    document.getElementById("filtroCategoria");

  const botaoTema =
    document.getElementById("alternarTema");

  if (
    !admin || !topo || !catalogo ||
    !listaCores || !formModelo || !formFilamento
  ) {
    console.error(
      "Faltam elementos no HTML. Atualize index.html."
    );
    return;
  }

  if (!window.supabase?.createClient) {
    alert(
      "Não foi possível carregar o Supabase. Confira a internet e o index.html."
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

  // =====================================================
  // NOTIFICAÇÕES
  // =====================================================

  const aviso = criar("div");

  aviso.setAttribute("role", "status");

  aviso.style.cssText = `
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    padding: 12px 18px;
    border-radius: 10px;
    background: #15803d;
    color: white;
    max-width: 90vw;
    box-shadow: 0 8px 20px #0006;
    display: none;
  `;

  document.body.append(aviso);

  let timerAviso;

  function informar(mensagem, erro = false) {
    aviso.textContent = mensagem;
    aviso.style.background = erro
      ? "#b91c1c"
      : "#15803d";
    aviso.style.display = "block";

    clearTimeout(timerAviso);

    timerAviso = setTimeout(() => {
      aviso.style.display = "none";
    }, 6500);

    if (erro) console.error(mensagem);
  }

  // =====================================================
  // MODO CLARO E ESCURO
  // =====================================================

  let tema = "escuro";

  try {
    tema = localStorage.getItem("loja3d_tema") === "claro"
      ? "claro"
      : "escuro";
  } catch {}

  function aplicarTema() {
    document.documentElement.dataset.tema = tema;

    if (botaoTema) {
      botaoTema.textContent = tema === "claro"
        ? "🌙 Modo escuro"
        : "☀️ Modo claro";
    }
  }

  aplicarTema();

  botaoTema?.addEventListener("click", () => {
    tema = tema === "claro" ? "escuro" : "claro";
    aplicarTema();

    try {
      localStorage.setItem("loja3d_tema", tema);
    } catch {}
  });

  // =====================================================
  // ÁREA ADMINISTRATIVA
  // =====================================================

  const botaoAdmin = criar(
    "button",
    "",
    "⚙️ Administração"
  );

  botaoAdmin.type = "button";

  botaoAdmin.style.cssText = `
    padding: 10px 14px;
    border-radius: 24px;
    cursor: pointer;
    background: var(--cartao, #1e293b);
    color: var(--texto, white);
    border: 1px solid var(--borda, #64748b);
  `;

  topo.append(botaoAdmin);

  admin.hidden = true;

  botaoAdmin.addEventListener("click", () => {
    admin.hidden = !admin.hidden;

    if (!admin.hidden) {
      admin.scrollIntoView({
        behavior: "smooth"
      });
    }
  });

  const painelLogin = criar("div", "painel");

  admin.prepend(painelLogin);

  const paineisCadastro = [
    ...admin.querySelectorAll("details")
  ];

  let painelExcluir = document.getElementById(
    "painelExcluirItens"
  );

  if (!painelExcluir) {
    painelExcluir = criar("details", "painel");
    painelExcluir.id = "painelExcluirItens";

    painelExcluir.append(
      criar(
        "summary",
        "",
        "🗑️ Gerenciar e excluir itens"
      )
    );

    admin.append(painelExcluir);
  }

  if (!paineisCadastro.includes(painelExcluir)) {
    paineisCadastro.push(painelExcluir);
  }

  const listaGerenciar = criar("div");

  listaGerenciar.style.paddingTop = "14px";

  painelExcluir.append(listaGerenciar);

  // =====================================================
  // CONFIRMAR EXCLUSÃO
  // =====================================================

  function confirmarExclusao(nome) {
    return new Promise(resolve => {

      const fundo = criar("div");

      fundo.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: grid;
        place-items: center;
        background: #000a;
        padding: 16px;
      `;

      const caixa = criar("div");

      caixa.setAttribute("role", "dialog");
      caixa.setAttribute("aria-modal", "true");

      caixa.style.cssText = `
        width: 100%;
        max-width: 400px;
        padding: 24px;
        border-radius: 14px;
        background: var(--cartao, #172033);
        color: var(--texto, #fff);
        border: 1px solid var(--borda, #64748b);
      `;

      caixa.append(
        criar("h3", "", "Excluir item?"),
        criar(
          "p",
          "",
          `Deseja excluir “${nome}”?`
        )
      );

      const linha = criar("div");

      linha.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 16px;
      `;

      const nao = criar("button", "", "Cancelar");
      const sim = criar("button", "", "Sim, excluir");

      [nao, sim].forEach(b => {
        b.type = "button";

        b.style.cssText = `
          border: 0;
          padding: 10px;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        `;
      });

      nao.style.background = "#64748b";
      sim.style.background = "#b91c1c";

      const anterior = document.activeElement;

      function fim(valor) {
        document.removeEventListener(
          "keydown",
          tecla
        );

        fundo.remove();

        if (anterior?.isConnected) {
          anterior.focus();
        }

        resolve(valor);
      }

      function tecla(e) {
        if (e.key === "Escape") fim(false);
      }

      nao.addEventListener("click", () => fim(false));
      sim.addEventListener("click", () => fim(true));

      fundo.addEventListener("click", e => {
        if (e.target === fundo) fim(false);
      });

      document.addEventListener("keydown", tecla);

      linha.append(nao, sim);
      caixa.append(linha);
      fundo.append(caixa);
      document.body.append(fundo);

      nao.focus();
    });
  }

  // =====================================================
  // LOGIN ADMINISTRATIVO
  // =====================================================

  function mostrarLogin() {

    painelLogin.replaceChildren();

    paineisCadastro.forEach(p => {
      p.hidden = !administrador;
    });

    if (administrador) {

      painelLogin.append(
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

      sair.addEventListener("click", async () => {
        const { error } = await db.auth.signOut();

        if (error) {
          return informar(
            "Erro ao sair: " + error.message,
            true
          );
        }

        administrador = false;
        mostrarLogin();
        renderizar();
      });

      painelLogin.append(sair);
      return;
    }

    painelLogin.append(
      criar(
        "h3",
        "",
        "Entrar como administrador"
      )
    );

    const formulario = criar("form");

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

    formulario.append(email, senha, entrar);

    formulario.addEventListener(
      "submit",
      async e => {

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
              "Esta conta não é a administradora autorizada."
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
      }
    );

    painelLogin.append(formulario);
  }

  async function verificarSessao() {
    const { data, error } = await db.auth.getUser();

    administrador =
      !error &&
      data?.user?.id === ADMIN_UID;

    mostrarLogin();
    renderizar();
  }

  // =====================================================
  // ENVIAR FOTO AO SUPABASE
  // Funciona para modelos e filamentos
  // =====================================================

  async function enviarFoto(arquivo, pasta) {

    const extensoes = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp"
    };

    if (!extensoes[arquivo.type]) {
      throw new Error(
        "Use fotos PNG, JPG ou WebP."
      );
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      throw new Error(
        "A foto deve ter até 5 MB."
      );
    }

    const id =
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36).slice(2)}`;

    const caminho =
      `${pasta}/${id}.${extensoes[arquivo.type]}`;

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

  async function limparFoto(caminho) {
    if (!caminho) return;

    const { error } = await db.storage
      .from(BUCKET)
      .remove([caminho]);

    if (error) {
      console.warn(
        "Foto não removida:",
        error.message
      );
    }
  }

  function caminhoDaFoto(foto) {
    if (!foto) return null;

    const prefixo =
      `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

    if (!foto.startsWith(prefixo)) return null;

    try {
      const caminho = decodeURIComponent(
        foto.slice(prefixo.length).split("?")[0]
      );

      if (
        !/^(catalogo|filamentos)\/[\w.\-/]+$/.test(caminho) ||
        caminho.includes("..")
      ) {
        return null;
      }

      return caminho;

    } catch {
      return null;
    }
  }

  // =====================================================
  // CARREGAR DADOS DO BANCO
  // =====================================================

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
        "Erro ao carregar modelos: " +
        resModelos.error.message,
        true
      );
    } else {
      modelos = resModelos.data || [];
    }

    if (resFilamentos.error) {
      informar(
        "Erro ao carregar filamentos: " +
        resFilamentos.error.message,
        true
      );
    } else {
      filamentos = resFilamentos.data || [];
    }

    renderizar();
  }

  // =====================================================
  // EXCLUIR MODELO OU FILAMENTO
  // =====================================================

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

    if (!await confirmarExclusao(nome)) return;

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
        "Exclusão bloqueada. Confira as permissões RLS.",
        true
      );
    }

    const caminho = caminhoDaFoto(item.foto);

    if (caminho) await limparFoto(caminho);

    await carregarCatalogo();

    informar("Item excluído com sucesso!");
  }

  // =====================================================
  // GERENCIAR E EXCLUIR ITENS
  // =====================================================

  function mostrarGerenciamento() {

    listaGerenciar.replaceChildren();

    if (!administrador) return;

    for (const [tipo, itens] of [
      ["modelo", modelos],
      ["filamento", filamentos]
    ]) {

      listaGerenciar.append(
        criar(
          "h3",
          "",
          tipo === "modelo"
            ? "Modelos 3D"
            : "Filamentos"
        )
      );

      if (!itens.length) {
        listaGerenciar.append(
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
          padding: 10px;
          border: 1px solid var(--borda, #64748b);
          border-radius: 9px;
          margin: 8px 0;
        `;

        const nome = criar(
          "span",
          "",
          tipo === "modelo"
            ? item.nome
            : `${item.tipo} - ${item.cor}`
        );

        const botao = criar(
          "button",
          "",
          "🗑️ Excluir"
        );

        botao.type = "button";

        botao.style.cssText = `
          background: #b91c1c;
          color: white;
          border: 0;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
        `;

        botao.addEventListener("click", () => {
          excluirItem(tipo, item);
        });

        linha.append(nome, botao);
        listaGerenciar.append(linha);
      });
    }
  }

  // =====================================================
  // EDITAR FOTO DE FILAMENTO EXISTENTE
  // =====================================================

  function editarFotoFilamento(f) {

    if (!administrador) {
      return informar(
        "Entre como administrador.",
        true
      );
    }

    const fundo = criar("div");

    fundo.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: #000a;
      display: grid;
      place-items: center;
      padding: 16px;
    `;

    const caixa = criar("div");

    caixa.style.cssText = `
      width: 100%;
      max-width: 440px;
      padding: 22px;
      border-radius: 12px;
      background: var(--cartao, #172033);
      color: var(--texto, #fff);
      border: 1px solid var(--borda, #64748b);
    `;

    caixa.setAttribute("role", "dialog");
    caixa.setAttribute("aria-modal", "true");

    caixa.setAttribute(
      "aria-label",
      "Editar foto do filamento"
    );

    caixa.append(
      criar(
        "h3",
        "",
        `Foto de ${f.tipo} - ${f.cor}`
      )
    );

    caixa.append(
      criar(
        "p",
        "",
        "Cole um link, selecione uma foto ou deixe tudo vazio para remover a imagem."
      )
    );

    const rotuloUrl = criar(
      "label",
      "",
      "Link da imagem:"
    );

    const url = criar("input");

    url.type = "text";
    url.value = f.foto || "";
    url.placeholder = "https://...";

    url.style.cssText = `
      display: block;
      box-sizing: border-box;
      width: 100%;
      padding: 10px;
      margin: 8px 0 14px;
    `;

    const rotuloArquivo = criar(
      "label",
      "",
      "Ou escolha um arquivo:"
    );

    const arquivo = criar("input");

    arquivo.type = "file";

    arquivo.accept =
      "image/png,image/jpeg,image/webp";

    arquivo.style.cssText = `
      display: block;
      width: 100%;
      margin: 8px 0 16px;
    `;

    const acoes = criar("div");

    acoes.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    `;

    const cancelar = criar(
      "button",
      "",
      "Cancelar"
    );

    const salvar = criar(
      "button",
      "",
      "Salvar foto"
    );

    for (const b of [cancelar, salvar]) {
      b.type = "button";

      b.style.cssText = `
        border: 0;
        border-radius: 8px;
        padding: 10px 14px;
        cursor: pointer;
        color: white;
      `;
    }

    cancelar.style.background = "#64748b";
    salvar.style.background = "#15803d";

    const anterior = document.activeElement;

    function fechar() {
      document.removeEventListener(
        "keydown",
        tecla
      );

      fundo.remove();

      if (anterior?.isConnected) {
        anterior.focus();
      }
    }

    function tecla(e) {
      if (
        e.key === "Escape" &&
        !salvar.disabled
      ) {
        fechar();
      }
    }

    cancelar.addEventListener("click", fechar);

    fundo.addEventListener("click", e => {
      if (
        e.target === fundo &&
        !salvar.disabled
      ) {
        fechar();
      }
    });

    document.addEventListener("keydown", tecla);

    salvar.addEventListener("click", async () => {

      const textoUrl = url.value.trim();

      if (!fotoValida(textoUrl)) {
        return informar(
          "Link da foto inválido.",
          true
        );
      }

      salvar.disabled = true;
      cancelar.disabled = true;

      let caminhoNovo = null;

      try {
        let novaFoto = textoUrl || null;

        if (arquivo.files[0]) {

          const enviada = await enviarFoto(
            arquivo.files[0],
            "filamentos"
          );

          novaFoto = enviada.url;
          caminhoNovo = enviada.caminho;
        }

        const { data, error } = await db
          .from("filamentos")
          .update({ foto: novaFoto })
          .eq("id", f.id)
          .select("id");

        if (error) throw error;

        if (!data?.length) {
          throw new Error(
            "Atualização bloqueada pelas permissões RLS."
          );
        }

        const antigo = caminhoDaFoto(f.foto);

        if (
          antigo &&
          f.foto !== novaFoto
        ) {
          await limparFoto(antigo);
        }

        fechar();

        await carregarCatalogo();

        informar(
          "Foto do filamento atualizada!"
        );

      } catch (erro) {

        if (caminhoNovo) {
          await limparFoto(caminhoNovo);
        }

        informar(
          "Erro ao salvar foto: " +
          erro.message,
          true
        );

      } finally {
        salvar.disabled = false;
        cancelar.disabled = false;
      }
    });

    acoes.append(cancelar, salvar);

    caixa.append(
      rotuloUrl,
      url,
      rotuloArquivo,
      arquivo,
      acoes
    );

    fundo.append(caixa);

    document.body.append(fundo);

    url.focus();
  }

  // =====================================================
  // MOSTRAR FILAMENTOS COM FOTOS
  // =====================================================

  function mostrarFilamentos() {

    listaCores.replaceChildren();

    if (!filamentos.length) {
      listaCores.append(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum filamento cadastrado."
        )
      );
      return;
    }

    filamentos.forEach(f => {

      const linha = criar(
        "div",
        "cor-item"
      );

      // FOTO REAL DO FILAMENTO

      if (
        f.foto &&
        fotoValida(f.foto)
      ) {

        const img = criar(
          "img",
          "foto-filamento"
        );

        img.src = f.foto;

        img.alt =
          `Foto do filamento ${f.tipo} ${f.cor}`;

        img.loading = "lazy";

        img.addEventListener(
          "error",
          () => img.remove(),
          { once: true }
        );

        linha.append(img);
      }

      // BOLINHA DA COR

      const bolinha = criar(
        "div",
        "cor-bolinha"
      );

      bolinha.style.backgroundColor = f.hex;

      linha.append(bolinha);

      // INFORMAÇÕES DO FILAMENTO

      linha.append(
        criar(
          "span",
          "cor-nome",
          `${f.tipo} - ${f.cor}` +
          (f.marca ? ` (${f.marca})` : "")
        )
      );

      // BOTÕES ADMINISTRATIVOS

      if (administrador) {

        const editar = criar(
          "button",
          "editar-foto-filamento",
          "📷 Editar foto"
        );

        editar.type = "button";

        editar.addEventListener("click", () => {
          editarFotoFilamento(f);
        });

        const excluir = criar(
          "button",
          "cor-remover",
          "×"
        );

        excluir.type = "button";

        excluir.setAttribute(
          "aria-label",
          `Excluir filamento ${f.cor}`
        );

        excluir.addEventListener("click", () => {
          excluirItem("filamento", f);
        });

        linha.append(editar, excluir);
      }

      listaCores.append(linha);
    });
  }

  // =====================================================
  // MOSTRAR PRODUTOS
  // =====================================================

  function mostrarModelos() {

    catalogo.replaceChildren();

    const categoria =
      filtro?.value || "Todos";

    const visiveis = modelos.filter(
      m =>
        categoria === "Todos" ||
        m.categoria === categoria
    );

    if (!visiveis.length) {

      catalogo.append(
        criar(
          "p",
          "mensagem-vazia",
          "Nenhum modelo encontrado."
        )
      );

      return;
    }

    visiveis.forEach(m => {

      const card = criar(
        "article",
        "card"
      );

      function semFoto() {
        return criar(
          "div",
          "foto-produto sem-foto",
          "3D"
        );
      }

      // FOTO DO MODELO

      if (
        m.foto &&
        fotoValida(m.foto)
      ) {

        const img = criar(
          "img",
          "foto-produto"
        );

        img.src = m.foto;
        img.alt = m.nome;
        img.loading = "lazy";

        img.addEventListener(
          "error",
          () => img.replaceWith(semFoto()),
          { once: true }
        );

        card.append(img);

      } else {
        card.append(semFoto());
      }

      // INFORMAÇÕES DO MODELO

      const info = criar(
        "div",
        "info-produto"
      );

      info.append(
        criar(
          "span",
          "tag",
          m.categoria || "Outros"
        )
      );

      info.append(
        criar("h3", "", m.nome)
      );

      info.append(
        criar(
          "p",
          "descricao",
          m.descricao ||
          "Modelo produzido em impressão 3D."
        )
      );

      const temPreco =
        m.preco !== null &&
        m.preco !== undefined &&
        m.preco !== "";

      info.append(
        criar(
          "div",
          "preco",
          temPreco
            ? moeda(m.preco)
            : "Consultar preço"
        )
      );

      // COR E QUANTIDADE

      const bloco = criar(
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

        const opcao = criar(
          "option",
          "",
          "A combinar"
        );

        opcao.value = "";

        seletor.append(opcao);

      } else {

        filamentos.forEach(f => {

          const opcao = criar(
            "option",
            "",
            `${f.tipo} - ${f.cor}`
          );

          opcao.value = f.id;

          seletor.append(opcao);
        });
      }

      rotuloCor.append(seletor);

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

      rotuloQtd.append(quantidade);

      bloco.append(
        rotuloCor,
        rotuloQtd
      );

      info.append(bloco);

      // ===================================================
      // PEDIDO PELO WHATSAPP
      // ===================================================

      const pedir = criar(
        "a",
        "botao-whatsapp",
        "Pedir pelo WhatsApp"
      );

      pedir.target = "_blank";
      pedir.rel = "noopener noreferrer";

      function atualizarWhatsApp() {

        const f = filamentos.find(
          x => String(x.id) === seletor.value
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
          "Olá! Gostaria de pedir uma impressão 3D.\n\n" +
          `Modelo: ${m.nome}\n` +
          `Categoria: ${m.categoria}\n` +
          `Material e cor: ${
            f ? `${f.tipo} - ${f.cor}` : "A combinar"
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
          "\nGostaria de confirmar o valor final e a disponibilidade!";

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

      atualizarWhatsApp();

      info.append(pedir);

      // EXCLUSÃO DE PRODUTO

      if (administrador) {

        const excluir = criar(
          "button",
          "btn-remover",
          "🗑️ Excluir modelo"
        );

        excluir.type = "button";

        excluir.addEventListener("click", () => {
          excluirItem("modelo", m);
        });

        info.append(excluir);
      }

      card.append(info);
      catalogo.append(card);
    });
  }

  // =====================================================
  // ATUALIZAR INTERFACE
  // =====================================================

  function renderizar() {
    mostrarFilamentos();
    mostrarModelos();
    mostrarGerenciamento();
  }

  // =====================================================
  // SALVAR MODELO NO SUPABASE
  // =====================================================

  formModelo.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {
        return informar(
          "Faça login como administrador.",
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

      const preco = precoTexto === ""
        ? null
        : Number(precoTexto);

      const fotoDigitada = document.getElementById(
        "fotoModelo"
      ).value.trim();

      const arquivo = document.getElementById(
        "fotoArquivoModelo"
      ).files[0];

      if (
        !nome ||
        !fotoValida(fotoDigitada) ||
        (
          preco !== null &&
          (!Number.isFinite(preco) || preco < 0)
        )
      ) {
        return informar(
          "Verifique o nome, preço e link da foto do modelo.",
          true
        );
      }

      const botao = formModelo.querySelector(
        '[type="submit"]'
      );

      botao.disabled = true;

      let caminhoEnviado = null;

      try {

        let foto = fotoDigitada || null;

        if (arquivo) {

          const enviado = await enviarFoto(
            arquivo,
            "catalogo"
          );

          foto = enviado.url;
          caminhoEnviado = enviado.caminho;
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
          "Modelo cadastrado com sucesso!"
        );

      } catch (erro) {

        if (caminhoEnviado) {
          await limparFoto(caminhoEnviado);
        }

        informar(
          "Erro ao cadastrar modelo: " +
          erro.message,
          true
        );

      } finally {
        botao.disabled = false;
      }
    }
  );

  // =====================================================
  // SALVAR FILAMENTO COM FOTO NO SUPABASE
  // =====================================================

  formFilamento.addEventListener(
    "submit",
    async e => {

      e.preventDefault();

      if (!administrador) {
        return informar(
          "Faça login como administrador.",
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

      const fotoDigitada = document.getElementById(
        "fotoFilamento"
      ).value.trim();

      const arquivo = document.getElementById(
        "fotoArquivoFilamento"
      ).files[0];

      if (
        !cor ||
        !fotoValida(fotoDigitada)
      ) {
        return informar(
          "Informe uma cor e um link de foto válido.",
          true
        );
      }

      const botao = formFilamento.querySelector(
        '[type="submit"]'
      );

      botao.disabled = true;

      let caminhoEnviado = null;

      try {

        let foto = fotoDigitada || null;

        if (arquivo) {

          const enviado = await enviarFoto(
            arquivo,
            "filamentos"
          );

          foto = enviado.url;
          caminhoEnviado = enviado.caminho;
        }

        const { error } = await db
          .from("filamentos")
          .insert({
            cor,
            tipo,
            marca,
            hex,
            foto
          });

        if (error) throw error;

        formFilamento.reset();

        document.getElementById(
          "corFilamento"
        ).value = "#2563eb";

        await carregarCatalogo();

        informar(
          "Filamento com foto cadastrado no Supabase!"
        );

      } catch (erro) {

        if (caminhoEnviado) {
          await limparFoto(caminhoEnviado);
        }

        informar(
          "Erro ao cadastrar filamento: " +
          erro.message,
          true
        );

      } finally {
        botao.disabled = false;
      }
    }
  );

  // =====================================================
  // FILTRO DE CATEGORIAS
  // =====================================================

  filtro?.addEventListener(
    "change",
    mostrarModelos
  );

  // =====================================================
  // INICIAR LOJA E LOGIN
  // =====================================================

  Promise.all([
    carregarCatalogo(),
    verificarSessao()
  ]).catch(erro => {

    informar(
      "Erro ao iniciar loja: " +
      erro.message,
      true
    );
  });
}

// =======================================================
// AGUARDAR CARREGAMENTO DO HTML
// =======================================================

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    iniciarLoja,
    { once: true }
  );

} else {
  iniciarLoja();
}
