'use client';
import { useRef } from 'react';

const slides = [
  { id: 1, label: 'Cultural Night', caption: 'A night of music, dance, and food.' },
  { id: 2, label: 'Friendship Games', caption: 'Friendly competition, lasting bonds.' },
  { id: 3, label: 'General Meeting', caption: 'Where it all begins.' },
  { id: 4, label: 'Barrio Fiesta', caption: 'Food, fun, and Filipino flavor.' },
  { id: 5, label: 'Cultural Night', caption: 'A night of music, dance, and food.' },
  { id: 6, label: 'Friendship Games', caption: 'Friendly competition, lasting bonds.' },
  { id: 7, label: 'General Meeting', caption: 'Where it all begins.' },
  { id: 8, label: 'Barrio Fiesta', caption: 'Food, fun, and Filipino flavor.' },
];

export function Carousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-w-0 w-full overflow-hidden">
      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="snap-start shrink-0 w-64 rounded-2xl bg-gray-100 flex flex-col overflow-hidden"
          >
            <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
              Photo
            </div>
            <div className="p-4 flex flex-col gap-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">UTD FSA</p>
              <h3 className="text-lg font-bold text-black">{slide.label}</h3>
              <p className="text-sm text-gray-600">{slide.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>

      {/* Hero Section */}
      <section className="flex flex-col items-start justify-center text-left py-40 px-6 bg-white text-black">
        <p className="text-2xl mb-4 font-bold"> WELCOME TO </p>
        <h1 className="text-6xl font-bold mb-4"> UTD FSA</h1>
        <p className="text-2xl mb-4 font-bold"> FILIPINO STUDENT ASSOCIATION </p>
      </section>
      
      {/* Sliding Text */}
        <section className="bg-white text-black overflow-hidden py-4">
          <div className="marquee">
            <div className="marquee-track">
              <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
              <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
              <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
              <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
              <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
            </div>
          <div className="marquee-track" aria-hidden="true">
            <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
            <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
            <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
            <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
            <span className="text-lg font-semibold">PARA SA KULTURA FOR THE CULTURE &nbsp;</span>
          </div>
          </div>
        </section>

    {/* Who Are We? Section */}
<section className="py-20 px-6 bg-white text-black">
  <div className="flex items-stretch gap-8">

    {/* Left: heading + description */}
    <div className="flex flex-col justify-center shrink-0">
      <h2 className="text-4xl font-bold">WHO ARE</h2>
      <h2 className="text-4xl font-bold">WE?</h2>
      <div className="mt-4 flex flex-col gap-2 max-w-xs">
        <p className="text-lg">We celebrate Filipino culture through events and community.</p>
        <p className="text-lg">We host cultural nights, workshops, and social gatherings.</p>
        <p className="text-lg">Everyone is welcome — join us to connect, learn, and share.</p>
      </div>
    </div>

    {/* Vertical divider */}
    <div className="w-px bg-black self-stretch shrink-0" />

    {/* Right: carousel, pulled left to overlap the divider */}
    <div className="flex-1 min-w-0 -ml-6">
      <Carousel />
    </div>

  </div>
</section>

    {/* Mission Statement */}
    <section className="bg-white text-black py-50 px-6">
      <h2 className="text-3xl font-bold text-left mb-4"> OUR MISSION </h2>
      <p className="text-lg mb-4"> To promote Filipino culture and foster a sense of community among Filipino students at UTD. </p>
    </section>

    {/* Footer Section */}
    <footer className="bg-black text-white py-4">
      <div className="container mx-auto text-left">
        <p className="text-sm">&copy; UTD FSA</p>
      </div>
    </footer>

    </main>
  );
}
