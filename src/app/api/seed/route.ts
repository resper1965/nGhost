import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chunkText, extractKeywords } from '@/lib/server-utils';

// Sample style documents (writing patterns)
const styleSamples = [
  {
    filename: 'carl-sagan-style.txt',
    type: 'style' as const,
    content: `O cosmos é tudo o que é, ou foi, ou será. Nossa contemplação das estrelas nos eleva acima das preocupações mundanas. Somos feitos do material das estrelas - cada átomo de carbono em nossos corpos foi forjado no coração de uma estrela antiga.

Quando olhamos para o céu noturno, vemos não apenas pontos de luz, mas histórias de nascimento e morte estelar, de galáxias colidindo, de universos em miniatura contidos em cada grão de poeira cósmica. A escala do cosmos humilha e simultaneamente exalta o espírito humano.

A ciência não é apenas um corpo de conhecimento; é uma forma de pensar. Um modo de questionar, de testar, de duvidar com razão. A ignorância é mais perigosa quando se veste de certeza.

Imagine, se puder, um mundo onde cada criança olha para o céu e se pergunta: "O que há lá fora?" Essa curiosidade inata, essa fome de compreensão, é o motor que move a civilização humana através dos séculos.

Somos viajantes em uma pequena nave espacial, derivando através de um oceano cósmico de vastidão incompreensível. Nossa fragilidade é nossa força - pois nos força a pensar, a planejar, a cooperar.`
  },
  {
    filename: 'machado-de-assis-style.txt',
    type: 'style' as const,
    content: `A vida não é mais que um teatro, onde cada um representa o seu papel, com a diferença que uns representam melhor e outros pior. Eu, que sempre fui de observar a humanidade, aprendi que a felicidade é uma ilusão que perseguios, e a desgraça é uma realidade que nos alcança.

O coração humano é um labirinto de contradições. Desejamos o que não temos, desprezamos o que possuímos, e vivemos em eterna insatisfação. Tal é a condição humana, tão ridícula quanto sublime.

Há pessoas que nascem para ser amadas, outras para ser temidas, e um terceiro grupo - talvez o mais numeroso - para ser simplesmente ignorado. A sociedade é assim feita de camadas invisíveis que se sobrepõem sem nunca se misturar.

O tempo cura tudo, diz o povo. Mas o tempo também apaga tudo, inclusive o que não deveria ser esquecido. A memória é seletiva, e nessa seleção está talvez a nossa maior mentira.

Se eu tivesse de definir a vida em uma palavra, diria que ela é um mal-entendido. Começamos sem pedir, terminamos sem querer, e no meio nos esforçamos para dar sentido ao que talvez não tenha sentido algum.`
  }
];

