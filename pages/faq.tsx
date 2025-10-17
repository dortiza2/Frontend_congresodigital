import { GetStaticProps } from 'next';
import Navbar from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FAQ } from '@/components/FAQ';
import { getFaq, FaqItem } from '@/services/faq';
import { createErrorBanner, createNoDataBanner, logSsrError } from '@/lib/errorHandler';

type Props = {
  faq: FaqItem[];
  hasError: boolean;
  errorMessage?: string;
};

export default function FaqPage({ faq, hasError, errorMessage }: Props) {
  return (
    <>
      <Navbar />
      <main className="page-container">
        {hasError && errorMessage && createErrorBanner(new Error(errorMessage), 'faq')}
        {faq && faq.length > 0 ? (
          <FAQ faq={faq} />
        ) : (
          createNoDataBanner('No hay preguntas frecuentes disponibles por el momento.')
        )}
      </main>
      <Footer />
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  let faq: FaqItem[] = [];
  let hasError = false;
  let errorMessage = '';

  try {
    faq = await getFaq();
  } catch (error) {
    logSsrError('/api/faq', error);
    faq = [];
    hasError = true;
    errorMessage = 'Error al cargar FAQ';
  }

  return {
    props: { faq, hasError, errorMessage },
    revalidate: 60,
  };
};