import { Metadata } from 'next';
import Layout from '../../layout/layout';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'EAC Portal',
    description: 'Ejura Agricultural College Portal.',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'PrimeReact Atlantis-REACT',
        url: 'https://www.primefaces.org/Atlantis-react',
        description: 'Ejura Agricultural College Portal. Built with React and PrimeReact.',
        images: ['https://www.primefaces.org/static/social/Atlantis-react.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function MainLayout({ children }: MainLayoutProps) {
    return <Layout>{children}</Layout>;
}
