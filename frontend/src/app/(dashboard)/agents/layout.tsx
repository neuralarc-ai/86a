import { agentPlaygroundFlagFrontend } from '@/flags';
import { isFlagEnabled } from '@/lib/feature-flags';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Agent Conversation | 86/A',
  description: 'Interactive agent conversation powered by 86/A',
  openGraph: {
    title: 'Agent Conversation | 86/A',
    description: 'Interactive agent conversation powered by 86/A',
    type: 'website',
  },
};

export default async function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
