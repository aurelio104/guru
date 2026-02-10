import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { CybersecurityPillars } from "@/components/sections/CybersecurityPillars";
import { Services } from "@/components/sections/Services";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { GlobalScale } from "@/components/sections/GlobalScale";
import { Portfolio } from "@/components/sections/Portfolio";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <CybersecurityPillars />
        <Services />
        <HowItWorks />
        <GlobalScale />
        <Portfolio />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
