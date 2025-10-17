import { GetStaticProps } from 'next';
import Head from 'next/head';
import { Agenda } from '@/components/Agenda';
import { getActivities, getSpeakers } from '@/lib/api';
import type { PublicActivity } from '@/lib/adapters/activity';
import type { PublicSpeakerDTO } from '@/lib/api';
import type { PublicSpeaker } from '@/services/speakers';
import { adaptActivity, type RawActivityData } from '@/lib/adapters/activity';

interface AgendaPageProps {
  activities: PublicActivity[];
  speakers: PublicSpeaker[];
  error?: boolean;
}

export default function AgendaPage({ activities, speakers, error }: AgendaPageProps) {
  return (
    <>
      <Head>
        <title>Agenda | Congreso Digital</title>
        <meta name="description" content="Agenda de actividades del Congreso Digital" />
      </Head>
      <main className="min-h-screen">
        {error && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-6">
            Error al cargar datos. Mostrando información limitada.
          </div>
        )}
        <Agenda initialActivities={activities} initialSpeakers={speakers} />
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<AgendaPageProps> = async () => {
  try {
    const [activitiesRes, speakersRes] = await Promise.all([
      getActivities(),
      getSpeakers(),
    ]);

    const activities: PublicActivity[] = Array.isArray(activitiesRes.data)
      ? (activitiesRes.data as RawActivityData[]).map(adaptActivity)
      : [];

    const speakers: PublicSpeaker[] = Array.isArray(speakersRes.data)
      ? (speakersRes.data as PublicSpeakerDTO[]).map(s => ({
          id: String(s.id ?? ''),
          name: s.name ?? 'Ponente',
          bio: s.bio,
          company: s.company,
          roleTitle: s.roleTitle,
          avatarUrl: s.avatarUrl || '/avatars/default.svg',
        }))
      : [];

    const error = activitiesRes.status !== 'ok' || speakersRes.status !== 'ok';

    return {
      props: {
        activities,
        speakers,
        error,
      },
      revalidate: 60,
    };
  } catch (err) {
    console.error('[SSR agenda] Error:', err);
    return {
      props: {
        activities: [],
        speakers: [],
        error: true,
      },
      revalidate: 60,
    };
  }
};