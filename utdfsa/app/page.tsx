export default function Home() {
  return (
    <main>

      {/* Hero Section */}
      <section className="flex flex-col items-start justify-center text-left py-24 px-6 bg-white text-black">
        <p className="text-lg mb-4 font-bold"> WELCOME TO </p>
        <h1 className="text-5xl font-bold mb-4"> UTD FSA</h1>
        <p className="text-lg mb-4 font-bold"> FILIPINO STUDENT ASSOCIATION </p>
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

    </main>
  );
}
