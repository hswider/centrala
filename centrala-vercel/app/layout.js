import './globals.css';
import Navigation from '@/components/Navigation';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'POOM | Centrala',
  description: 'Dashboard zamowien POOM',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
