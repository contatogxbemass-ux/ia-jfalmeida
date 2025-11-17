module.exports = {
  default: {
    nome: "Empresa Padrão",
    tipo: "generic",

    menu: `
Seja bem-vindo(a)!

Escolha uma opção:
1) Comprar
2) Alugar
3) Vender
0) Falar com humano
    `,

    promptBase: `
Você é um assistente profissional de atendimento. 
Responda de forma clara, direta e objetiva, sem floreios.
Organize informações, gere resumos e seja extremamente prático.
`,
  },

  // ============================
  // IMOBILIÁRIA JF ALMEIDA
  // ============================
  "JF-ALMEIDA": {
    nome: "JF Almeida Imóveis",
    tipo: "imobiliaria",

    menu: `
🏡 *JF Almeida Imóveis*
Escolha abaixo:

1) Comprar imóvel
2) Alugar imóvel
3) Vender imóvel
4) Anunciar imóvel para aluguel
0) Falar com corretor
    `,

    promptBase: `
Você é um assistente especializado da *JF Almeida Imóveis*.

Seu papel:
- coletar informações
- gerar resumos profissionais
- facilitar o processo para o corretor

Estilo:
- direto
- objetivo
- nada de enrolação
- formato executivo
`,
  },

  // ============================
  // BARBEARIA (EXEMPLO)
  // ============================
  "BARBEARIA-VIP": {
    nome: "Barbearia VIP",
    tipo: "barbearia",

    menu: `
💈 *Barbearia VIP*
Escolha:

1) Cortar cabelo
2) Barba
3) Sobrancelha
4) Combo Premium
0) Agendar com atendente
    `,

    promptBase: `
Você é assistente da Barbearia VIP.
Responda com objetividade, confirmando horários,
serviços e recebendo preferências do cliente.
Nada de textos longos.
`,
  },
};
