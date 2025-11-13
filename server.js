const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Permite JSON grande (caso venha mídia, etc)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ===============================================
// 🔥 CONFIG Z-API
// ===============================================
const ZAPI_NUMBER = process.env.ZAPI_NUMBER;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

// ===============================================
// 🔥 CONFIG OPENAI
// ===============================================
const OPENAI_KEY = process.env.OPENAI_KEY;

// ===============================================
// 🔥 ADMINS (NÚMEROS QUE PODEM CONTROLAR OUTROS)
// ===============================================
const ADMINS = [
  "5511942063985",        // você
  // "55OUTRO_NUMERO_AQUI" // corretores / sua mãe / etc.
];

// ===============================================
// 🔥 ESTADO DOS USUÁRIOS
// ===============================================
// estados[telefone] = {
//   etapa: "menu" | ... | "aguardando_corretor",
//   dados: { ... },
//   lastMessageId: string | null,
//   silencio: boolean
// }
const estados = {};

// ===============================================
// 🔥 ROTA DE SAÚDE (opcional, só pra teste rápido)
// ===============================================
app.get("/", (req, res) => {
  res.send("Bot JF Almeida está online.");
});

// ===============================================
// 🔥 WEBHOOK Z-API
// ===============================================
app.post("/webhook", async (req, res) => {
  console.log("📩 RECEBIDO DO Z-API:", JSON.stringify(req.body, null, 2));

  const telefone = req.body.phone || req.body.connectedPhone;
  const texto =
    (req.body.text && req.body.text.message && String(req.body.text.message)) ||
    null;

  const messageId = req.body.messageId || req.body.message || null;

  if (!telefone || !texto) {
    console.log("⚠️ Ignorado: mensagem sem telefone ou sem texto");
    return res.sendStatus(200);
  }

  // Cria estado se não existir
  if (!estados[telefone]) {
    estados[telefone] = {
      etapa: "menu",
      dados: {},
      lastMessageId: null,
      silencio: false,
    };
  }

  const estado = estados[telefone];

  // Anti spam: mesma mensagemId
  if (estado.lastMessageId === messageId) {
    console.log("🔁 Mensagem duplicada, ignorando.");
    return res.sendStatus(200);
  }
  estado.lastMessageId = messageId;

  const msg = texto.trim();
  const msgLower = msg.toLowerCase();
  const partes = msgLower.split(" ").filter(Boolean);

  // ====================================================
  // 📴 COMANDOS GLOBAIS: /pausar E /voltar
  // ====================================================

  // /pausar  -> pausa a conversa atual
  // /pausar 55119xxxxxxx -> ADMIN pausa esse número
  if (partes[0] === "/pausar") {
    if (partes.length === 1) {
      // pausa a conversa atual
      estado.silencio = true;
      console.log("🤫 MODO SILENCIOSO ATIVADO PARA:", telefone);

      await enviarMensagemWhatsApp(
        telefone,
        "🤫 Atendimento automático pausado para esta conversa.\nAgora apenas um corretor humano irá responder."
      );

      return res.sendStatus(200);
    }

    if (partes.length >= 2 && ADMINS.includes(telefone)) {
      const alvo = partes[1];

      if (!estados[alvo]) {
        estados[alvo] = {
          etapa: "aguardando_corretor",
          dados: {},
          lastMessageId: null,
          silencio: true,
        };
      } else {
        estados[alvo].silencio = true;
      }

      console.log(`🤫 ADMIN ${telefone} PAUSOU O NÚMERO: ${alvo}`);

      await enviarMensagemWhatsApp(
        telefone,
        `🤫 Atendimento automático pausado para o número: ${alvo}.`
      );

      return res.sendStatus(200);
    }

    if (partes.length >= 2 && !ADMINS.includes(telefone)) {
      return res.sendStatus(200);
    }
  }

  // /voltar -> volta o bot na conversa atual
  // /voltar 55119xxxxxxx -> ADMIN volta o bot pra esse número
  if (partes[0] === "/voltar") {
    if (partes.length === 1) {
      estado.silencio = false;
      estado.etapa = "menu";
      estado.dados = {};

      console.log("🔊 MODO SILENCIOSO DESATIVADO PARA:", telefone);

      await enviarMensagemWhatsApp(
        telefone,
        "🔊 Atendimento automático reativado. Vou te mostrar o menu novamente:"
      );
      await enviarMensagemWhatsApp(telefone, menuPrincipal());

      return res.sendStatus(200);
    }

    if (partes.length >= 2 && ADMINS.includes(telefone)) {
      const alvo = partes[1];

      if (!estados[alvo]) {
        estados[alvo] = {
          etapa: "menu",
          dados: {},
          lastMessageId: null,
          silencio: false,
        };
      } else {
        estados[alvo].silencio = false;
        estados[alvo].etapa = "menu";
      }

      console.log(`🔊 ADMIN ${telefone} REATIVOU O NÚMERO: ${alvo}`);

      await enviarMensagemWhatsApp(
        telefone,
        `🔊 Atendimento automático reativado para o número: ${alvo}.`
      );

      return res.sendStatus(200);
    }

    if (partes.length >= 2 && !ADMINS.includes(telefone)) {
      return res.sendStatus(200);
    }
  }

  // Se estiver em modo silencioso → não responde nada
  if (estado.silencio) {
    console.log("🤫 Cliente em modo silencioso, bot não responde.");
    return res.sendStatus(200);
  }

  // Se cliente já está aguardando corretor, só deixa sair com "menu"
  if (estado.etapa === "aguardando_corretor" && msgLower !== "menu") {
    console.log("👤 Cliente aguardando corretor, bot em silêncio.");
    return res.sendStatus(200);
  }

  // Comando global: MENU
  if (msgLower === "menu") {
    estado.etapa = "menu";
    estado.dados = {};
    await enviarMensagemWhatsApp(telefone, menuPrincipal());
    return res.sendStatus(200);
  }

  // ====================================================
  // 🧭 ETAPA: MENU PRINCIPAL
  // ====================================================
  if (estado.etapa === "menu") {
    switch (msg) {
      case "1": // Comprar
        estado.etapa = "compra_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Perfeito! Vamos encontrar o imóvel ideal pra você. 😊\n\n" +
            "👉 *Primeiro:* qual *tipo de imóvel* você procura?\n" +
            "(Casa, apartamento, studio, sobrado, etc.)"
        );
        return res.sendStatus(200);

      case "2": // Alugar
        estado.etapa = "alug_cliente_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Ótimo! Vamos te ajudar a alugar um imóvel. 🏠\n\n" +
            "👉 *Primeiro:* qual *tipo de imóvel* você quer alugar?\n" +
            "(Casa, apartamento, studio, kitnet, etc.)"
        );
        return res.sendStatus(200);

      case "3": // Ver imóveis disponíveis
        estado.etapa = "list_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Beleza, vou separar opções para você. 🔎\n\n" +
            "👉 *Primeiro:* qual *tipo de imóvel* você quer ver?\n" +
            "(Casa, apartamento, studio, etc.)"
        );
        return res.sendStatus(200);

      case "4": // Vender
        estado.etapa = "venda_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Show! Vamos te ajudar a vender seu imóvel. 🏡\n\n" +
            "👉 *Primeiro:* qual é o *tipo de imóvel* que você quer vender?\n" +
            "(Casa, apartamento, terreno, etc.)"
        );
        return res.sendStatus(200);

      case "5": // Colocar imóvel para aluguel
        estado.etapa = "alug_prop_tipo";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Perfeito! Vamos te ajudar a colocar seu imóvel para aluguel. 🏠\n\n" +
            "👉 *Primeiro:* qual é o *tipo de imóvel*?\n" +
            "(Casa, apartamento, kitnet, sala comercial, etc.)"
        );
        return res.sendStatus(200);

      case "6": // Financiamentos
        estado.etapa = "fin_renda";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "Ótimo, vamos falar de financiamento. 💰\n\n" +
            "👉 *Primeiro:* qual é a sua *renda mensal aproximada*?"
        );
        return res.sendStatus(200);

      case "0": // Corretor humano
        estado.etapa = "aguardando_corretor";
        estado.dados = {};
        await enviarMensagemWhatsApp(
          telefone,
          "📞 Perfeito! Vou te conectar com um corretor humano.\n\n" +
            "Pra agilizar, me manda:\n" +
            "• Seu *nome completo*\n" +
            "• Melhor *horário pra contato*\n" +
            "• Assunto (compra, venda, aluguel, financiamento…)\n\n" +
            "Um corretor da *JF Almeida* vai te chamar aqui em instantes. 🙂"
        );
        return res.sendStatus(200);

      default:
        await enviarMensagemWhatsApp(
          telefone,
          "Não entendi sua opção. 😅\n\nDigite o número da opção desejada:\n\n" +
            menuPrincipal()
        );
        return res.sendStatus(200);
    }
  }

  // ====================================================
  // 🏠 FLUXO COMPRA – pergunta por pergunta
  // ====================================================
  if (estado.etapa === "compra_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "compra_regiao";

    await enviarMensagemWhatsApp(
      telefone,
      "Boa! 🏙️ Agora me diz:\n\n" +
        "👉 Em qual *bairro ou região* você prefere o imóvel?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_regiao") {
    estado.dados.regiao = msg;
    estado.etapa = "compra_orcamento";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito. 💸\n\n" +
        "👉 Qual é o seu *orçamento máximo* aproximado?\n" +
        "(Pode responder algo como: até 300 mil, até 500 mil, etc.)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_orcamento") {
    estado.dados.orcamento = msg;
    estado.etapa = "compra_pagamento";

    await enviarMensagemWhatsApp(
      telefone,
      "Show! ✅\n\n" +
        "👉 A compra seria *financiada ou à vista*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_pagamento") {
    estado.dados.pagamento = msg;
    estado.etapa = "compra_urgencia";

    await enviarMensagemWhatsApp(
      telefone,
      "Entendido. 😉\n\n" +
        "👉 E qual é a *urgência* pra comprar?\n" +
        "(Baixa, média ou alta)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "compra_urgencia") {
    estado.dados.urgencia = msg;

    const resumo = await gerarResumoIA("compra_imovel", estado.dados, telefone);

    await enviarMensagemWhatsApp(telefone, resumo);

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! 🙌\n" +
        "Já encaminhei suas informações para um corretor da *JF Almeida*.\n" +
        "Ele vai te chamar aqui no WhatsApp com opções de imóveis pra você. 🏡"
    );

    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ====================================================
  // 🏡 FLUXO VENDA – pergunta por pergunta
  // ====================================================
  if (estado.etapa === "venda_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "venda_local";

    await enviarMensagemWhatsApp(
      telefone,
      "Ótimo! 📍\n\n" +
        "👉 Em qual *bairro/região* fica esse imóvel?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_local") {
    estado.dados.local = msg;
    estado.etapa = "venda_tamanho";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito. 📏\n\n" +
        "👉 Qual é o *tamanho* aproximado ou *número de quartos*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_tamanho") {
    estado.dados.tamanho = msg;
    estado.etapa = "venda_estado";

    await enviarMensagemWhatsApp(
      telefone,
      "Entendido. 🔧\n\n" +
        "👉 Como está o *estado de conservação* do imóvel?\n" +
        "(Novo, reformado, precisa de reforma, etc.)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_estado") {
    estado.dados.estado = msg;
    estado.etapa = "venda_valor";

    await enviarMensagemWhatsApp(
      telefone,
      "Show!\n\n" +
        "👉 Qual é o *valor desejado* de venda?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "venda_valor") {
    estado.dados.valor = msg;

    const resumo = await gerarResumoIA("venda_imovel", estado.dados, telefone);

    await enviarMensagemWhatsApp(telefone, resumo);

    await enviarMensagemWhatsApp(
      telefone,
      "Maravilha! 🙌\n" +
        "Já passei os dados do seu imóvel para um corretor da *JF Almeida*.\n" +
        "Ele vai entrar em contato pra continuar o atendimento. 📲"
    );

    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ====================================================
  // 💰 FLUXO FINANCIAMENTO – pergunta por pergunta
  // ====================================================
  if (estado.etapa === "fin_renda") {
    estado.dados.renda = msg;
    estado.etapa = "fin_entrada";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito. 💵\n\n" +
        "👉 Quanto você tem hoje de *valor disponível para entrada*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_entrada") {
    estado.dados.entrada = msg;
    estado.etapa = "fin_tipo";

    await enviarMensagemWhatsApp(
      telefone,
      "Boa!\n\n" +
        "👉 Qual *tipo de imóvel* você pretende financiar?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_tipo") {
    estado.dados.tipoImovel = msg;
    estado.etapa = "fin_cidade";

    await enviarMensagemWhatsApp(
      telefone,
      "Show!\n\n" +
        "👉 Em qual *cidade* seria esse imóvel?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_cidade") {
    estado.dados.cidade = msg;
    estado.etapa = "fin_tipoFin";

    await enviarMensagemWhatsApp(
      telefone,
      "Entendido. 📝\n\n" +
        "👉 Você já tem alguma ideia de *tipo de financiamento*?\n" +
        "(Ex: Casa Verde e Amarela, SBPE, ainda não sei, etc.)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "fin_tipoFin") {
    estado.dados.tipoFinanciamento = msg;

    const resumo = await gerarResumoIA(
      "financiamento",
      estado.dados,
      telefone
    );

    await enviarMensagemWhatsApp(telefone, resumo);

    await enviarMensagemWhatsApp(
      telefone,
      "Show! ✅\n" +
        "Já encaminhei seus dados para um especialista em financiamento da *JF Almeida*.\n" +
        "Ele vai te chamar aqui pra te orientar direitinho. 😉"
    );

    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ====================================================
  // 🔎 FLUXO LISTAGEM – pergunta por pergunta
  // ====================================================
  if (estado.etapa === "list_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "list_regiao";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito. 📍\n\n" +
        "👉 Em qual *bairro ou região* você quer ver imóveis?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_regiao") {
    estado.dados.regiao = msg;
    estado.etapa = "list_preco";

    await enviarMensagemWhatsApp(
      telefone,
      "Beleza! 💰\n\n" +
        "👉 Até qual *preço máximo* você pretende investir?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_preco") {
    estado.dados.preco = msg;
    estado.etapa = "list_quartos";

    await enviarMensagemWhatsApp(
      telefone,
      "Show!\n\n" +
        "👉 Quantos *quartos* você busca?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_quartos") {
    estado.dados.quartos = msg;
    estado.etapa = "list_finalidade";

    await enviarMensagemWhatsApp(
      telefone,
      "Quase lá. 😄\n\n" +
        "👉 A *finalidade* é *moradia* ou *investimento*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "list_finalidade") {
    estado.dados.finalidade = msg;

    const resumo = await gerarResumoIA("listagem_imoveis", estado.dados, telefone);

    await enviarMensagemWhatsApp(telefone, resumo);

    await enviarMensagemWhatsApp(
      telefone,
      "Top! 🙌\n" +
        "Já enviei seu perfil para um corretor da *JF Almeida*.\n" +
        "Ele vai te chamar aqui com imóveis selecionados pra você. 🔎🏡"
    );

    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ====================================================
  // 🏠 FLUXO ALUGAR (CLIENTE) – pergunta por pergunta
  // ====================================================
  if (estado.etapa === "alug_cliente_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "alug_cliente_regiao";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! 📍\n\n" +
        "👉 Em qual *bairro ou região* você gostaria de alugar o imóvel?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_regiao") {
    estado.dados.regiao = msg;
    estado.etapa = "alug_cliente_orcamento";

    await enviarMensagemWhatsApp(
      telefone,
      "Show! 💸\n\n" +
        "👉 Qual é o seu *orçamento máximo de aluguel* por mês?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_orcamento") {
    estado.dados.orcamento = msg;
    estado.etapa = "alug_cliente_quartos";

    await enviarMensagemWhatsApp(
      telefone,
      "Entendi. 🛏️\n\n" +
        "👉 Quantos *quartos* você precisa?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_quartos") {
    estado.dados.quartos = msg;
    estado.etapa = "alug_cliente_data";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito. 📅\n\n" +
        "👉 Você pretende se mudar *quando* aproximadamente?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_data") {
    estado.dados.dataMudanca = msg;
    estado.etapa = "alug_cliente_finalidade";

    await enviarMensagemWhatsApp(
      telefone,
      "Show!\n\n" +
        "👉 A finalidade do aluguel é para *moradia* ou *trabalho/empresa*?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_cliente_finalidade") {
    estado.dados.finalidade = msg;

    const resumo = await gerarResumoIA("aluguel_imovel", estado.dados, telefone);

    await enviarMensagemWhatsApp(telefone, resumo);

    await enviarMensagemWhatsApp(
      telefone,
      "Top! 🙌\n" +
        "Já encaminhei seu perfil de aluguel para um corretor da *JF Almeida*.\n" +
        "Ele vai te chamar aqui com opções que encaixam no que você procura. 🏠"
    );

    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // ====================================================
  // 🏠 FLUXO ALUGAR (PROPRIETÁRIO) – colocar imóvel para aluguel
  // ====================================================
  if (estado.etapa === "alug_prop_tipo") {
    estado.dados.tipo = msg;
    estado.etapa = "alug_prop_endereco";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! 📍\n\n" +
        "👉 Em qual *bairro/cidade* o imóvel está localizado?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_endereco") {
    estado.dados.endereco = msg;
    estado.etapa = "alug_prop_quartos";

    await enviarMensagemWhatsApp(
      telefone,
      "Show! 🛏️\n\n" +
        "👉 Quantos *quartos* o imóvel possui?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_quartos") {
    estado.dados.quartos = msg;
    estado.etapa = "alug_prop_estado";

    await enviarMensagemWhatsApp(
      telefone,
      "Entendido. 🔧\n\n" +
        "👉 Como está o *estado de conservação* do imóvel?\n" +
        "(Novo, reformado, bom estado, precisa de reforma, etc.)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_estado") {
    estado.dados.estado = msg;
    estado.etapa = "alug_prop_valor";

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito. 💰\n\n" +
        "👉 Qual é o *valor de aluguel* que você deseja receber por mês?"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_valor") {
    estado.dados.valor = msg;
    estado.etapa = "alug_prop_garantia";

    await enviarMensagemWhatsApp(
      telefone,
      "Show!\n\n" +
        "👉 Você aceita qual tipo de *garantia*?\n" +
        "(Fiador, seguro fiança, caução/depósito, não sei ainda, etc.)"
    );
    return res.sendStatus(200);
  }

  if (estado.etapa === "alug_prop_garantia") {
    estado.dados.garantia = msg;

    const resumo = await gerarResumoIA("aluguel_proprietario", estado.dados, telefone);

    await enviarMensagemWhatsApp(telefone, resumo);

    await enviarMensagemWhatsApp(
      telefone,
      "Perfeito! 🙌\n" +
        "Já encaminhei seus dados para um corretor da *JF Almeida* responsável por locação.\n" +
        "Ele vai te chamar aqui para seguir com o processo. 🏠"
    );

    estado.etapa = "aguardando_corretor";
    return res.sendStatus(200);
  }

  // Se caiu aqui, só responde com menu de segurança
  await enviarMensagemWhatsApp(
    telefone,
    "Não entendi muito bem sua mensagem. 🤔\n\n" +
      "Vou te mostrar o menu novamente:\n\n" +
      menuPrincipal()
  );
  estado.etapa = "menu";
  estado.dados = {};
  return res.sendStatus(200);
});

// ===============================================
// 🔥 MENU PRINCIPAL (texto) – MODELO B
// ===============================================
function menuPrincipal() {
  return (
    "👋 *Bem-vindo(a) à JF Almeida Imóveis!*\n\n" +
    "🏡 *IMÓVEIS PARA VOCÊ*\n" +
    "1️⃣ Quero *comprar* um imóvel\n" +
    "2️⃣ Quero *alugar* um imóvel\n" +
    "3️⃣ Ver *imóveis disponíveis*\n\n" +
    "🏠 *SOU PROPRIETÁRIO*\n" +
    "4️⃣ Quero *vender* um imóvel\n" +
    "5️⃣ Quero *colocar meu imóvel para aluguel*\n\n" +
    "💰 *FINANCEIRO*\n" +
    "6️⃣ Saber sobre *financiamentos*\n\n" +
    "👤 *ATENDIMENTO HUMANO*\n" +
    "0️⃣ Falar com um *corretor humano*\n\n" +
    "Você pode digitar *menu* a qualquer momento pra voltar aqui. 😉"
  );
}

// ===============================================
// 🔥 IA – GERA RESUMO ORGANIZADO
// ===============================================
async function gerarResumoIA(fluxo, dados, telefone) {
  const prompt = `
Organize de forma clara e profissional as informações abaixo
para que um corretor de imóveis da JF Almeida possa atender o cliente.

Tipo de fluxo: ${fluxo}
Telefone do cliente (WhatsApp): ${telefone}

Dados coletados (JSON):
${JSON.stringify(dados, null, 2)}

Monte um texto objetivo com:
- Título (ex: "Resumo – Compra de Imóvel")
- Lista organizada das informações do cliente
- Fechamento agradecendo e dizendo que um corretor da JF Almeida fará contato.
  `.trim();

  try {
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um atendente da JF Almeida Imóveis. Seja claro, profissional e direto.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return r.data.choices[0].message.content;
  } catch (e) {
    console.log("ERRO IA:", e.response?.data || e.message);
    return (
      "Recebi todas as suas informações e já encaminhei para um corretor da JF Almeida. " +
      "Ele vai te chamar aqui pra continuar o atendimento. 🙌"
    );
  }
}

// ===============================================
// 🔥 ENVIO DE MENSAGEM VIA Z-API
// ===============================================
async function enviarMensagemWhatsApp(telefone, texto) {
  try {
    await axios.post(
      `https://api.z-api.io/instances/${ZAPI_NUMBER}/token/${ZAPI_TOKEN}/send-text`,
      {
        phone: telefone,
        message: texto,
      },
      {
        headers: {
          "Client-Token": ZAPI_CLIENT_TOKEN,
        },
      }
    );
  } catch (e) {
    console.log("ERRO ENVIO:", e.response?.data || e.message);
  }
}

// ===============================================
// 🔥 SERVIDOR
// ===============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Servidor rodando na porta " + PORT);
});
