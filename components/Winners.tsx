import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ChevronDown, ChevronUp, Trophy, Medal, Award, Star, Sparkles } from "lucide-react";
import { getMockPodiumByYear, mockActivities } from '@/data/podiumMock';
import type { Winner, ActivityCard } from '@/types/content';
import Link from 'next/link';

interface WinnersByActivity {
  activity: ActivityCard;
  winners: Winner[];
}

export const Winners = () => {
  const [winnersByActivity, setWinnersByActivity] = useState<WinnersByActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [hasCurrentEdition, setHasCurrentEdition] = useState<boolean>(true);

  useEffect(() => {
    const fetchWinners = () => {
      try {
        const winners = getMockPodiumByYear(currentYear);
        const activities = mockActivities;

        // Agrupar ganadores por actividad
        const grouped = activities
          .map(activity => {
            const activityTitleNorm = (activity.title || '').trim().toLowerCase();
            const activityWinners = winners
              .filter(winner => {
                const matchById = !!winner.activityId && winner.activityId === activity.id;
                const matchByTitle = !!winner.activityTitle && winner.activityTitle.trim().toLowerCase() === activityTitleNorm;
                return matchById || matchByTitle;
              })
              .sort((a, b) => a.place - b.place); // Ordenar por lugar (1°, 2°, 3°)
            
            return activityWinners.length > 0 ? {
              activity: {
                id: activity.id,
                title: activity.title,
                imageUrl: activity.imageUrl || '/images/default-activity.jpg',
                short: activity.short ?? 'competencia',
                description: activity.description ?? 'Actividad de tipo competencia',
                link: activity.link ?? '#'
              },
              winners: activityWinners.map(winner => ({
                id: `${winner.activityId || activity.id || activity.title}-${winner.place}`,
                year: winner.year,
                activityId: winner.activityId,
                place: winner.place as 1 | 2 | 3,
                projectName: winner.winnerName || winner.prizeDescription || 'Proyecto sin nombre',
                projectShort: winner.prizeDescription || 'Sin descripción',
                photoUrl: winner.teamImage || '/images/default-winner.jpg',
              }))
            } : null;
          })
          .filter(Boolean) as WinnersByActivity[];

        setWinnersByActivity(grouped);
        setHasCurrentEdition(grouped.length > 0);
      } catch (error) {
        console.error('Error building winners from mock:', error);
        setWinnersByActivity([]);
        setHasCurrentEdition(false);
      } finally {
        setLoading(false);
      }
    };

    fetchWinners();
  }, [currentYear]);

  const toggleTeam = (winnerId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(winnerId)) {
      newExpanded.delete(winnerId);
    } else {
      newExpanded.add(winnerId);
    }
    setExpandedTeams(newExpanded);
  };

  const getPlaceIcon = (place: number) => {
    switch (place) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getPlaceText = (place: number) => {
    switch (place) {
      case 1:
        return '1er Lugar';
      case 2:
        return '2do Lugar';
      case 3:
        return '3er Lugar';
      default:
        return `${place}° Lugar`;
    }
  };

  if (loading) {
    return (
      <section id="ganadores" className="py-24 sm:py-32" aria-live="polite">
        <div className="text-center">Cargando ganadores...</div>
      </section>
    );
  }

  return (
    <section
      id="ganadores"
      className="py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-center">
        Ganadores Congreso {currentYear}
      </h2>
      <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
        Conoce a los ganadores de las principales actividades del congreso
      </h3>

      {/* Render condicional: lista de ganadores o tarjeta "Podio no disponible" */}
      {winnersByActivity.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {winnersByActivity.map(({ activity, winners }) => (
            <Card key={activity.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{activity.title}</span>
                  <Badge variant="secondary">{activity.short}</Badge>
                </CardTitle>
                {activity.description && (
                  <CardDescription>{activity.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {winners.map((w) => (
                  <div key={`${w.activityId}-${w.place}`} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="flex items-center gap-2 w-36">
                      {getPlaceIcon(w.place)}
                      <span className="font-semibold">{getPlaceText(w.place)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900 font-medium">{w.projectName}</p>
                      {w.projectShort && (
                        <p className="text-slate-600 text-sm">{w.projectShort}</p>
                      )}
                    </div>
                    <Image
                      src={w.photoUrl || '/images/default-winner.jpg'}
                      alt={w.projectName || 'Ganador'}
                      width={56}
                      height={56}
                      className="rounded-md object-cover"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-2xl mx-auto">
            {/* Decoración con estrellas animadas */}
            <div className="relative mb-8">
              <div className="absolute -top-4 -left-4 animate-pulse">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="absolute -top-2 -right-6 animate-bounce">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div className="absolute -bottom-2 left-8 animate-pulse delay-300">
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              </div>
              <div className="absolute -bottom-4 -right-2 animate-bounce delay-500">
                <Star className="w-5 h-5 text-orange-300 fill-orange-300" />
              </div>
              {/* Imagen del trofeo con gradiente */}
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-orange-200 to-yellow-300 rounded-full blur-xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 shadow-2xl">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                </div>
              </div>
            </div>

            {/* Card principal con gradiente y sombras */}
            <Card className="relative overflow-hidden border-2 border-gradient-to-r from-yellow-200 to-orange-200 shadow-2xl">
              {/* Fondo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 opacity-50"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500"></div>
              
              <CardHeader className="relative text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <div className="relative">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-4 h-4 text-orange-400 animate-spin" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold">
                    Podio no disponible
                  </span>
                </CardTitle>
                <CardDescription className="text-lg text-gray-700 mt-2">
                  No hay ganadores publicados para la edición {currentYear}.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative space-y-6">
                {/* Mensaje principal con iconos */}
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <Medal className="w-6 h-6 text-gray-500" />
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-yellow-800 font-medium text-center">
                    Los resultados se publicarán aquí cuando estén disponibles.
                  </p>
                </div>

                {/* Información adicional */}
                <div className="text-center space-y-3">
                  <p className="text-gray-600">
                    Mientras tanto, puedes revisar los ganadores de ediciones anteriores.
                  </p>
                  {/* Decoración con números de lugares */}
                  <div className="flex justify-center items-center gap-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        1
                      </div>
                      <span className="text-xs text-gray-500 mt-1">Primer lugar</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        2
                      </div>
                      <span className="text-xs text-gray-500 mt-1">Segundo lugar</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        3
                      </div>
                      <span className="text-xs text-gray-500 mt-1">Tercer lugar</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Botón para ver histórico */}
      <div className="text-center mt-12">
        <Link href="/podio">
          <Button variant="outline" size="lg" className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 hover:from-yellow-100 hover:to-orange-100 transition-all duration-300">
            <Trophy className="w-4 h-4 mr-2" />
            Histórico de ganadores
          </Button>
        </Link>
      </div>
    </section>
  );
};

// TODO: Futuro CMS/DB - Esta sección será editable desde el dashboard
// TODO: Implementar paginación si hay muchos ganadores por actividad
// TODO: Agregar filtros por tipo de actividad
// TODO: Integrar con sistema de validación de imágenes comprimidas