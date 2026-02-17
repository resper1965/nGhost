import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gabi. Ghost Writer | powered by ness.',
  description: 'Sua Ghost Writer de elite com IA. Escreva textos incríveis com duas bases de conhecimento: Estilo e Conteúdo.',
}

// Brand
const ACCENT = '#00ade8'

function PenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="M15 5l2 2" strokeWidth="1.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill={ACCENT}>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function LandingPage() {
  const features = [
    {
      title: 'Base de Estilo',
      desc: 'Gabi aprende seu tom de voz, vocabulário e estrutura. Cada texto soa como se fosse seu.',
      icon: '✍️',
    },
    {
      title: 'Base de Conteúdo',
      desc: 'Alimente com referências, artigos e dados. Gabi consulta tudo antes de escrever.',
      icon: '📚',
    },
    {
      title: 'Busca Híbrida + IA',
      desc: 'Combina busca por palavras-chave com busca vetorial para encontrar os melhores trechos.',
      icon: '🔍',
    },
    {
      title: 'Style Agents',
      desc: 'Crie perfis de escrita nomeados. Gabi analisa e replica qualquer estilo automaticamente.',
      icon: '🎭',
    },
    {
      title: 'Multi-Projeto',
      desc: 'Organize documentos por projeto. Selecione quais bases usar em cada conversa.',
      icon: '📂',
    },
    {
      title: 'Grounding Google',
      desc: 'Complementa sua KB local com informação atualizada da internet via Gemini.',
      icon: '🌐',
    },
  ]

  return (
    <div className="min-h-dvh bg-slate-950 text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenIcon className="w-6 h-6" />
            <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Montserrat, var(--font-dm-sans), sans-serif' }}>
              Gabi<span style={{ color: ACCENT }}>.</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signin"
              className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #0095c9 100%)` }}
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Glow effect */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6" style={{
            background: 'rgba(0, 173, 232, 0.1)',
            border: '1px solid rgba(0, 173, 232, 0.2)',
            color: ACCENT,
          }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Powered by Gemini 2.0 Flash + Vertex AI
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Sua Ghost Writer{' '}
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(135deg, ${ACCENT}, #38bdf8, ${ACCENT})`,
            }}>
              com IA
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gabi é sua escritora fantasma de elite. Alimente com seu estilo e conteúdo — ela escreve como se fosse você.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signin"
              className="px-8 py-3.5 text-base font-semibold text-white rounded-xl transition-all hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #0095c9 100%)` }}
            >
              Começar a Escrever
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-3.5 text-base font-medium text-slate-300 rounded-xl transition-all hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Como Funciona
            </a>
          </div>
        </div>

        {/* Chat preview */}
        <div className="max-w-3xl mx-auto mt-16 relative z-10">
          <div className="rounded-2xl overflow-hidden" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          }}>
            {/* Window bar */}
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-slate-500">Gabi. Ghost Writer</span>
            </div>

            <div className="p-6 space-y-4">
              {/* User message */}
              <div className="flex justify-end">
                <div className="px-4 py-3 rounded-2xl rounded-br-md text-sm text-white max-w-[80%]" style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #0095c9)`,
                }}>
                  Preciso de um post sobre produtividade no home office. Tom informal, direto.
                </div>
              </div>

              {/* Gabi response */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                  background: 'rgba(0,173,232,0.15)',
                  border: '1px solid rgba(0,173,232,0.2)',
                }}>
                  <PenIcon className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md text-sm text-slate-200 max-w-[80%]" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p className="mb-2"><strong>5 Truques de Produtividade que Ninguém Conta</strong></p>
                  <p className="text-slate-400">Trabalhar de casa parece o sonho, né? Até seu gato resolver que o teclado é uma cama. Vamos aos truques que realmente funcionam...</p>
                  <span className="text-xs mt-2 block" style={{ color: ACCENT }}>
                    ● Baseado no seu estilo + 3 referências da KB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Como a Gabi funciona
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Duas bases de conhecimento. Uma escritora inteligente. Textos que soam como você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all hover:scale-[1.02] cursor-default"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-16">
            Em 3 passos simples
          </h2>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Alimente suas bases',
                desc: 'Faça upload de textos de referência na Base de Estilo (seu tom de voz) e na Base de Conteúdo (dados, artigos, informações).',
              },
              {
                step: '02',
                title: 'Peça para a Gabi escrever',
                desc: 'Descreva o que precisa no chat. Gabi combina seu estilo com as referências e gera textos personalizados.',
              },
              {
                step: '03',
                title: 'Refine e exporte',
                desc: 'Ajuste o tom, peça variações, ou exporte direto. Cada versão é salva automaticamente.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="text-4xl font-bold tracking-tight flex-shrink-0 w-16" style={{ color: ACCENT }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Stack de produção
          </h2>
          <p className="text-lg text-slate-400 mb-12">
            100% Google Cloud Platform. Zero dependências externas.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              'Gemini 2.0 Flash',
              'Vertex AI Embeddings',
              'Cloud Run',
              'Cloud SQL + pgvector',
              'Firebase Auth',
              'Google Search Grounding',
            ].map((tech, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-slate-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <CheckIcon />
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${ACCENT}15, transparent 60%)` }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Pronta para escrever{' '}
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(135deg, ${ACCENT}, #38bdf8)`,
            }}>
              por você
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Comece agora. Alimente suas bases, converse com a Gabi, e receba textos que soam exatamente como você.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex px-10 py-4 text-lg font-semibold text-white rounded-xl transition-all hover:shadow-2xl hover:shadow-cyan-500/30 hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #0095c9 100%)` }}
          >
            Começar Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Montserrat, var(--font-dm-sans), sans-serif' }}>
              ness<span style={{ color: ACCENT }}>.</span>
            </span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ness. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
