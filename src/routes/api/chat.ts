import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { CHAT_MODEL, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { catalogueToText, loadCatalogue } from "@/lib/store-data.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) return new Response("Messages are required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key)
          return new Response(
            "The concierge key (LOVABLE_API_KEY) is missing on this deployment. Add it to the hosting environment variables and redeploy.",
            { status: 500 },
          );

        let catalogue = "";
        try {
          catalogue = catalogueToText(await loadCatalogue());
        } catch {
          catalogue = "";
        }

        const gateway = createLovableAiGatewayProvider(key);
        let result;
        try {
          result = streamText({
          model: gateway(CHAT_MODEL),
          system: [
            "You are the Timera Concierge, a warm and precise shopping assistant for the Timera watch store (Pakistan).",
            "Every Timera watch uses a precision QUARTZ movement. Timera is NOT Swiss-made and never claim otherwise — if asked, explain quartz is more accurate, service-free and keeps prices honest.",
            "Your job is to close the sale: always end with a clear next step (a product link, /shop, or /checkout).",
            "Answer only using the catalogue and store policies below. If something is not covered, say so and suggest contacting the team via the Contact page.",
            "Recommend at most 3 watches at a time. Always mention the price in Pakistani Rupees (Rs) and link the product as a markdown link like [Name](/product/slug).",
            "Never invent products, prices, discount codes, delivery dates or specifications.",
            "Never ask for card numbers, passwords or any payment details. If a customer offers them, tell them to use the secure checkout instead.",
            "Keep replies short — 2 to 5 sentences or a short bullet list.",
            "",
            "Store policies: complimentary insured shipping over Rs 5,000, 30-day returns on unworn pieces, every watch ships with an authenticity dossier. Orders can be tracked at /track. Security and privacy information lives at /trust.",
            "",
            "CATALOGUE:",
            catalogue || "(catalogue unavailable right now — apologise and suggest browsing /shop)",
          ].join("\n"),
            messages: await convertToModelMessages(body.messages as UIMessage[]),
          });
        } catch (e: any) {
          return new Response(e?.message ?? "The concierge could not start.", { status: 500 });
        }

        return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
      },
    },
  },
});
