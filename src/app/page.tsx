import Hero from "@/components/home/hero";
import WhyWorkAbhi from "@/components/home/WhyWorkAbhi";
import PopularTools from "@/components/home/PopularTools";
import ExploreCategories from "@/components/home/ExploreCategories";
import HowItWorks from "@/components/home/HowItWork";
import PrivacySection from "@/components/home/PrivacySection";
import FinalCTA from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />

      <WhyWorkAbhi />

      <PopularTools />

      <ExploreCategories />

      <HowItWorks />

      <PrivacySection />

      <FinalCTA />
    </>
  );
}