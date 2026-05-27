export type Question = {
  q: string;
  options: string[];
  correct: number; // 0..3
};

// 3 fases x 3 perguntas (Fácil, Médio, Difícil)
export const LEVELS: Question[][] = [
  [
    {
      q: "O solo não é um elemento estático, mas um corpo natural dinâmico. O processo de formação do solo, que envolve a transformação da rocha mãe através de fatores como clima e organismos ao longo do tempo, é chamado de:",
      options: ["Erosão", "Pedogênese", "Lixiviação", "Compactação"],
      correct: 1,
    },
    {
      q: "Em qual tipo de relevo costumamos encontrar os solos mais profundos e bem desenvolvidos?",
      options: [
        "Encostas íngremes",
        "Topos de montanhas escarpadas",
        "Áreas planas ou suavemente onduladas",
        "Vales estreitos com forte correnteza",
      ],
      correct: 2,
    },
    {
      q: "O horizonte no topo do perfil do solo, composto majoritariamente por material mineral misturado com matéria orgânica em decomposição, é o:",
      options: ["Horizonte A", "Horizonte C", "Horizonte R (Rocha)", "Horizonte E"],
      correct: 0,
    },
  ],
  [
    {
      q: "A compactação do solo é um problema grave. Qual prática agrícola é a principal causa desse processo em grandes lavouras?",
      options: [
        "Rotação de culturas",
        "Uso excessivo de máquinas pesadas e implementos agrícolas",
        "Aplicação de adubos orgânicos",
        "Plantio de leguminosas para fixação de nitrogênio",
      ],
      correct: 1,
    },
    {
      q: "Qual é o principal objetivo do terraceamento em terrenos inclinados?",
      options: [
        "Aumentar a acidez do solo",
        "Facilitar o escoamento rápido da água da chuva",
        "Reduzir a velocidade do escoamento superficial e controlar a erosão hídrica",
        "Eliminar a necessidade de fertilizantes",
      ],
      correct: 2,
    },
    {
      q: "A 'Cobertura Morta' ajuda o solo principalmente porque:",
      options: [
        "Esfria o solo excessivamente",
        "Protege o solo contra o impacto direto das gotas de chuva (efeito splash)",
        "Acelera a lixiviação de nutrientes",
        "Diminui a macrofauna bioindicadora",
      ],
      correct: 1,
    },
  ],
  [
    {
      q: "Segundo o SiBCS, solos com horizonte B incipiente, em estágio inicial de desenvolvimento, são os:",
      options: ["Latossolos", "Cambissolos", "Argissolos", "Neossolos"],
      correct: 1,
    },
    {
      q: "Os Espodossolos (comuns em Restinga) são definidos por:",
      options: [
        "Horizonte B espódico com acúmulo de matéria orgânica e alumínio, abaixo de um horizonte E claro",
        "Alta saturação por bases e minerais primários",
        "Profundidade superior a 2 metros de homogeneidade",
        "Plintita e pedras pela variação do lençol freático",
      ],
      correct: 0,
    },
    {
      q: "Um solo com horizonte B textural (Bt), aumento nítido de argila em profundidade e cerosidade visível é classificado como:",
      options: ["Nitossolo", "Gleissolo", "Argissolo", "Planossolo"],
      correct: 2,
    },
    {
      q: "Na descrição morfológica de um perfil de solo, qual é a interpretação correta para a presença de um horizonte designado pela letra maiúscula \"E\"?",
      options: [
        "Camada de rocha consolidada e contínua que serve de base ao perfil",
        "Horizonte de transição com propriedades mistas entre o topo e a base",
        "Horizonte eluvial, caracterizado pela perda (lavagem) de argila, ferro ou matéria orgânica, com cores geralmente claras",
        "Horizonte mineral com acúmulo de sais solúveis e carbonatos em regiões áridas",
      ],
      correct: 2,
    },
    {
      q: "O que significa o sufixo \"t\" em um horizonte designado como \"Bt\"?",
      options: [
        "Pedoturbação por atividades de aração",
        "Acúmulo de argila iluvial, caracterizando um horizonte textural (comum em Argissolos)",
        "Toxicidade por alumínio trocável em níveis elevados",
        "Consistência muito firme por concreções de ferro",
      ],
      correct: 1,
    },
    {
      q: "Em solos de baixada ou drenagem muito lenta (várzeas, próximos a Restingas), o sufixo \"g\" representa:",
      options: [
        "Presença de gesso ou cristais de gipsita ao longo do perfil",
        "Estrutura granular extremamente forte e persistente",
        "Grande quantidade de cascalhos e calhaus (pedregosidade)",
        "Gleização: redução do ferro por excesso de água, gerando cores acinzentadas ou azuladas",
      ],
      correct: 3,
    },
  ],
];