import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import CheckUserButton from "@/app/components/CheckUserButton";



export default function Home() {
  return (
    <main>

     * <HeroGeometric /> 
     

      <section id="about" className="bg-[#051005] text-white px-6 py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-white">
            About FSA
          </h2>
          <p className="text-white/60 text-lg leading-relaxed font-light">
            The Filipino Student Association at UT Dallas is a community dedicated
            to celebrating Filipino culture, fostering friendship, and building
            lasting connections on campus.
          </p>
        </div>
      </section>

      <section id="events" className="bg-[#051005] text-white px-6 py-32 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-white">
            Events
          </h2>
          <p className="text-white/60 text-lg leading-relaxed font-light">
            Coming soon.
          </p>
        </div>
      </section>

      <section id="members" className="bg-[#051005] text-white px-6 py-32 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-white">
            Members
          </h2>
          <p className="text-white/60 text-lg leading-relaxed font-light">
            Coming soon.
          </p>
        </div>
      </section>

      <section id="contact" className="bg-[#051005] text-white px-6 py-32 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight text-white">
            Contact
          </h2>
          <p className="text-white/60 text-lg leading-relaxed font-light">
            Coming soon.
          </p>
        </div>
      </section>
      <div className="bg-[#051005] flex justify-center py-8">
        <CheckUserButton />
      </div>
    </main>
  );
}
