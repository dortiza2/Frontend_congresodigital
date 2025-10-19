import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, User, Calendar } from "lucide-react";
import type { PublicActivity } from '@/services/activities';
import type { PublicSpeaker } from '@/services/speakers';
import { adaptActivity, type RawActivityData } from '@/lib/adapters/activity';
import { getActivities as getActivitiesApi, getSpeakers as getSpeakersApi, type PublicSpeakerDTO } from '@/lib/api';
import { formatGTTime, formatGTShort } from "@/lib/datetime";

type EventStatus = 'not-started' | 'ongoing' | 'finished';

interface ActivityWithSpeaker extends PublicActivity {
  speaker?: PublicSpeaker;
  status: EventStatus;
}

// Función para calcular el estado del evento basado en la hora local del usuario
function getEventStatus(startISO: string, endISO: string): EventStatus {
  const now = new Date();
  const start = new Date(startISO);
  const end = new Date(endISO);
  
  if (now < start) return 'not-started';
  if (now >= start && now < end) return 'ongoing';
  return 'finished';
}

// Función para formatear la hora en formato local
function formatTime(isoString: string): string {
  return formatGTTime(isoString);
}

// Función para obtener años únicos de las actividades
function getUniqueYears(activities: PublicActivity[]): string[] {
  const years = [...new Set(activities.map(item => new Date(item.startTime).getFullYear().toString()))];
  return years.sort((a, b) => Number(b) - Number(a));
}

// Función para formatear fecha para mostrar
function formatDate(dateString: string): string {
  return formatGTShort(dateString);
}

// Componente para el título dinámico de la agenda
function AgendaHeader({ selectedYear }: { selectedYear?: string }) {
  const year = selectedYear ?? new Date().getFullYear();

  return (
    <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
      Agenda del congreso {year}
    </h2>
  );
}

