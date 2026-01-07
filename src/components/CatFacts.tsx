import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const CAT_FACTS = [
  "Cats sleep for about 70% of their lives.",
  "A group of cats is called a 'clowder'.",
  "Cats have over 20 vocalizations, including the purr, meow, and chirp.",
  "A cat's hearing is much more sensitive than a human's or dog's.",
  "Cats can rotate their ears 180 degrees.",
  "The first cat in space was a French cat named Felicette in 1963.",
  "Cats can jump up to 6 times their length.",
  "A cat's nose print is unique, like a human fingerprint.",
  "Cats spend 30-50% of their day grooming themselves.",
  "The oldest known pet cat was found in a 9,500-year-old grave.",
  "Cats can't taste sweetness.",
  "A cat's purr vibrates at 25-150 Hz, which can promote healing.",
  "Cats have a third eyelid called a 'haw' to protect their eyes.",
  "The average cat can run at 30 mph in short bursts.",
  "Cats have 230 bones, while humans have 206.",
  "A cat's whiskers are generally about the same width as its body.",
  "Cats can drink seawater to survive (but please don't test this).",
  "The world's largest cat measured 48.5 inches long.",
  "Cats spend about 15% of their day playing.",
  "A cat's brain is 90% similar to a human's brain.",
  "Cats can see in light levels 6 times lower than humans need.",
  "The first cat show was held in London in 1871.",
  "Cats have a specialized collarbone that allows them to always land on their feet.",
  "A cat's heart beats nearly twice as fast as a human heart.",
  "Cats have been domesticated for about 10,000 years.",
  "The richest cat in the world inherited $13 million.",
  "Cats can make over 100 different sounds.",
  "A cat's sense of smell is 14 times stronger than a human's.",
  "Cats can move each ear independently.",
  "The longest living cat on record lived to be 38 years old.",
];

export function CatFacts() {
  const [factIndex, setFactIndex] = useState(() =>
    Math.floor(Math.random() * CAT_FACTS.length)
  );
  const [isVisible, setIsVisible] = useState(true);

  // Change fact every 30 seconds with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % CAT_FACTS.length);
        setIsVisible(true);
      }, 300);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-accent-lavender/20 rounded-2xl p-6 my-8 mx-4 max-w-2xl lg:mx-auto">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-accent-lavender/30 rounded-full">
          <Sparkles size={20} className="text-accent-lavender" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-text-main mb-1">
            Did you know?
          </h3>
          <p
            className={`text-text-soft transition-opacity duration-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {CAT_FACTS[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
