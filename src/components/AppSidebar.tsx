import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Target, 
  FileText, 
  Timer,
  Sparkles,
  LogOut,
  User,
  BarChart3
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Daily Planner', url: '/planner', icon: Calendar },
  { title: 'Habits', url: '/habits', icon: Target },
  { title: 'Notes', url: '/notes', icon: FileText },
  { title: 'Pomodoro', url: '/pomodoro', icon: Timer },
  { title: 'AI Suggestions', url: '/ai', icon: Sparkles },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Profile', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent className="glass-card border-r border-white/20">
        <div className="flex h-16 items-center justify-center border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">FocusFlow</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent className="px-2 py-4">
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/50"
                      activeClassName="bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto border-t border-white/10 p-4">
          <Button
            onClick={() => signOut()}
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-white/50"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}