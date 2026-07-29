import { createFileRoute } from "@tanstack/react-router";
import { faqs } from "@/lib/products";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Timera" },
      { name: "description", content: "Frequently asked questions about Timera timepieces, shipping, warranty, and care." },
      { property: "og:title", content: "FAQ — Timera" },
      { property: "og:description", content: "Answers to common Timera questions." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Help Centre</p>
      <h1 className="mt-3 font-serif text-5xl md:text-6xl">Frequently asked</h1>

      <Accordion type="single" collapsible className="mt-12">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`f-${i}`}>
            <AccordionTrigger className="font-serif text-lg text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