// Sample content documents (factual information)
const contentSamples = [
  {
    filename: 'inteligencia-artificial-fatos.txt',
    type: 'content' as const,
    content: `INTELIGÊNCIA ARTIFICIAL: VISÃO GERAL

A Inteligência Artificial (IA) é um campo da ciência da computação que busca criar sistemas capazes de realizar tarefas que normalmente requerem inteligência humana. Isso inclui aprendizado, raciocínio, percepção e compreensão de linguagem.

HISTÓRICO:
- 1950: Alan Turing propõe o "Teste de Turing" para avaliar inteligência de máquinas
- 1956: Termo "Inteligência Artificial" é cunhado na Conferência de Dartmouth
- 1997: Deep Blue da IBM derrota o campeão de xadrez Garry Kasparov
- 2011: Watson da IBM vence o programa de TV Jeopardy!
- 2022: ChatGPT populariza os modelos de linguagem de grande escala

TIPOS DE IA:
1. IA Estreita (Narrow AI): Especializada em tarefas específicas (ex: reconhecimento facial, assistentes virtuais)
2. IA Geral (AGI): Hipotética IA com capacidades cognitivas humanas completas
3. Superinteligência: IA que superaria a inteligência humana em todas as áreas

TÉCNICAS PRINCIPAIS:
- Machine Learning (Aprendizado de Máquina)
- Deep Learning (Aprendizado Profundo)
- Processamento de Linguagem Natural (PLN)
- Visão Computacional
- Robótica

APLICAÇÕES ATUAIS:
- Diagnóstico médico
- Carros autônomos
- Tradução automática
- Recomendação de conteúdo
- Detecção de fraudes
- Assistentes virtuais

DESAFIOS ÉTICOS:
- Viés algorítmico
- Privacidade de dados
- Deslocamento de empregos
- Responsabilidade em decisões automatizadas`
  },
  {
    filename: 'marte-dados-cientificos.txt',
    type: 'content' as const,
    content: `MARTE: O PLANETA VERMELHO

DADOS FÍSICOS:
- Diâmetro: 6.779 km (53% do diâmetro da Terra)
- Massa: 6,39 × 10²³ kg (11% da massa da Terra)
- Gravidade superficial: 3,72 m/s² (38% da gravidade terrestre)
- Distância média do Sol: 227,9 milhões de km
- Período orbital: 687 dias terrestres
- Período de rotação: 24 horas e 37 minutos

ATMOSFERA:
- Composição: 95,3% CO₂, 2,7% N₂, 1,6% Ar
- Pressão atmosférica: 0,6% da pressão terrestre
- Temperatura média: -63°C
- Variação: -140°C a 20°C

CARACTERÍSTICAS GEOGRÁFICAS:
- Monte Olimpo: O maior vulcão do Sistema Solar (21,9 km de altura)
- Valles Marineris: Sistema de cânions com 4.000 km de extensão
- Calota polar norte: 1.000 km de diâmetro
- Calota polar sul: 400 km de diâmetro

LUAS:
1. Fobos: 22,4 km de diâmetro, órbita a 9.377 km
2. Deimos: 12,4 km de diâmetro, órbita a 23.460 km

MISSÕES IMPORTANTES:
- Mariner 4 (1965): Primeiras fotos de perto
- Viking 1 e 2 (1976): Primeiros pouso bem-sucedidos
- Spirit e Opportunity (2004): Rovers exploradores
- Curiosity (2012): Rover ainda ativo
- Perseverance (2021): Busca de sinais de vida antiga

POSSIBILIDADE DE VIDA:
- Evidência de água líquida no passado
- Metano detectado na atmosfera (possível indicador biológico)
- Micro-organismos terrestres podem sobreviver em condições marcianas

COLONIZAÇÃO:
- Desafios: Radiação, atmosfera fina, poeira tóxica
- Propostas: Terraformação, habitats pressurizados
- Cronograma: Missões tripuladas planejadas para 2030-2040`
  }
];

// POST - Seed sample documents
export async function POST(request: NextRequest) {
  try {
    const allSamples = [...styleSamples, ...contentSamples];
    const results: Array<{ filename: string; type?: string; status: string; reason?: string; chunks?: number }> = [];

    for (const sample of allSamples) {
      // Check if document already exists
      const existing = await db.knowledgeDocument.findFirst({
        where: { filename: sample.filename }
      });

      if (existing) {
        results.push({ filename: sample.filename, status: 'skipped', reason: 'already exists' });
        continue;
      }

      // Chunk the text using shared utility
      const chunkSize = sample.type === 'style' ? 2000 : 1000;
      const overlap = sample.type === 'style' ? 300 : 200;
      const chunks = chunkText(sample.content, chunkSize, overlap);

      // Create document with chunks
      const document = await db.knowledgeDocument.create({
        data: {
          filename: sample.filename,
          type: sample.type,
          fileSize: sample.content.length,
          mimeType: 'text/plain',
          chunkCount: chunks.length,
          chunks: {
            create: chunks.map((chunk, index) => ({
              content: chunk,
              chunkIndex: index,
              keywords: JSON.stringify(extractKeywords(chunk))
            }))
          }
        }
      });

      results.push({
        filename: document.filename,
        type: document.type,
        chunks: document.chunkCount,
        status: 'created'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample documents seeded successfully',
      results
    });
  } catch (error) {
    console.error('Error seeding documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed documents' },
      { status: 500 }
    );
  }
}

// GET - Check seed status
export async function GET(request: NextRequest) {
  try {
    const documents = await db.knowledgeDocument.findMany({
      select: {
        filename: true,
        type: true,
        chunkCount: true
      }
    });

    return NextResponse.json({
      success: true,
      documents,
      totalChunks: documents.reduce((sum, d) => sum + d.chunkCount, 0)
    });
  } catch (error) {
    console.error('Error checking seed status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
