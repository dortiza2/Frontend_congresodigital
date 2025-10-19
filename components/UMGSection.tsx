"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

export const UMGSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Imágenes del carrusel
  const images = [
    {
      src: "/assets/umg1.png",
      alt: "Universidad Mariano Gálvez - Campus"
    },
    {
      src: "/assets/umg2.png",
      alt: "Universidad Mariano Gálvez - Instalaciones"
    },
    {
      src: "/assets/umg3.png",
      alt: "Universidad Mariano Gálvez - Estudiantes"
    }
  ];

  // Auto-play del carrusel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section id="umg" className="py-24 sm:py-32">
      
      <div className="container mx-auto px-4">
        {/* Texto resumido de UMG */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            <span className="text-slate-900 font-bold">
              Universidad Mariano Gálvez
            </span>
          </h2>
          
          <div className="text-lg text-black leading-relaxed">
            <p>
              La <strong>Universidad Mariano Gálvez de Guatemala</strong> honra al Dr. José Mariano Gálvez, reformador de la educación guatemalteca. Forma profesionales con excelencia <strong>ética, científica y técnica</strong>, integrando <strong>docencia, investigación y servicio</strong>. Ofrece <strong>Pregrado</strong> y <strong>Posgrado</strong> (Maestrías y Doctorados), además de Escuela de Idiomas y facultades como <strong>Administración de Empresas, Comunicación, Económicas, Jurídicas y Sociales, Ingeniería, Humanidades, Medicina, Psicología y Teología</strong>, entre otras.
            </p>
          </div>
        </div>

        {/* Carrusel de imágenes */}
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-lg"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {/* Imágenes */}
            <div className="relative w-full h-full">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={index === 0}
                    unoptimized
                  />
                </div>
              ))}
            </div>

            {/* Controles de navegación */}
            <Button
              variant="outline"
              size="icon"
              aria-label="Imagen anterior"
              className="group absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 text-slate-700 border border-black/10 shadow-lg hover:bg-white hover:shadow-xl transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Imagen siguiente"
              className="group absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/80 text-slate-700 border border-black/10 shadow-lg hover:bg-white hover:shadow-xl transition-all backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Button>

            {/* Indicadores de puntos */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-white shadow-sm scale-110'
                  : 'bg-white/70 hover:bg-white'
                  }`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <hr className="w-11/12 mx-auto mt-16" />
    </section>
  );
};