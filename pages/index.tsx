import { GetStaticProps } from 'next';
// Limpieza de imports no usados realizada
import { FAQ } from "../components/FAQ";
import { Agenda } from "../components/Agenda";
import { Footer } from "../components/Footer";
import { Congress } from "../components/Congress";
import { Speakers } from "../components/Speakers";
import Navbar from "../components/Navbar";
import { Newsletter } from "../components/Newsletter";
import { Winners } from "../components/Winners";
import { ScrollToTop } from "../components/ScrollToTop";
import { Activities } from "../components/Activities";
import { UMGSection } from "../components/UMGSection";
import { getFaq, FaqItem } from '@/services/faq';
// Se elimina ApiStandardResponse por no usarse
import { getActivities, getSpeakers, PublicActivityDTO, PublicSpeakerDTO } from '@/lib/api';
import { handleDataLoadError, createErrorBanner, createNoDataBanner, logSsrError } from '@/lib/errorHandler';
import { adaptActivity, type PublicActivity, type RawActivityData } from '@/lib/adapters/activity';
import type { PublicSpeaker as SpeakerType } from '@/services/speakers';

type Props = {
  activities: PublicActivityDTO[];
  faq: FaqItem[];
  speakers: PublicSpeakerDTO[];
  hasError: boolean;
  errorMessage?: string;
};

function App({ activities, faq, speakers, hasError, errorMessage }: Props) {
  const activitiesUi: PublicActivity[] = Array.isArray(activities)
    ? activities.map((a: RawActivityData) => adaptActivity(a))
    : [];

  const speakersUi: SpeakerType[] = Array.isArray(speakers)
    ? speakers.map((s: PublicSpeakerDTO) => ({
        id: String(s.id ?? ''),
        name: s.name ?? 'Ponente',
        bio: s.bio,
        company: s.company,
        roleTitle: s.roleTitle,
        avatarUrl: s.avatarUrl ?? '/avatars/default.svg',
      }))
    : [];

  return (
    <>
      <Navbar />
      <Congress />
      <div className="page-container">
        {hasError && errorMessage && createErrorBanner(new Error(errorMessage), 'home')}
        <Speakers speakers={speakersUi} />
        <Agenda />
        {activitiesUi && activitiesUi.length > 0 ? (
          <Activities activities={activitiesUi} />
        ) : (
          createNoDataBanner('No hay actividades disponibles en este momento.')
        )}
        <Winners />
        <Newsletter />
        <UMGSection />
        {faq && faq.length > 0 ? (
          <FAQ faq={faq} />
        ) : (
          createNoDataBanner('No hay preguntas frecuentes disponibles.')
        )}
      </div>
      <Footer />
      <ScrollToTop />
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Cargar cada recurso con tolerancia a errores usando funciones unificadas
  let activities: PublicActivityDTO[] = [];
  let faq: FaqItem[] = [];
  let speakers: PublicSpeakerDTO[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    const activitiesResponse = await getActivities();
    activities = activitiesResponse.status === 'ok' ? activitiesResponse.data : [];
    if (activitiesResponse.status !== 'ok') {
      hasError = true;
      errorMessage = 'Error al cargar actividades';
      logSsrError('/api/activities', activitiesResponse);
    }
  } catch (error) {
    logSsrError('/api/activities', error);
    const errorResult = handleDataLoadError<PublicActivityDTO>(error, 'actividades');
    activities = errorResult.data ?? [];
    hasError = true;
    errorMessage = errorResult.message;
  }

  try {
    faq = await getFaq();
  } catch (error) {
    logSsrError('/api/faq', error);
    faq = [];
  }

  try {
    const speakersResponse = await getSpeakers();
    speakers = speakersResponse.status === 'ok' ? speakersResponse.data : [];
    if (speakersResponse.status !== 'ok') {
      hasError = true;
      errorMessage = 'Error al cargar ponentes';
      logSsrError('/api/speakers', speakersResponse);
    }
  } catch (error) {
    logSsrError('/api/speakers', error);
    const errorResult = handleDataLoadError<PublicSpeakerDTO>(error, 'ponentes');
    speakers = errorResult.data ?? [];
    hasError = true;
    errorMessage = errorResult.message;
  }

  return {
    props: { activities, faq, speakers, hasError, errorMessage },
    revalidate: 60 // Revalidate every minuto
  };
};

export default App;
