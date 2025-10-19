import { GetStaticProps } from 'next';
import React, { useEffect, useState } from 'react';
import { Trophy } from "lucide-react";
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer';
import { createErrorBanner, createNoDataBanner, logSsrError } from '../lib/errorHandler';
import { PodiumItemDTO } from '@/lib/api';
import { getMockPodiumDTOByYear } from '@/data/podiumMock';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { useRouter } from 'next/router';

type Props = {
  year: number;
  items: PodiumItemDTO[];
  hasError: boolean;
  errorMessage?: string;
};

export default function PodioPage({ year, items, hasError, errorMessage }: Props) {
  const [selectedYear, setSelectedYear] = useState<number>(year);
  const [podioItems, setPodioItems] = useState<PodiumItemDTO[]>(items || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientError, setClientError] = useState<string | undefined>(undefined);
  // Datos mock integrados para SSR y CSR

  // Opciones de año (últimos 3 años)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const router = useRouter();
  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    // Cargar datos cuando cambia el año seleccionado (CSR)
    const fetchPodio = () => {
      setLoading(true);
      setClientError(undefined);
      try {
        const data = getMockPodiumDTOByYear(selectedYear);
        setPodioItems(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setPodioItems([]);
        setClientError('Error al cargar datos del podio (mock)');
      } finally {
        setLoading(false);
      }
    };

    // Evitar petición innecesaria si el SSR ya trajo el mismo año
    if (selectedYear !== year) {
      fetchPodio();
    } else {
      // Asegurar que items SSR estén sincronizados cuando se monta
      setPodioItems(items || []);
    }
  }, [selectedYear, year, items]);

  const renderContent = () => {
    if (loading) {
      return createNoDataBanner('Cargando datos del podio...');
    }

    // Error de red: banner sutil y no invasivo
    if (clientError) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 px-4 py-3 mb-4" role="alert">
          {clientError}
        </div>
      );
    }

    if (podioItems && podioItems.length > 0) {
      return (
        <div className="grid gap-4">
          {podioItems
            .sort((a, b) => a.place - b.place)
            .map((item) => (
              <div key={`${item.activityId}-${item.place}`} className="rounded-2xl border border-black/10 bg-white/40 backdrop-blur-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-5 text-slate-900/90">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-6 w-6" />
                  <span className="text-lg font-semibold">Posición {item.place}</span>
                </div>
                <p className="text-xl font-bold mb-2">Actividad: {item.activityTitle}</p>
                <p className="text-lg font-semibold mb-2">Ganador: {item.winnerName}</p>
                <div className="text-sm text-slate-700/90 mt-2">
                  {item.year && (
                    <p>Año: {item.year}</p>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      );
    }

    // SIN datos
    // Año vigente: no mostrar tarjeta de vacío. Mantener layout limpio.
    if (selectedYear === currentYear) {
      return null;
    }

    // Históricos sin datos: usar EmptyState elegante
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <EmptyState
          icon="award"
          title="Sin registros históricos"
          message="Aún no hay resultados de ediciones anteriores (mock)."
          actionLabel="Volver a inicio"
          onAction={() => router.push('/')}
          className="bg-sky-50/80 text-sky-700 border border-sky-200"
        />
      </div>
    );
  };

  return (
    <div className="relative bg-congreso">
      <div className="overlay-soft pointer-events-none" />
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold text-heading">Podio {selectedYear}</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="podium-year" className="text-sm text-slate-700">Año</label>
            <select
              id="podium-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-black/10 rounded-md px-2 py-1 text-sm bg-white/70 backdrop-blur-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Solo mostrar error SSR si hubo una excepción real durante la carga inicial */}
        {hasError && errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 px-4 py-3 mb-4" role="alert">
            {errorMessage}
          </div>
        )}

        {renderContent()}
      </section>
      <Footer />
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const year = Number(process.env.NEXT_PUBLIC_PODIUM_YEAR || new Date().getFullYear());

  let items: PodiumItemDTO[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    const data = getMockPodiumDTOByYear(year);
    items = Array.isArray(data) ? data : [];
    hasError = false;
    errorMessage = '';
  } catch (error) {
    logSsrError('/data/podiumMock', error);
    hasError = true;
    errorMessage = 'Error al cargar datos del podio (mock)';
    items = [];
  }

  return {
    props: { year, items, hasError, errorMessage },
    revalidate: 60
  };
};