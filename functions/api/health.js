export async function onRequestGet() {
  return Response.json({
    ok: true,
    app: "EduMap",
    service: "Cloudflare Pages Functions"
  });
}
