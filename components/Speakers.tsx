import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";
import { SPEAKER_PROFILE_1 } from "@/lib/paths";
import { PublicSpeaker as SpeakerType } from "@/services/speakers";

interface SpeakerProps {
  speakers: SpeakerType[];
}

interface ProcessedSpeaker {
  id: string;
  name: string;
  headline: string;
  bio: string;
  photoUrl: string;
  social: {
    linkedin?: string;
    website?: string;
    instagram?: string;
  };
}

export const Speakers = ({ speakers }: SpeakerProps) => {
  // Process speakers data from API
  const speakersList: ProcessedSpeaker[] = speakers.map(speaker => {
    let socialLinks: { linkedin?: string; website?: string; instagram?: string } = {};
    // Links puede venir como objeto o string JSON
    if (speaker.links && typeof speaker.links === 'object') {
      socialLinks = { ...socialLinks, ...(speaker.links as Record<string, any>) };
    } else if (speaker.links && typeof speaker.links === 'string') {
      try {
        const parsed = JSON.parse(speaker.links);
        socialLinks = { ...socialLinks, ...parsed };
      } catch (e) {
        console.warn('Failed to parse speaker links:', speaker.links);
      }
    }

    return {
      id: speaker.id,
      name: speaker.name,
      headline: speaker.roleTitle || 'Speaker',
      bio: speaker.bio || 'Información próximamente.',
      photoUrl: speaker.avatarUrl && speaker.avatarUrl.trim() !== '' ? speaker.avatarUrl : '/avatars/default.svg',
      social: socialLinks
    };
  });
  const socialIcon = (iconName: string) => {
    switch (iconName) {
      case "linkedin":
        return <Linkedin size="20" />;

      case "website":
        return <Globe size="20" />;

      case "instagram":
        return <Instagram size="20" />;
    }
  };

  return (
    <section
      id="expositores"
      className="py-24 sm:py-32"
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          <span className="text-slate-900 font-bold">
            Expositores Invitados
          </span>
        </h2>

        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          Conoce a los expertos líderes de la industria que compartirán sus conocimientos 
          y experiencias en las últimas tendencias tecnológicas.
        </p>
      </div>

      {speakersList.length === 0 && (
        <div className="text-center text-muted-foreground mb-8" aria-live="polite">
          Estamos preparando la lista de expositores invitados. Vuelve más tarde.
        </div>
      )}

      <div className={`grid gap-8 gap-y-12 ${
        speakersList.length < 6 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center max-w-4xl mx-auto'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {speakersList.map((speaker: ProcessedSpeaker) => {
          const socialLinks = Object.entries(speaker.social)
            .filter(([_, url]) => url && typeof url === 'string' && url.trim() !== '')
            .map(([platform, url]) => ({ platform, url: url as string }));

          return (
            <Card
              key={speaker.id}
              className="bg-neutral-100 relative mt-8 flex flex-col justify-center items-center h-full border-0 shadow-lg"
            >
              <CardHeader className="mt-8 flex justify-center items-center pb-2">
                <div className="absolute -top-12 rounded-full w-24 h-24 aspect-square overflow-hidden border-4 border-neutral-200 shadow-lg">
                  <Image
                    src={speaker.photoUrl}
                    alt={`${speaker.name} - ${speaker.headline}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/avatars/default.svg';
                  }}
                />
                </div>
                <CardTitle className="text-center mt-4 text-lg">{speaker.name}</CardTitle>
                <CardDescription className="text-primary text-center font-medium">
                  {speaker.headline}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-4 flex-grow px-6">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {speaker.bio.length > 220 ? `${speaker.bio.substring(0, 220)}...` : speaker.bio}
                </p>
              </CardContent>

              {socialLinks.length > 0 && (
                <CardFooter className="pt-0">
                  <div className="flex gap-2">
                    {socialLinks.map(({ platform, url }) => (
                      <a
                        key={platform}
                        rel="noreferrer noopener"
                        href={url}
                        target="_blank"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        <span className="sr-only">{platform} icon</span>
                        {socialIcon(platform)}
                      </a>
                    ))}
                  </div>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
};