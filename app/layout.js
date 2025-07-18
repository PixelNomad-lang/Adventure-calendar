import { Inter } from "next/font/google";
import "./globals.css";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import Header from "@/components/header";
import CreateEventDrawer from "@/components/create-event";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Schedulrr",
  description: " ",
};

export default function RootLayout({ children }) {
  return (
    <SupabaseProvider>
      <html lang="en">
        <body className={inter.className}>
          <Header />
          <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {children}
          </main>
          <footer className="bg-blue-100 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with 💗 by Native Developer</p>
            </div>
          </footer>
          <CreateEventDrawer />
        </body>
      </html>
    </SupabaseProvider>
  );
}
