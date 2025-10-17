import { GetStaticProps } from 'next';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Speakers } from '@/components/Speakers';
import { getSpeakers, ApiStandardResponse, PublicSpeakerDTO } from '@/lib/api';
import { createErrorBanner, createNoDataBanner, handleDataLoadError, logSsrError } from '@/lib/errorHandler';

type Props = {
  speakers: PublicSpeakerDTO[];
  hasError: boolean;
  errorMessage?: string;
};

export default function ExpositoresPage({ speakers, hasError, errorMessage }: Props) { // Expositores page implemented with ISR
  return (
    <>
      <Navbar />
      <main className="page-container">
        {hasError && errorMessage && createErrorBanner(new Error(errorMessage), 'expositores')}
        {speakers && speakers.length > 0 ? (
          <Speakers speakers={speakers as any} />
        ) : (
          createNoDataBanner('No hay expositores disponibles por el momento.')
        )}
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  let speakers: PublicSpeakerDTO[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    const speakersResponse: ApiStandardResponse<PublicSpeakerDTO[]> = await getSpeakers();
    speakers = speakersResponse.status === 'ok' ? speakersResponse.data : [];
    if (speakersResponse.status !== 'ok') {
      hasError = true;
      errorMessage = 'Error al cargar expositores';
      logSsrError('/api/speakers', speakersResponse);
    }
  } catch (error) {
    logSsrError('/api/speakers', error);
    const handled = handleDataLoadError(error, 'expositores');
    speakers = (handled.data as any[]) || [];
    hasError = true;
    errorMessage = handled.message;
  }

  return {
    props: { speakers, hasError, errorMessage },
    revalidate: 60,
  };
};