// Fonction Edge synthétique : accuse réception d'une notification (aucun envoi réel).
Deno.serve(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  return new Response(JSON.stringify({ received: true, body }), {
    headers: { "content-type": "application/json" },
  });
});
