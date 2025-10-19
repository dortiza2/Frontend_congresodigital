import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { useState, useEffect } from "react";
import { GraduationCap, Users, Trophy, BookOpen, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { saveContactEmail } from "../lib/tempStorage";
import Image from "next/image";

function CarruselNewsletter() {
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);

  const images = [
    {
      src: "/assets/ingenieria.png",
      alt: "Ingeniería en Sistemas",
      credit: "https://www.umg.edu.gt"
    },
    {
      src: "/assets/ingenieria2.png", 
      alt: "Laboratorio de Computación",
      credit: "https://www.umg.edu.gt"
    },
    {
      src: "/assets/ingenieria3.png",
      alt: "Estudiantes de Ingeniería",
      credit: "https://www.umg.edu.gt"
    }
  ];

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), 5000);
    return () => clearInterval(id);
  }, [auto, images.length]);

  const next = () => setCurrent((c) => (c + 1) % images.length);
  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);

  return (
    <div
      className="relative h-96 rounded-2xl overflow-hidden shadow-lg"
      onMouseEnter={() => setAuto(false)}
      onMouseLeave={() => setAuto(true)}
    >
      <div className="relative w-full h-full">
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={i === 0}
              unoptimized
            />
          </div>
        ))}
      </div>

      <button
        onClick={prev}
        className="group absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 text-slate-700 border border-black/10 shadow-lg hover:bg-white hover:shadow-xl transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
      </button>
      <button
        onClick={next}
        className="group absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 text-slate-700 border border-black/10 shadow-lg hover:bg-white hover:shadow-xl transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === current ? "bg-white" : "bg-white/70 hover:bg-white"}`}
            aria-label={`Ir a imagen ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

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
              <p className="text-xl text-black leading-relaxed">
                La <strong>Ingeniería en Sistemas</strong> integra principios de la informática con la gestión de <strong>sistemas de información</strong> para diseñar, desarrollar y administrar soluciones que resuelven problemas reales, especialmente en el ámbito empresarial. La carrera abarca <strong>Ciencias de la Computación</strong>, <strong>Ingeniería de Software</strong>, <strong>Gestión de Sistemas de Información</strong>, <strong>Infraestructura IT</strong> y <strong>Gestión Estratégica</strong>. El egresado destaca por su <strong>solución de problemas</strong>, <strong>desarrollo de software</strong>, <strong>administración de sistemas</strong>, <strong>gestión de proyectos</strong>, <strong>análisis de datos</strong> e <strong>innovación</strong>, con proyección laboral en empresas de <strong>tecnología</strong> y de <strong>desarrollo de software</strong>.
              </p>
              
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">5 años</p>
                    <p className="text-sm text-black">Duración</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">95%</p>
                    <p className="text-sm text-black">Empleabilidad</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Top 3</p>
                    <p className="text-sm text-black">Ranking Nacional</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">50+</p>
                    <p className="text-sm text-black">Materias</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carrusel reemplazando imagen fija */}
            <div className="lg:order-first">
              <Image
                src="/assets/ingenieria.png"
                alt="Ingeniería en Sistemas"
                width={800}
                height={600}
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>

          {/* CTA - Obtener más información */}
          <div className="mt-12">
            <Card className="bg-neutral-200 p-6 max-w-2xl mx-auto">
              <CardContent className="p-0">
                <h4 className="text-lg font-semibold mb-4 text-black">
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
                      placeholder="Tu correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" className="rounded-lg">
                      Enviar
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Recursos adicionales */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <Card className="bg-neutral-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold text-black">Página Oficial</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
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

              <Card className="bg-neutral-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold text-black">Plan de Estudios</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
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

              <Card className="bg-neutral-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    <h5 className="font-semibold text-black">Admisiones</h5>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    asChild
                  >
                    <a 
                      href="https://admision.umg.edu.gt" 
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
    </section>
  );
};