import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export const Congress = () => {
  const [heroError, setHeroError] = useState(false);
  const sources = [
    "/images/hero/Imagen1_bienvenida.png",
    "/images/Imagen1_bienvenida.png",
    "/Imagen2_bienvenida.png",
  ];
  const [srcIndex, setSrcIndex] = useState(0);
  const heroSrc = sources[srcIndex];

  // Blur placeholder (ultra liviano ~300 bytes) para mejorar LCP sin peso adicional
  const blurDataURL =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9' viewBox='0 0 16 9' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%237dd3fc' offset='0'/%3E%3Cstop stop-color='%2334d399' offset='1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='16' height='9' fill='url(%23g)'/%3E%3C/svg%3E";

  const handleHeroError = () => {
    setSrcIndex((i) => {
      if (i < sources.length - 1) {
        return i + 1;
      } else {
        setHeroError(true);
        return i;
      }
    });
  };

  return (
    <section
      id="congreso"
      className="pt-16 md:pt-20 pb-24"
    >
      <div className="flex flex-col items-center text-center space-y-8">
        {/* Large Image */}
        <div className="relative w-full max-w-5xl mx-auto mt-4 md:mt-6 px-4">
          {!heroError ? (
            <Image
              src={heroSrc}
              alt="Congreso Digital — Innovación y tecnología"
              width={1200}
              height={600}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              quality={80}
              placeholder="blur"
              blurDataURL={blurDataURL}
              className="rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/5 w-full h-auto object-cover"
              priority
              onError={handleHeroError}
            />
          ) : (
            <div className="rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/5 w-full h-[280px] md:h-[380px] bg-gradient-to-br from-sky-400/40 to-emerald-400/40 flex items-center justify-center">
              <span className="text-sm text-slate-700/80">Imagen pendiente de reposición</span>
            </div>
          )}
          {/* Imagen buscada: coloca tu archivo en /public/images/hero/Imagen1_bienvenida.png o /public/images/Imagen1_bienvenida.png (también se intentará Imagen2_bienvenida.png en la raíz). */}
        </div>

        {/* Title and Description */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="text-heading font-bold">
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
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
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