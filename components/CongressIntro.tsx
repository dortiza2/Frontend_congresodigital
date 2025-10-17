import { Button } from "./ui/button";
import { buttonVariants } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { getCongressInfo, getSpeakers } from "@/lib/content";
import { CongressInfo, Speaker } from "@/types/content";
import { useEffect, useState } from "react";
import Link from "next/link";

// TODO: Fuente de datos desde `lib/content`
// TODO: Límite de caracteres `summaryMax` configurable
// NOTA: El tamaño/posición del banner no se modifican, solo la imagen y el texto

export const CongressIntro = () => {
  const [congressInfo, setCongressInfo] = useState<CongressInfo | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [congress, speakersData] = await Promise.all([
          getCongressInfo(),
          getSpeakers()
        ]);
        setCongressInfo(congress);
        // Priorizar por priority y tomar solo 3-6 ponentes
        const prioritizedSpeakers = speakersData
          .sort((a, b) => (a.priority || 999) - (b.priority || 999))
          .slice(0, 6);
        setSpeakers(prioritizedSpeakers);
      } catch (error) {
        console.error('Error loading congress data:', error);
        setHasError(true);
        // Fallback data para evitar pantalla roja
        setCongressInfo({
          title: "Congreso Digital 2024",
          summary: "Cargando información del evento...",
          mainImageUrl: "/assets/placeholder-congress.jpg",
          lastUpdated: new Date().toISOString()
        });
      }
    };
    loadData();
  }, []);

  if (!congressInfo) {
    return (
      <section id="congreso" className="grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
        <div className="text-center lg:text-start space-y-6">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="z-10">
          <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
        </div>
      </section>
    );
  }

  // TODO: Aplicar límite de caracteres configurable en el stub
  const summaryMax = 200; // Configurable
  const truncatedSummary = congressInfo.summary.length > summaryMax 
    ? congressInfo.summary.substring(0, summaryMax) + '...' 
    : congressInfo.summary;

  return (
    <section id="congreso" className="grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      {/* Información general del congreso - mantiene área y layout general */}
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="text-slate-900 font-bold">
              {congressInfo.title}
            </span>
          </h1>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          {truncatedSummary}
        </p>

        {/* Imagen principal - solo cambia la fuente, no tamaño ni posición */}
        {congressInfo.mainImageUrl && (
          <div className="flex justify-center lg:justify-start">
            <img 
              src={congressInfo.mainImageUrl} 
              alt={congressInfo.title}
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Link href="/inscripcion">
            <Button className="w-full md:w-1/3">Inscríbete Ahora</Button>
          </Link>

          <a
            href="#agenda"
            className={`w-full md:w-1/3 ${buttonVariants({
              variant: "outline",
            })}`}
          >
            Ver Agenda
          </a>
        </div>
      </div>

      {/* Sección Ponentes - en el mismo viewport */}
      <div className="z-10 w-full">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center lg:text-left mb-6">
            Ponentes Invitados
          </h2>
          
          {/* Grid responsivo: desktop ~1/3, mobile apila */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {speakers.slice(0, 6).map((speaker) => (
              <Card key={speaker.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={speaker.photoUrl || '/avatars/default.svg'}
                      alt={speaker.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/avatars/default.svg';
                      }}
                    />
                    <AvatarFallback>
                      {speaker.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      {speaker.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {speaker.topic}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {speaker.bioShort}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {speakers.length > 6 && (
            <div className="text-center mt-4">
              <a 
                href="#ponentes" 
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Ver todos los ponentes
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Shadow effect */}
      <div className="shadow"></div>
    </section>
  );
};