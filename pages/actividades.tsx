import { GetStaticProps } from 'next';
import Head from 'next/head';
import { Activities } from '@/components/Activities';
import { getActivities } from '@/lib/api';
import { adaptActivity, type PublicActivity, type RawActivityData } from '@/lib/adapters/activity';

interface ActivitiesPageProps {
  activities: PublicActivity[];
  error?: boolean;
}

export default function ActivitiesPage({ activities, error }: ActivitiesPageProps) {
  return (
    <>
      <Head>
        <title>Actividades | Congreso Digital</title>
        <meta name="description" content="Actividades y talleres del Congreso Digital" />
      </Head>
      <main className="min-h-screen">
        {error && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-6">
            Error al cargar datos. Mostrando información limitada.
          </div>
        )}
        <Activities activities={activities} />
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<ActivitiesPageProps> = async () => {
  try {
    const activitiesRes = await getActivities();
    const activities: PublicActivity[] = Array.isArray(activitiesRes.data)
      ? activitiesRes.data.map((a: RawActivityData) => adaptActivity(a))
      : [];
    const error = activitiesRes.status !== 'ok';
    return {
      props: {
        activities,
        error,
      },
      revalidate: 60,
    };
  } catch (err) {
    console.error('[SSR actividades] Error:', err);
    return {
      props: {
        activities: [],
        error: true,
      },
      revalidate: 60,
    };
  }
};