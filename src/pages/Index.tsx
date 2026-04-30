import { Navbar } from "@/components/site/Navbar";
import { HeroSlider } from "@/components/site/HeroSlider";
import { WelcomeSlider } from "@/components/site/WelcomeSlider";
import { Services } from "@/components/site/Services";
import { Stats } from "@/components/site/Stats";
import { WhyUs } from "@/components/site/WhyUs";
import { Testimonials } from "@/components/site/Testimonials";
import { CTASection } from "@/components/site/CTASection";
import { Footer } from "@/components/site/Footer";
import { Chatbot } from "@/components/site/Chatbot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSlider />
        <WelcomeSlider />
        <Stats />
        <Services />
        <WhyUs />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

export default Index;