export const Agenda = ({ initialActivities = [], initialSpeakers = [] }: { initialActivities?: PublicActivity[]; initialSpeakers?: PublicSpeaker[] }) => {
  const [agenda, setAgenda] = useState<ActivityWithSpeaker[]>([]);
  const [speakers, setSpeakers] = useState<PublicSpeaker[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
// Si recibimos datos iniciales desde SSR, usarlos y evitar fetch inicial

      if ((initialActivities && initialActivities.length > 0) || (initialSpeakers && initialSpeakers.length > 0)) {
        const activitiesData: PublicActivity[] = initialActivities;
        const speakersData: PublicSpeaker[] = initialSpeakers;
        setSpeakers(speakersData);
        const years = getUniqueYears(activitiesData);
        setAvailableYears(years);
        if (years.length > 0 && !selectedYear) {
          setSelectedYear(years[0]);
        }
        const processedActivities: ActivityWithSpeaker[] = activitiesData.map(item => {
          const speaker = item.speakerId
            ? speakersData.find(s => s.id === item.speakerId)
            : undefined;
          return {
            ...item,
            speaker,
            status: getEventStatus(item.startTime, item.endTime)
          };
        });
        setAgenda(processedActivities);
        return;
      }

// Cargar datos usando el API unificado

      const [activitiesResponse, speakersResponse] = await Promise.all([
        getActivitiesApi(),
        getSpeakersApi()
      ]);
      const activitiesData: PublicActivity[] = (activitiesResponse.status === 'ok' && Array.isArray(activitiesResponse.data))
        ? activitiesResponse.data.map((a: RawActivityData) => adaptActivity(a))
        : [];
      const speakersData: PublicSpeaker[] = (speakersResponse.status === 'ok' && Array.isArray(speakersResponse.data))
        ? speakersResponse.data.map((s: PublicSpeakerDTO) => ({
            id: String(s.id ?? ''),
            name: s.name ?? 'Ponente',
            bio: s.bio,
            company: s.company,
            roleTitle: s.roleTitle,
            avatarUrl: s.avatarUrl ?? '/avatars/default.svg'
          }))
        : [];
      
      setSpeakers(speakersData);
        
        // Obtener años únicos y establecer el primer año como seleccionado por defecto
        const years = getUniqueYears(activitiesData);
        setAvailableYears(years);
        if (years.length > 0 && !selectedYear) {
          setSelectedYear(years[0]);
        }
        
        // Procesar actividades con vínculo a speakers (si existe speakerId)
        const processedActivities: ActivityWithSpeaker[] = activitiesData.map(item => {
          const speaker = (item as any).speaker || (item.speakerId
            ? speakersData.find(s => s.id === item.speakerId)
            : undefined);
          return {
            ...item,
            speaker,
            status: getEventStatus(item.startTime, item.endTime)
          };
        });
        
        setAgenda(processedActivities);
      } catch (err) {
        console.error('Error loading agenda:', err);
        setError('Error al cargar la agenda');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear]);

  // Filtrar actividades por año seleccionado
  const filteredAgenda = selectedYear 
    ? agenda.filter(item => new Date(item.startTime).getFullYear().toString() === selectedYear)
    : agenda;

  // Función para obtener el color del badge según el estado
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'not-started':
        return <Badge variant="outline" className="text-muted-foreground">Sin iniciar</Badge>;
      case 'ongoing':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">En curso</Badge>;
      case 'finished':
        return <Badge variant="secondary">Finalizado</Badge>;
    }
  };

  // Función para obtener el icono según el tipo
  const getTypeIcon = (type: 'actividad' | 'charla') => {
    return type === 'charla' ? <User className="h-4 w-4" /> : <Calendar className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <section id="agenda" className="py-24 sm:py-32 space-y-8" aria-live="polite">
        <div className="text-center">
          <h2 className="text-3xl lg:text-4xl font-bold">Cargando agenda...</h2>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="agenda" className="py-24 sm:py-32 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-red-500">{error}</h2>
        </div>
      </section>
    );
  }

  return (
    <section id="agenda" className="py-24 sm:py-32 space-y-8">
      <div className="text-center space-y-4">
        <AgendaHeader selectedYear={selectedYear} />
        
        {/* Filtro por año */}
        {availableYears.length > 1 && (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedYear ? "default" : "outline"}
                  className={`w-[240px] rounded-xl transition-all ${selectedYear ? 'bg-sky-600 text-white hover:bg-sky-700 border-none shadow-md' : 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-700 shadow-sm'}`}
                >
                  {selectedYear ? selectedYear : "Selecciona año"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl shadow-lg border border-sky-200 bg-white">
                {availableYears.map(year => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="cursor-pointer rounded-md focus:bg-sky-100 data-[highlighted]:bg-sky-100"
                  >
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Timeline de eventos */}
      <div className="max-w-4xl mx-auto space-y-4">
        {filteredAgenda.length === 0 ? (
          <div className="text-center text-black" aria-live="polite">
            No hay actividades para el año seleccionado. Próximamente publicaremos la agenda.
          </div>
        ) : (
          filteredAgenda.map((item, index) => (
            <Card key={item.id} className="relative rounded-2xl border border-black/10 bg-white/40 backdrop-blur-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] text-slate-900/90">
              {/* Línea de timeline */}
              {index < filteredAgenda.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  {/* Indicador de timeline */}
                  <div className="flex-shrink-0 w-3 h-3 rounded-full bg-primary mt-2" />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-700/90 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getTypeIcon('actividad')}
                        <span className="capitalize">Actividad</span>
                      </div>
                      
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {/* Información del ponente si aplica */}
              {item.speaker && (
                <CardContent className="pt-0 pl-10">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="secondary" className="text-xs">Ponente</Badge>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={item.speaker.avatarUrl || '/avatars/default.svg'} 
                        alt={item.speaker.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/avatars/default.svg';
                        }}
                      />
                      <AvatarFallback>
                        {item.speaker.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        <span className="text-slate-700/90 mr-1">Ponente:</span>
                        {item.speaker.name}
                      </p>
                      <p className="text-sm text-slate-700/90">{item.speaker.roleTitle || item.speaker.company || ''}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
      
      {/* Nota sobre el cálculo de estado */}
      <div className="text-center text-xs text-black mt-8">
        * El estado de los eventos se calcula en tiempo real usando la hora local del usuario
      </div>
    </section>
  );
};