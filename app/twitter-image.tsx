import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = "image/png";

export default async function TwitterImage() {
  const title = "CeritaKita Studio";
  const subtitle = "Booking Sesi Foto Profesional";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          backgroundColor: "#0b1a13",
          color: "#f4f1e6",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: -1 }}>{title}</div>
        <div style={{ marginTop: 16, fontSize: 30, fontWeight: 500, opacity: 0.92 }}>
          {subtitle}
        </div>
        <div style={{ marginTop: 42, fontSize: 20, opacity: 0.75 }}>
          ceritakitastudio.site
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(760px 360px at 20% 25%, rgba(212,184,150,0.25), rgba(0,0,0,0)), radial-gradient(760px 360px at 80% 75%, rgba(37,99,235,0.22), rgba(0,0,0,0))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 64,
            height: 2,
            backgroundColor: "rgba(212,184,150,0.55)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
