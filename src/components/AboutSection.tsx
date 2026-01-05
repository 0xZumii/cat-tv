import { Gift, SmilePlus, Users } from 'lucide-react';

export function AboutSection() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl font-semibold text-text-main mb-6">
          How it works
        </h2>
        
        <p className="text-text-soft leading-relaxed mb-4">
          Cat TV is a collective care experiment. Each day, you receive 100 cat food. 
          Use it to feed any cat you'd like — each feeding costs 10 food, so you can 
          care for up to 50 cats daily.
        </p>
        
        <p className="text-text-soft leading-relaxed mb-10">
          When you feed a cat, food fills their bowl. Over 24 hours, it flows to our 
          Care Fund — supporting real shelter donations and keeping Cat TV sustainable. 
          It's a circular economy built on care.
        </p>

        {/* Features */}
        <div className="flex justify-center gap-10 flex-wrap">
          <Feature
            icon={<Gift className="w-8 h-8" />}
            title="Daily Allowance"
            description="Claim free cat food every 24 hours"
          />
          <Feature
            icon={<SmilePlus className="w-8 h-8" />}
            title="Happy Cats"
            description="Fed cats show their happiness"
          />
          <Feature
            icon={<Users className="w-8 h-8" />}
            title="Community Care"
            description="Everyone helps keep cats fed"
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="text-center max-w-[180px]">
      <div className="text-accent-orange mx-auto mb-3">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-text-main mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-soft">
        {description}
      </p>
    </div>
  );
}
