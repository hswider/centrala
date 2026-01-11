import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata = {
  title: 'POOM',
  description: 'Dashboard zamowien POOM',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
