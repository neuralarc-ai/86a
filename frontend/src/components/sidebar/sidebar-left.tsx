'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Menu, Store, Plus, Zap, Plug } from 'lucide-react';

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

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });

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
      className={`border-r-0 bg-[var(--sidebar)] backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] max-w-full sm:max-w-full transition-all duration-300 ease-in-out ${state === 'collapsed' ? 'w-[100px] sm:w-[100px] md:w-[100px]' : 'w-[280px] sm:w-[320px] md:w-[349px]'}`}
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
          <div className="flex flex-col items-center gap-6 flex-1">
            <SidebarTrigger className="h-5 w-5 my-3 flex-shrink-0" />
            <button
              className="h-5 w-5 flex items-center justify-center my-3 rounded-lg hover:bg-[#EFEDE70D] flex-shrink-0"
              onClick={() => setOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
            <button className="h-5 w-5 flex items-center justify-center my-3 rounded-lg hover:bg-[#EFEDE70D] flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
          </div>
          {/* Footer/Profile */}
          <div >
            <NavUserWithTeams user={user} />
          </div>
        </div>
      ) : (
        <>
          <SidebarHeader className="px-2 py-2">
            <div className="flex flex-row h-[48px] sm:h-[52px] md:h-[56px] items-center w-full transition-all duration-300 ease-in-out">
              <Link href="/dashboard">
                <div className="w-[40px] h-[30px] sm:w-[43px] sm:h-[32px] md:w-[46px] md:h-[35px] flex items-center justify-center transition-all duration-300 ease-in-out">
                  <KortixLogo />
                </div>
              </Link>
              <div className="ml-auto flex items-center gap-1 sm:gap-2 transition-all duration-300 ease-in-out">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 transition-all duration-300 ease-in-out" />
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
          </SidebarHeader>
          <SidebarContent className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] transition-all duration-300 ease-in-out">
            {/* Only render search bar and New Task button when expanded */}
            {state !== 'collapsed' && (
              <>
                {/* Search bar */}
                <div
                  className="flex items-center bg-[#EFEDE70D] h-12 sm:h-13 md:h-14 min-w-[120px] sm:min-w-[128px] justify-between rounded-2xl px-3 sm:px-4 opacity-100 transition-all duration-300 ease-in-out"
                >
                  <input
                    type="text"
                    placeholder="Search Tasks"
                    className="bg-transparent outline-none text-base sm:text-lg flex-1 placeholder:text-[#fff]/60 transition-all duration-300 ease-in-out"
                    style={{ border: 'none', color: 'white', fontSize: 16 }}
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
                    className="icon icon-tabler icons-tabler-outline icon-tabler-search ml-2 transition-all duration-300 ease-in-out"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                    <path d="M21 21l-6 -6" />
                  </svg>
                </div>
                <SidebarGroup>
                  <Link href="/dashboard">
                    <SidebarMenuButton
                      className="h-9 sm:h-10 md:h-11 min-w-[90px] sm:min-w-[100px] opacity-100 rounded border border-[#FFFFFF33] bg-[#FFFFFF14] flex items-center justify-center text-base sm:text-lg font-medium text-[#fff] transition-all duration-300 ease-in-out"
                    >
                      <span className="mr-2 transition-all duration-300 ease-in-out">New Task</span>
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
                        className="icon icon-tabler icons-tabler-outline icon-tabler-plus transition-all duration-300 ease-in-out"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M12 5l0 14" />
                        <path d="M5 12l14 0" />
                      </svg>
                    </SidebarMenuButton>
                  </Link>
                </SidebarGroup>
              </>
            )}
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
            <NavUserWithTeams user={user} />
          </SidebarFooter>
        </>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
