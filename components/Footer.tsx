import { LogoIcon } from "./Icons";

export const Footer = () => {
  return (
    <footer id="footer">
      {/* Línea superior más marcada y visual */}
      <section className="border-t border-black/15 pt-6 md:pt-8 pb-8">
        {/* Dos columnas: izquierda info, derecha mapa */}
        <div className="page-container grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-8 items-start">
          {/* Columna izquierda: marca + navegación (lado a lado) */}
          <div className="flex flex-col gap-6">
            <a
              rel="noreferrer noopener"
              href="/"
              className="font-bold text-xl flex"
            >
              <LogoIcon />
              Congreso Tecnológico
            </a>

            {/* Navegación del pie: dos columnas lado a lado */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-6">
              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-lg">Síguenos</h3>
                <div>
                  <a
                    rel="noreferrer noopener"
                    href="https://facebook.com/umgguatemala"
                    target="_blank"
                    className="opacity-60 hover:opacity-100"
                  >
                    Facebook
                  </a>
                </div>

                <div>
                  <a
                    rel="noreferrer noopener"
                    href="https://instagram.com/umgguatemala"
                    target="_blank"
                    className="opacity-60 hover:opacity-100"
                  >
                    Instagram
                  </a>
                </div>

                <div>
                  <a
                    rel="noreferrer noopener"
                    href="https://youtube.com/@umgguatemala"
                    target="_blank"
                    className="opacity-60 hover:opacity-100"
                  >
                    YouTube
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-lg">Acceso a</h3>
                <div>
                  <a
                    rel="noreferrer noopener"
                    href="#agenda"
                    className="opacity-60 hover:opacity-100"
                  >
                    Agenda
                  </a>
                </div>

                <div>
                  <a
                    rel="noreferrer noopener"
                    href="/inscripcion"
                    className="opacity-60 hover:opacity-100"
                  >
                    Inscripción
                  </a>
                </div>

                <div>
                  <a
                    rel="noreferrer noopener"
                    href="#faq"
                    className="opacity-60 hover:opacity-100"
                  >
                    FAQ
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: mapa */}
          <div className="flex flex-col">
            <h3 className="font-bold text-lg mb-2">Ubicación</h3>
            <div className="relative w-full overflow-hidden rounded-xl ring-1 ring-black/10 shadow-sm bg-black/5 backdrop-blur-sm aspect-[16/9]">
              <iframe
                title="Mapa — Universidad Mariano Gálvez de Guatemala (Campus Central)"
                src="https://www.google.com/maps?q=Universidad%20Mariano%20G%C3%A1lvez%20de%20Guatemala%20(Campus%20Central),%20Ciudad%20de%20Guatemala&output=embed"
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="mt-2 text-sm opacity-70">
              <a
                href="https://www.google.com/maps?q=Universidad%20Mariano%20G%C3%A1lvez%20de%20Guatemala%20(Campus%20Central),%20Ciudad%20de%20Guatemala"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:opacity-100 underline"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>

          {/* Pie */}
          <div className="col-span-full mt-6 md:mt-8 text-center text-slate-900">
            <h3>
              &copy; 2025 Congreso Tecnológico Anual UMG
            </h3>
          </div>
        </div>
      </section>
    </footer>
  );
};
