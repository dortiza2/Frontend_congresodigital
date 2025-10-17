import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { useState } from "react";
import { GraduationCap, Users, Trophy, BookOpen, ExternalLink } from "lucide-react";
import { saveContactEmail } from "../lib/tempStorage";
import Image from "next/image";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const success = await saveContactEmail(email, 'career_info');
    
    if (success) {
      setIsSubmitted(true);
      setEmail("");
      
      // Reset mensaje después de 3 segundos
      setTimeout(() => setIsSubmitted(false), 3000);
    } else {
      alert('Error al guardar la información. Por favor, intenta nuevamente.');
    }
  };

  return (
    <section id="carrera">
      <hr className="w-11/12 mx-auto" />

      <div className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenido de texto */}
            <div className="space-y-6">
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight max-w-3xl whitespace-normal">
                Ingeniería en Sistemas
              </h3>
              <p className="text-xl text-muted-foreground leading-relaxed">
                La <strong>Ingeniería en Sistemas</strong> integra principios de la informática con la gestión de <strong>sistemas de información</strong> para diseñar, desarrollar y administrar soluciones que resuelven problemas reales, especialmente en el ámbito empresarial. La carrera abarca <strong>Ciencias de la Computación</strong>, <strong>Ingeniería de Software</strong>, <strong>Gestión de Sistemas de Información</strong>, <strong>Infraestructura IT</strong> y <strong>Gestión Estratégica</strong>. El egresado destaca por su <strong>solución de problemas</strong>, <strong>desarrollo de software</strong>, <strong>administración de sistemas</strong>, <strong>gestión de proyectos</strong>, <strong>análisis de datos</strong> e <strong>innovación</strong>, con proyección laboral en empresas de <strong>tecnología</strong> y de <strong>desarrollo de software</strong>.
              </p>
              
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">5 años</p>
                    <p className="text-sm text-muted-foreground">Duración</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">95%</p>
                    <p className="text-sm text-muted-foreground">Empleabilidad</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Top 3</p>
                    <p className="text-sm text-muted-foreground">Ranking Nacional</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">50+</p>
                    <p className="text-sm text-muted-foreground">Materias</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Imagen de la carrera */}
            <div className="lg:order-first">
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <Image
                  src="/assets/ingenieria.png"
                  alt="Ingeniería en Sistemas - Universidad Mariano Gálvez"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* CTA - Obtener más información */}
          <div className="mt-12">
            <Card className="p-6 max-w-2xl mx-auto">
              <CardContent className="p-0">
                <h4 className="text-lg font-semibold mb-4">
                  Obtener más información de la carrera
                </h4>
                {isSubmitted ? (
                  <div className="text-center py-4">
                    <p className="text-green-600 font-medium">
                      ¡Gracias! Te contactaremos pronto con más información.
                    </p>
                  </div>
                ) : (
                  <form
                    className="flex flex-col sm:flex-row gap-3"
                    onSubmit={handleSubmit}
                  >
                    <Input
                      type="email"
                      placeholder="tu.email@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                      required
                      aria-label="email"
                    />
                    <Button type="submit" className="sm:w-auto">
                      Obtener información
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grid de tarjetas/enlaces */}
          <div className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold">Sitio Oficial UMG</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href="https://www.umg.edu.gt" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Visitar
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold">Facultad de Ingeniería</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href="https://www.umg.edu.gt/facultades/ingenieria" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Visitar
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold">Plan de Estudios</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href="https://www.umg.edu.gt/carreras/ingenieria-sistemas" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Visitar
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold">Proceso de Admisión</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href="https://www.umg.edu.gt/admisiones" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Visitar
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <hr className="w-11/12 mx-auto" />
    </section>
  );
};