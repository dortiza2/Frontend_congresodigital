import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CONGRESS_HERO } from "@/lib/paths";

export const Congress = () => {
  return (
    <section
      id="congreso"
      className="py-24 sm:py-32"
    >
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Large Image */}
        <div className="relative w-full max-w-4xl mx-auto">
          <Image
            src={CONGRESS_HERO}
            alt="Congreso Digital - El evento tecnológico más importante del año"
            width={800}
            height={400}
            className="rounded-lg shadow-lg w-full h-auto"
            priority
          />
        </div>

        {/* Title and Description */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="text-slate-900 font-bold">
              Congreso Digital
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            El evento tecnológico más importante del año que reúne a los mejores expertos, 
            innovadores y emprendedores del ecosistema digital. Descubre las últimas tendencias, 
            conecta con líderes de la industria y forma parte del futuro de la tecnología.
          </p>
          
          <p className="text-lg text-muted-foreground">
            Únete a más de 1,000 profesionales en una experiencia única de aprendizaje, 
            networking y oportunidades de crecimiento profesional.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/inscripcion">
            <Button size="lg" className="text-lg px-8 py-3">
              Inscríbete Ahora
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => {
              document.getElementById('agenda')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
          >
            Ver Agenda
          </Button>
        </div>
      </div>
    </section>
  );
};