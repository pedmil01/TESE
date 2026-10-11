import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Workload Placement Studio',
  description: 'Preliminary solution placement, operating model and AI-assisted assessment.'
};
export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="en"><body style={{margin:0}}>{children}</body></html>;
}
