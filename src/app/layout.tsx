import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photo Printer - Dịch vụ in ấn ảnh",
  description:
    "Ứng dụng web cho dịch vụ in ấn ảnh theo yêu cầu. Hỗ trợ cấu hình khung, layout, bleed/padding trên khổ A4.",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
