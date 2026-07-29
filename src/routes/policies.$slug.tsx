import { createFileRoute, notFound } from "@tanstack/react-router";

const policies: Record<string, { title: string; sections: { h: string; p: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      { h: "1. Information we collect", p: "We collect only the information necessary to fulfil your orders, personalise your experience, and communicate with you: name, email, shipping address, and payment details. Payment information is tokenised and never stored on our servers." },
      { h: "2. How we use your information", p: "Your information is used to process orders, provide client care, send transactional communications, and — with your explicit consent — deliver curated updates from the maison." },
      { h: "3. Data retention", p: "Order records are retained for seven years for tax and warranty purposes. Marketing preferences can be updated or revoked at any time from your account." },
      { h: "4. Your rights", p: "You may request access, rectification, or deletion of your data at any time by writing to concierge@aureum.ch." },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      { h: "1. Acceptance", p: "By placing an order with Timera you accept these terms in full." },
      { h: "2. Pricing", p: "Prices are displayed in your local currency where possible and are inclusive of applicable duties. All prices are subject to change without notice." },
      { h: "3. Order confirmation", p: "An order is deemed accepted only upon our written confirmation of dispatch." },
      { h: "4. Governing law", p: "These terms are governed by the laws of Switzerland." },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    sections: [
      { h: "Complimentary worldwide shipping", p: "All orders ship complimentary, insured, and signature-required. Express service delivers within 2–3 business days worldwide." },
      { h: "Order processing", p: "Orders placed before 14:00 CET are dispatched the same business day from Geneva." },
      { h: "Duties & taxes", p: "For most destinations, duties are pre-paid at checkout. Where local regulations require, duties are collected on delivery." },
    ],
  },
  refund: {
    title: "Refund & Returns Policy",
    sections: [
      { h: "30-day returns", p: "Unworn timepieces may be returned within 30 days of receipt for a full refund. All accessories and packaging must be included." },
      { h: "How to return", p: "Contact concierge@aureum.ch to arrange complimentary insured pickup." },
      { h: "Refund timing", p: "Refunds are processed within 5 business days of receipt to your original payment method." },
    ],
  },
  warranty: {
    title: "Warranty",
    sections: [
      { h: "5-year international warranty", p: "Every Timera timepiece is covered by a 5-year international warranty against manufacturing defects and movement failure under normal use." },
      { h: "What's covered", p: "Movement, hands, dial, and case-finishing defects." },
      { h: "Servicing", p: "We recommend a full service every 4–5 years at an authorised atelier to preserve the movement's accuracy." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    sections: [
      { h: "What are cookies", p: "Cookies are small text files stored on your device to remember preferences and improve your experience." },
      { h: "Types we use", p: "Essential cookies for cart and session functionality, and analytical cookies (with consent) to improve our website." },
      { h: "Managing cookies", p: "You can manage or disable cookies at any time via your browser settings." },
    ],
  },
};

export const Route = createFileRoute("/policies/$slug")({
  loader: ({ params }) => {
    const policy = policies[params.slug];
    if (!policy) throw notFound();
    return { policy };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.policy.title ?? "Policy";
    return {
      meta: [
        { title: `${title} — Timera` },
        { name: "description", content: `${title} for Timera.` },
        { property: "og:title", content: `${title} — Timera` },
        { property: "og:description", content: `${title} for Timera.` },
      ],
    };
  },
  component: PolicyPage,
});

function PolicyPage() {
  const { policy } = Route.useLoaderData() as { policy: { title: string; sections: { h: string; p: string }[] } };
  return (
    <div className="container-luxe py-16 max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Legal</p>
      <h1 className="mt-3 font-serif text-5xl">{policy.title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: March 2025</p>

      <div className="mt-12 space-y-10">
        {policy.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-serif text-2xl">{s.h}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
