import NavigationBar from './NavigationBar';

const resources = [
  {
    title: 'Platzi - Finanzas',
    description: 'Cursos de Fintech, producto digital y experiencia de usuario.',
    link: 'https://platzi.com/fintech/',
  },
  {
    title: 'Stripe Atlas',
    description: 'Recursos para construir productos financieros y APIs robustas.',
    link: 'https://stripe.com/atlas/guides',
  },
  {
    title: 'Fintech Futures',
    description: 'Tendencias, accountability y mejores prácticas en la industria.',
    link: 'https://www.fintechfutures.com/',
  },
  {
    title: 'React Hook Form',
    description: 'Documentación oficial para formularios eficientes en React.',
    link: 'https://react-hook-form.com/',
  },
  {
    title: 'Laravel Sanctum',
    description: 'Guía para manejar autenticación JWT / SPA basado en tokens.',
    link: 'https://laravel.com/docs/11.x/sanctum',
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <NavigationBar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm text-indigo-300 uppercase tracking-widest">Learning Hub</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Resources for Execution</h1>
          <p className="mt-3 text-gray-400">
            Curated links that reinforce a fintech mindset—delivery discipline, product craft, and continuous learning.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {resources.map((resource) => (
            <article
              key={resource.link}
              className="rounded-2xl border border-white/10 bg-gray-800/70 p-6 shadow-lg shadow-black/30"
            >
              <h2 className="text-xl font-semibold text-white">{resource.title}</h2>
              <p className="mt-2 text-sm text-gray-400">{resource.description}</p>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
              >
                Visit resource →
              </a>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
