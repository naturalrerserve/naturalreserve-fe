import type { Metadata } from 'next';
import './globals.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

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
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
