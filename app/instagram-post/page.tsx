import InstagramCarousel from "@/components/instagram-carousel";

export const metadata = {
  title: "AgentHelm | Instagram Strategy Mockup",
  description: "A premium 8-slide Instagram carousel demonstrating AgentHelm's governance and skill modules.",
};

export default function InstagramPostPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-7xl mx-auto py-20 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Mockup */}
          <div className="flex justify-center flex-col items-center">
             <div className="mb-6 text-center lg:text-left w-full max-w-[500px]">
                <h1 className="text-4xl font-black italic tracking-tighter text-white mb-4">SOCIAL STRATEGY v1.0</h1>
                <p className="text-zinc-500 text-lg">Industrial Signal Orange campaign for Instagram Growth. Based on the 8-slide conversion logic.</p>
             </div>
             <InstagramCarousel />
          </div>

          {/* Right Side: Copy & Strategy */}
          <div className="space-y-12">
            <section>
              <h2 className="text-[#FF4F00] font-bold uppercase tracking-widest text-sm mb-4">The Playbook</h2>
              <h3 className="text-3xl font-bold text-white mb-6">Multi-Slide Transformation</h3>
              <div className="space-y-6">
                 <StrategyItem 
                   number="01" 
                   title="Hook the Unconscious" 
                   desc="Use high-contrast visuals and fear-based curiosity (Agentic Chaos) to stop the scroll."
                 />
                 <StrategyItem 
                   number="02" 
                   title="Brainstorming Skill" 
                   desc="Showcase our Socratic protocol. It's not just an agent; it's a governed intelligence."
                 />
                 <StrategyItem 
                   number="03" 
                   title="Deterministic Planning" 
                   desc="Highlight the move from 'probabilistic failure' to 'deterministic success' through plan-writing."
                 />
              </div>
            </section>

            <section className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <h4 className="text-white font-bold mb-4">Distribution Strategy</h4>
              <ul className="text-zinc-400 space-y-2 list-disc list-inside">
                <li>Post Tuesday 11 AM EST (Algorithm Peak)</li>
                <li>Tag relevant AI communities and partners</li>
                <li>Cross-post Slide 1 to LinkedIn as a teaser</li>
                <li>Reply to every comment within first 60 mins</li>
              </ul>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}

function StrategyItem({ number, title, desc }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="text-3xl font-black italic text-zinc-800">{number}</div>
      <div>
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
