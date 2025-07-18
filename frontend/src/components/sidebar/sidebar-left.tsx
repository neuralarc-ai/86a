'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Menu, Store, Plus, Zap, Plug, X } from 'lucide-react';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { CTACard } from '@/components/sidebar/cta';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useFeatureFlags } from '@/lib/feature-flags';
import TokenUsageCard from '@/components/sidebar/tokenusage';
import { useRouter } from 'next/navigation';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });
  const [showSearchBar, setShowSearchBar] = useState(false);

  const pathname = usePathname();
  const { flags, loading: flagsLoading } = useFeatureFlags(['custom_agents', 'agent_marketplace']);
  const customAgentsEnabled = flags.custom_agents;
  const marketplaceEnabled = flags.agent_marketplace;

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUser({
          name:
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
        });
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setOpen(!state.startsWith('expanded'));
        window.dispatchEvent(
          new CustomEvent('sidebar-left-toggled', {
            detail: { expanded: !state.startsWith('expanded') },
          }),
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, setOpen]);

  return (
    <Sidebar
      collapsible="icon"
      className={`border-r-0 bg-[var(--sidebar)] backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] max-w-full sm:max-w-full transition-all duration-300 ease-in-out ${state === 'collapsed' ? 'w-[100px] sm:w-[100px] md:w-[100px]' : 'w-[280px] sm:w-[320px] md:w-[256px]'}`}
      {...props}
    >
      {state === 'collapsed' ? (
        <div className="flex flex-col items-center w-full h-full min-h-screen justify-between py-4">
          {/* Header/Logo */}
          <Link href="/dashboard">
            <div className="w-[40px] h-[30px] flex items-center justify-center mb-6 ">
              <KortixLogo />
            </div>
          </Link>
          {/* Icon Buttons */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <SidebarTrigger className="h-5 w-5 my-3 flex-shrink-0" />
            {/* Plus button: expands sidebar and navigates to /dashboard, always hides search bar */}
            <button
              className={`h-5 w-5 flex items-center justify-center my-3 rounded-lg flex-shrink-0 ${state !== 'collapsed' ? 'bg-[#F7F7F703] border border-white/45 shadow-[inset_2px_2px_1.2px_rgba(255,255,255,0.03)]' : 'hover:bg-[#EFEDE70D]'}`}
              type="button"
              tabIndex={0}
              aria-label="New Task"
              onClick={() => {
                setOpen(true);
                setShowSearchBar(false); // Always hide search bar when clicking plus
                setTimeout(() => { router.push('/dashboard'); }, 100); // Ensure sidebar expands first
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-circle-plus"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                <path d="M9 12h6" />
                <path d="M12 9v6" />
              </svg>
            </button>
            {/* Search button: expands sidebar and shows search bar */}
            <button
              className={`h-5 w-5 flex items-center justify-center my-3 rounded-lg flex-shrink-0 ${state !== 'collapsed' ? 'bg-blue-500 border border-white/45 shadow-[inset_2px_2px_1.2px_rgba(255,255,255,0.03)]' : 'hover:bg-[#EFEDE70D]'}`}
              type="button"
              tabIndex={0}
              aria-label="Search"
              onClick={() => {
                setOpen(true);
                setTimeout(() => { setShowSearchBar(true); }, 100); // Show search bar after expanding
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-search"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                <path d="M21 21l-6 -6" />
              </svg>
            </button>
          </div>
          {/* Footer/Profile */}
          <div>
            <NavUserWithTeams user={user} />
          </div>
        </div>
      ) : (
        <>
          <SidebarHeader className="px-2 py-2">
            <div className="flex flex-row h-[48px] sm:h-[52px] md:h-[56px] items-center w-full transition-all duration-300 ease-in-out">
              <Link href="/dashboard">
                <div className="w-[160px] h-[40px] sm:w-[180px] sm:h-[45px] md:w-[30px] md:h-[30px] flex items-center justify-center transition-all duration-300 ease-in-out">
                  <img src="/full-logo.svg" alt="Logo" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                </div>
              </Link>
              <div className="ml-auto flex items-center gap-1 sm:gap-2 transition-all duration-300 ease-in-out">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger className="h-6 w-6 sm:h-7 sm:w-7 md:h-[24px] md:w-[24px] transition-all duration-300 ease-in-out" />
                  </TooltipTrigger>
                  <TooltipContent>Toggle sidebar (CMD+B)</TooltipContent>
                </Tooltip>
                {isMobile && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setOpenMobile(true)}
                        className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex items-center justify-center rounded-md hover:bg-accent transition-all duration-300 ease-in-out"
                      >
                        <Menu className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 transition-all duration-300 ease-in-out" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Open menu</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            {/* Toggle between search bar and icons */}
            <div className="flex flex-row items-center justify-between w-full mt-4 pt-2 pb-1">
              {showSearchBar ? (
                <div className="flex items-center w-full h-14 bg-[#EFEDE70D] rounded-2xl px-4">
                  <input
                    type="text"
                    placeholder="Search Tasks"
                    className="bg-transparent outline-none text-base flex-1 min-w-0 placeholder:text-[#fff]/60"
                    style={{ border: 'none', color: 'white', fontSize: 18 }}
                  />
                  <button onClick={() => setShowSearchBar(false)} className="ml-2 flex items-center justify-center">
                    <X width={20} height={20} color="#fff" />
                  </button>
                </div>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="h-10 w-10 flex items-center justify-center rounded-full bg-[#F7F7F703] border border-white/45 shadow-[inset_2px_2px_1.2px_rgba(255,255,255,0.03)] transition-all duration-200 relative overflow-hidden" type="button" tabIndex={0} aria-label="New Task" onClick={() => router.push('/dashboard')}>
                        <span
                          style={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0) 100%)',
                            zIndex: 1,
                            mixBlendMode: 'lighten',
                          }}
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="icon icon-tabler icons-tabler-outline icon-tabler-plus"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M12 5l0 14" />
                          <path d="M5 12l14 0" />
                        </svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">New Task</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="h-10 w-10 flex items-center justify-center rounded-full bg-[#F7F7F703] border border-white/45 shadow-[inset_2px_2px_1.2px_rgba(255,255,255,0.03)] transition-all duration-200 relative overflow-hidden" onClick={() => setShowSearchBar(true)}>
                        <span
                          style={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0) 100%)',
                            zIndex: 1,
                            mixBlendMode: 'lighten',
                          }}
                        />
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="icon icon-tabler icons-tabler-outline icon-tabler-search"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                          <path d="M21 21l-6 -6" />
                        </svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Search</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] transition-all duration-300 ease-in-out">
            {/* Remove search bar and New Task button from expanded sidebar */}
            {/* Always render the rest of the sidebar content */}
            {!flagsLoading && marketplaceEnabled && (
              <Link href="/marketplace">
                <SidebarMenuButton className={cn({
                  'bg-accent text-accent-foreground font-medium': pathname === '/marketplace',
                })}>
                  <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 transition-all duration-300 ease-in-out" />
                  <span className="flex items-center justify-between w-full text-sm sm:text-base transition-all duration-300 ease-in-out">
                    Marketplace
                  </span>
                </SidebarMenuButton>
              </Link>
            )}
            {!flagsLoading && customAgentsEnabled && (
              <Link href="/agents">
                <SidebarMenuButton className={cn({
                  'bg-accent text-accent-foreground font-medium': pathname === '/agents',
                })}>
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1 transition-all duration-300 ease-in-out" />
                  <span className="flex items-center justify-between w-full text-sm sm:text-base transition-all duration-300 ease-in-out">
                    Agents
                  </span>
                </SidebarMenuButton>
              </Link>
            )}
            {!flagsLoading && customAgentsEnabled && (
              <Link href="/settings/credentials">
                <SidebarMenuButton className={cn({
                  'bg-accent text-accent-foreground font-medium': pathname === '/settings/credentials',
                })}>
                  <Plug className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1 transition-all duration-300 ease-in-out" />
                  <span className="flex items-center justify-between w-full text-sm sm:text-base transition-all duration-300 ease-in-out">
                    Integrations
                  </span>
                </SidebarMenuButton>
              </Link>
            )}
            <NavAgents />
          </SidebarContent>
          <SidebarFooter>
            <div style={{ marginBottom: 24 }}>
              <TokenUsageCard />
            </div>
            <NavUserWithTeams user={user} />
          </SidebarFooter>
        </>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
