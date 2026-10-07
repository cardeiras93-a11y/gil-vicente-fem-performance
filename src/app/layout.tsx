import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GIL VICENTE FC (FUTEBOL FEMININO)',
  description: 'Aplicação Oficial de Wellness, RPE e Pesagem - Gil Vicente FC Futebol Feminino',
  manifest: '/manifest.json',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GIL VICENTE FC',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark scroll-smooth">
      <head>
        <link rel="icon" href="/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-dark-bg text-slate-100 antialiased selection:bg-brand-lime selection:text-slate-950 pb-safe">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var CURRENT_BUILD = '20261007_v17';
              try {
                if (localStorage.getItem('femperf_build') !== CURRENT_BUILD) {
                  localStorage.setItem('femperf_build', CURRENT_BUILD);
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(n) { caches.delete(n); });
                    });
                  }
                }
              } catch (e) {}

              if ('serviceWorker' in navigator) {
                var refreshing = false;

                // Automatically reload page when new ServiceWorker activates
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });

                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    // Check for updates on initial load
                    reg.update().catch(function() {});

                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Tell new worker to skip waiting and activate immediately
                            newWorker.postMessage('SKIP_WAITING');
                          }
                        });
                      }
                    });
                  }).catch(function(err) {
                    console.warn('Erro no registo do ServiceWorker:', err);
                  });
                });

                // Check for updates every time app gains focus / visibility
                document.addEventListener('visibilitychange', function() {
                  if (document.visibilityState === 'visible' && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(function(reg) {
                      reg.update().catch(function() {});
                    });
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
