import { Statistics } from "./Statistics";
const pilot = "/assets/pilot.png";

export const About = () => {
  return (
    <section
      id="about"
      className="py-24 sm:py-32"
    >
      <div className="bg-neutral-100 border rounded-lg py-12">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <img
            src={pilot}
            alt="Ilustración de un piloto representando liderazgo y navegación en el mundo digital"
            className="w-[300px] object-contain rounded-lg"
          />
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-slate-900 font-bold">
                  About{" "}
                </span>
                Company
              </h2>
              <p className="text-xl text-black mt-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit
                amet, consectetur adipiscing elit.
              </p>
            </div>

            <Statistics />
          </div>
        </div>
      </div>
    </section>
  );
};
