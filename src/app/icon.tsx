import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(135deg, #e8622c, #f2a154)",
        }}
      >
        {/* Emoji glyphs don't render reliably in the OG image renderer, so
            the mark is a simple monogram instead of the 🍽️ used in-app. */}
        <span style={{ fontSize: 34, fontWeight: 700, color: "#fff8f2" }}>L</span>
      </div>
    ),
    { ...size }
  );
}
