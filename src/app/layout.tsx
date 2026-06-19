import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Natural Reserve — Fish Feeding Calculator',
  description: 'Fish farming feeding rate calculator based on biomass weight — accurate, fast, and easy to use.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" id="htmlRoot">
      <body>
        {children}
      </body>
    </html>
  );
}
