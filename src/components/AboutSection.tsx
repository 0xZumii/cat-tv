import { Gift, SmilePlus, Users } from 'lucide-react';

export function AboutSection() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl font-semibold text-text-main mb-6">
          How it works
        </h2>
        
        <p className="text-text-soft leading-relaxed mb-4">
          Cat TV is a collective hangout. Each day, you receive 100 treats.
          Use them to vibe with any cat you'd like — each vibe costs 10 treats, so you can
          hang with up to 10 cats daily (or more with extra treats).
        </p>

        <p className="text-text-soft leading-relaxed mb-10">
          When you vibe with a cat, treats go to their jar. Over 24 hours, they flow to our
          Care Fund — supporting real shelter donations and keeping Cat TV sustainable.
          It's a circular economy built on good vibes.
        </p>

        {/* Features */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
          <Feature
            icon={<Gift className="w-8 h-8" />}
            title="Daily Treats"
            description="Claim free treats every 24 hours"
          />
          <Feature
            icon={<SmilePlus className="w-8 h-8" />}
            title="Good Vibes"
            description="Show cats some love"
          />
          <Feature
            icon={<Users className="w-8 h-8" />}
            title="Hang Together"
            description="A chill place to appreciate cats"
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
      <div className="flex items-center justify-center text-accent-orange mb-3">
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
