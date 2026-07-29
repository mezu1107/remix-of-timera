import { createFileRoute } from "@tanstack/react-router";
import atelierImg from "@/assets/atelier.jpg";
import heroImg from "@/assets/hero-1.jpg";

import { Award, Gem, Globe2, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Atelier — Timera" },
      { name: "description", content: "Since 1963, the Timera atelier has crafted Swiss timepieces of extraordinary restraint. Three generations, one obsession." },
      { property: "og:title", content: "Our Atelier — Timera" },
      { property: "og:description", content: "Three generations of Swiss watchmaking." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img src={atelierImg} alt="Atelier" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-onyx/40 to-transparent" />
        <div className="container-luxe absolute inset-x-0 bottom-16">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Our Maison</p>
          <h1 className="mt-3 font-serif text-5xl md:text-7xl max-w-3xl leading-[1.05]">
            A quiet obsession with <span className="italic gold-text">the millimetre</span>.
          </h1>
        </div>
      </section>

      <section className="container-luxe py-24 max-w-3xl">
        <p className="font-serif text-2xl leading-relaxed text-muted-foreground">
          Timera was founded in 1963 by Henri Vallier, an apprentice at a legendary Neuchâtel house who
          left to pursue a simple idea: a watch should reveal itself slowly. Sixty-two years later, that
          conviction still governs every decision at the atelier.
        </p>
        <p className="mt-8 leading-relaxed text-muted-foreground">
          We remain a maison of fourteen watchmakers. Each of them signs the movement they assemble.
          Each dial is finished with a technique Henri learned from his grandfather — the same silvered
          sunburst that has become our discreet signature. There are no shortcuts, no outsourced
          finishing, no algorithms in the quality control. Just eyes, hands, and time.
        </p>
      </section>

      <section className="container-luxe grid gap-4 md:grid-cols-4 py-12">
        {[
          { icon: Award, n: "62", l: "Years of craft" },
          { icon: Users, n: "14", l: "Master watchmakers" },
          { icon: Globe2, n: "82", l: "Countries served" },
          { icon: Gem, n: "5", l: "Year warranty" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-xl p-6 text-center">
            <s.icon className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-4 font-serif text-4xl gold-text">{s.n}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="container-luxe py-24 grid gap-12 lg:grid-cols-2 lg:items-center">
        <img src={heroImg} alt="Signature timepiece" className="rounded-2xl aspect-square object-cover" />
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Our Craft</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl">Made in <span className="italic gold-text">Neuchâtel</span></h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            Every Timera begins as raw brass, sapphire and steel and ends, some 420 hours later, as a
            complete timepiece regulated in five positions to chronometer standards. The finishing —
            the beveled bridges, the perlage on the mainplate, the Côtes de Genève — is done by hand,
            under a loupe, in a room quieter than a library.
          </p>
        </div>
      </section>
    </div>
  );
}
