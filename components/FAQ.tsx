import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { X } from "lucide-react";
import type { FaqItem } from '@/services/faq';

interface FAQProps {
  faq: FaqItem[];
}

// Fallback FAQ data in case API fails
const fallbackFAQList = [
  {
    id: 1,
    question: "¿Cómo me inscribo en el congreso?",
    answer: "Puedes inscribirte fácilmente a través de nuestra página de inscripción. Solo necesitas completar el formulario con tus datos personales y seleccionar las actividades de tu interés. La inscripción es gratuita y confirmarás tu lugar inmediatamente.",
    position: 1,
    published: true,
  },
  {
    id: 2,
    question: "¿Dónde se entregarán los diplomas?",
    answer: "Los diplomas se entregarán al finalizar cada actividad en el mismo lugar donde se realice. Para talleres y competencias, la entrega será inmediatamente después de la clausura. También podrás descargar tu certificado digital desde tu perfil de participante.",
    position: 2,
    published: true,
  },
  {
    id: 3,
    question: "¿Qué actividades estarán disponibles?",
    answer: "El congreso incluye talleres especializados, competencias de programación, conferencias magistrales y sesiones de networking. Todas las actividades están diseñadas para diferentes niveles de experiencia, desde principiantes hasta profesionales avanzados en tecnología.",
    position: 3,
    published: true,
  },
];

export const FAQ = ({ faq }: FAQProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Use fallback data if API fails or returns empty array
  const displayFaq = faq && faq.length > 0 ? faq : fallbackFAQList;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubmitted(true);
      // Aquí se puede agregar lógica para enviar el email
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section
      id="faq"
    >
      <div className="container mx-auto max-w-5xl px-4 md:px-6 py-16 bg-transparent">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
          Preguntas Frecuentes
        </h2>

        {/* Contenedor con fondo sutil para mejorar contraste */}
        <div className="mt-8 max-w-4xl mx-auto rounded-2xl bg-white/50 backdrop-blur-sm ring-1 ring-black/10 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] p-3 sm:p-5">
          <Accordion
            type="single"
            collapsible
            className="w-full AccordionRoot"
          >
            {displayFaq
              .filter(item => item.published)
              .sort((a, b) => a.position - b.position)
              .map((item) => (
              <AccordionItem
                key={item.id}
                value={`item-${item.id}`}
                className="mb-3 last:mb-0 border-0 rounded-xl overflow-hidden ring-1 ring-black/5 bg-white/60 hover:bg-white/70 transition-colors shadow-sm data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-left text-slate-900 px-4 py-3 sm:py-4 hover:no-underline">
                  {item.question}
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 text-slate-700/90 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {faq && faq.length === 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Mostrando preguntas frecuentes predeterminadas</p>
          </div>
        )}

        <h3 className="font-medium mt-4">
          Aun cuentas con dudas?{" "}
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button className="text-primary transition-all border-primary hover:border-b-2 cursor-pointer">
                Solicita mas informacion
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-300 bg-neutral-100 p-6 shadow-lg duration-200 sm:rounded-lg">
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <Dialog.Title className="text-lg font-semibold leading-none tracking-tight text-slate-900">
                    Solicita mas informacion del evento
                  </Dialog.Title>
                </div>
                <div className="mt-4">
                  {isSubmitted ? (
                    <div className="text-center py-4">
                      <p className="text-green-600 font-medium">
                        ¡Gracias! Te contactaremos pronto con más información.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        type="email"
                        placeholder="tu.email@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-neutral-300"
                      />
                      <Button type="submit" className="w-full">
                        Enviar
                      </Button>
                    </form>
                  )}
                </div>
                <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </h3>
      </div>
    </section>
  );
};