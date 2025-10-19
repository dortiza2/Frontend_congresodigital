import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicActivity } from '@/services/activities';
import Link from 'next/link';
import Image from 'next/image';

interface ActivitiesProps {
  activities: PublicActivity[];
}

export const Activities = ({ activities }: ActivitiesProps) => {
  // Verificación para prevenir errores de hidratación
  if (!activities || !Array.isArray(activities)) {
    return null;
  }

  return (
    <section
      id="actividades"
      className="my-16 min-h-[80vh] flex flex-col justify-center"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
          Actividades y talleres
        </h2>

        <p className="text-black text-center max-w-3xl mx-auto mt-4">
          Participa en nuestros talleres especializados y actividades interactivas diseñadas para potenciar tu aprendizaje
        </p>

        {/* Grid responsive con centrado mejorado para pocas tarjetas */}
        <div className="mt-10 flex flex-wrap justify-center gap-8 mx-auto max-w-6xl">
          {activities.map((activity: PublicActivity) => (
            <Card key={activity.id} className="flex h-full flex-col bg-white/40 backdrop-blur-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] hover:shadow-lg transition-shadow border border-black/10 w-full max-w-sm sm:w-80 text-slate-900/90">
            <CardHeader className="p-0">
              {/* Imagen de la actividad */}
              <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-indigo-200">
                <Image
                  src={'/assets/activities/frontend-generic.svg'}
                  alt={`Ilustración de la actividad ${activity.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={false}
                />
              </div>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col">
              <CardTitle className="text-xl mb-3 line-clamp-2 min-h-[3.5rem] flex items-center">
                {activity.title}
              </CardTitle>
              
              <CardDescription className="text-base leading-relaxed mb-4 flex-1 line-clamp-4 min-h-[6rem] text-gray-600">
                {activity.kind} - {activity.location}
                <br />
                <span className="text-sm text-gray-500">
                  Capacidad: {activity.capacity} | Inscritos: {activity.enrolled}
                </span>
              </CardDescription>
              
              <div className="mt-auto">
                <Link 
                  href={`/inscripcion?actividad=${activity.id}`}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  Participar
                </Link>
              </div>
            </CardContent>
            </Card>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center text-black">
            No hay actividades disponibles en este momento.
          </div>
        )}
      </div>
    </section>
  );
};

// TODO: Futuro CMS/DB - Esta sección será editable desde el dashboard
// TODO: Implementar paginación si hay muchas actividades
// TODO: Agregar filtros por categoría/tipo de actividad
// TODO: Integrar con sistema de inscripciones