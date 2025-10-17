import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getCertificates } from '@/lib/api';

interface CertificateItem {
  id: string;
  userId: string;
  hash: string;
  createdAt: string;
}

interface CertificatesPageProps {
  certificates: CertificateItem[];
  error?: boolean;
}

export default function CertificatesPage({ certificates, error }: CertificatesPageProps) {
  return (
    <>
      <Head>
        <title>Certificados | Congreso Digital</title>
        <meta name="description" content="Validación y consulta de certificados" />
      </Head>
      <main className="min-h-screen max-w-5xl mx-auto px-4 py-10">
        {error && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-6">
            Error al conectar con el servidor. Puedes intentar más tarde.
          </div>
        )}

        <h1 className="text-3xl font-bold mb-4">Certificados</h1>
        <p className="text-muted-foreground mb-6">Valida certificados por usuario o por hash.</p>

        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="text-muted-foreground">Sin datos disponibles</div>
          ) : (
            certificates.map((c) => (
              <div key={c.id} className="border rounded p-4">
                <div className="font-semibold">Hash: {c.hash}</div>
                <div className="text-sm">Usuario: {c.userId}</div>
                <div className="text-sm">Creado: {new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<CertificatesPageProps> = async (context) => {
  try {
    const userId = (context.query.userId as string) || undefined;
    const res = await getCertificates(userId);
    const certificates = Array.isArray(res.data)
      ? res.data.map((c: any) => ({
          id: String(c.id ?? ''),
          userId: String(c.userId ?? ''),
          hash: String(c.hash ?? ''),
          createdAt: String(c.createdAt ?? new Date().toISOString()),
        }))
      : [];
    const error = res.status !== 'ok';

    return {
      props: {
        certificates,
        error,
      },
    };
  } catch (err) {
    console.error('[SSR certificados] Error:', err);
    return {
      props: {
        certificates: [],
        error: true,
      },
    };
  }
};