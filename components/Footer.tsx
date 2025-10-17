import { LogoIcon } from "./Icons";

export const Footer = () => {
  return (
    <footer id="footer">
      <section className="border-t border-neutral-300 pt-6 md:pt-8 pb-8">
        <div className="page-container grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-6 md:gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <a
              rel="noreferrer noopener"
              href="/"
              className="font-bold text-xl flex"
            >
              <LogoIcon />
              Congreso Tecnológico
            </a>
          </div>

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
            <h3 className="font-bold text-lg">Plataformas</h3>
            <div>
              <a
                rel="noreferrer noopener"
                href="/"
                className="opacity-60 hover:opacity-100"
              >
                Web
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
