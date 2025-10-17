import { GetStaticProps } from 'next';
import { Trophy } from "lucide-react";
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { createErrorBanner, createNoDataBanner, logSsrError } from '../lib/errorHandler';
import { getPodium, PodiumItemDTO } from '@/lib/api';

type Props = {
  year: number;
  items: PodiumItemDTO[];
  hasError: boolean;
  errorMessage?: string;
};

export default function PodioPage({ year, items, hasError, errorMessage }: Props) {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Podio {year}</h1>
        </div>

        {hasError && errorMessage && createErrorBanner(new Error(errorMessage), 'podio')}

        {items && items.length > 0 ? (
          <div className="grid gap-4">
            {items
              .sort((a, b) => a.place - b.place)
              .map((item) => (
                <div key={`${item.activityId}-${item.place}`} className="rounded-xl border border-neutral-300 bg-neutral-100 p-5 text-slate-900">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="h-6 w-6" />
                    <span className="text-lg font-semibold">Posición {item.place}</span>
                  </div>
                  <p className="text-xl font-bold mb-2">Actividad: {item.activityTitle}</p>
                  <p className="text-lg font-semibold mb-2">Ganador: {item.winnerName}</p>
                  <div className="text-sm text-slate-600 mt-2">
                    {/* Campos opcionales según DTO actualizado */}
                    {item.year && (
                      <p>Año: {item.year}</p>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          createNoDataBanner('No hay datos del podio disponibles en este momento.')
        )}
      </section>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const year = Number(process.env.NEXT_PUBLIC_PODIUM_YEAR || new Date().getFullYear());

  let items: PodiumItemDTO[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    const res = await getPodium(year);
    items = res.status === 'ok' ? res.data : [];
    if (res.status !== 'ok') {
      hasError = true;
      errorMessage = 'Error al cargar el podio';
      logSsrError('/api/podium', res);
    }
  } catch (error) {
    logSsrError('/api/podium', error);
    hasError = true;
    errorMessage = 'Error al conectar con el servidor de podio';
    items = [];
  }

  return {
    props: { year, items, hasError, errorMessage },
    revalidate: 60
  };
};