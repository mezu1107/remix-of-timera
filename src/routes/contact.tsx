import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Concierge — Timera" },
      { name: "description", content: "Speak with an Timera concierge. Available seven days a week, in seven languages." },
      { property: "og:title", content: "Contact Concierge — Timera" },
      { property: "og:description", content: "Speak with an Timera concierge." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="container-luxe py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Contact</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">A concierge, <span className="italic gold-text">not a queue.</span></h1>
        <p className="mt-4 text-muted-foreground">
          Reach a member of our client care team seven days a week, in seven languages. We typically respond within two hours.
        </p>
      </div>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-8">
          {[
            { icon: Mail, label: "Email", value: "concierge@aureum.ch" },
            { icon: Phone, label: "Telephone", value: "+41 22 555 0164" },
            { icon: MapPin, label: "Atelier", value: "Rue du Rhône 14, 1204 Geneva, Switzerland" },
            { icon: Clock, label: "Hours", value: "Monday–Sunday · 08:00–22:00 CET" },
          ].map((i) => (
            <div key={i.label} className="flex gap-4">
              <div className="h-11 w-11 rounded-full glass flex items-center justify-center shrink-0">
                <i.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{i.label}</p>
                <p className="mt-1 font-serif text-lg">{i.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); toast.success("Message sent. A concierge will reply shortly."); }}
          className="glass rounded-2xl p-8 space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name" id="fn" required />
            <Field label="Last name" id="ln" required />
          </div>
          <Field label="Email" id="em" type="email" required />
          <Field label="Subject" id="sub" />
          <div>
            <Label htmlFor="msg" className="text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
            <Textarea id="msg" rows={6} className="mt-1.5" required />
          </div>
          <Button type="submit" size="lg" className="w-full h-12">Send message</Button>
        </form>
      </div>
    </div>
  );
}

function Field(props: React.ComponentProps<typeof Input> & { label: string; id: string }) {
  const { label, id, ...rest } = props;
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input id={id} className="mt-1.5 h-11" {...rest} />
    </div>
  );
}
