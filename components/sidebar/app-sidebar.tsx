"use client";

import {
  ChevronRight,
  Home,
  User as UserIcon,
  Newspaper,
  PenTool,
  LayoutDashboard,
} from "lucide-react"; // Exemple d'icônes
import { usePathname } from "next/navigation"; // Import du hook pour récupérer l'URL actuelle

import { User as UserType } from "@/types/user"; // Import du type User

import { NavUser } from "@/components/sidebar/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuSub,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard, // Icône pour cette page
      items: [], // Pas de sous-items, lien direct
    },
    {
      title: "Accueil",
      url: "#",
      icon: Home, // Icône pour cette page
      items: [
        {
          title: "Général",
          url: "/accueil/general",
        },
        {
          title: "FAQ",
          url: "/accueil/faq",
        },
        {
          title: "Témoignages",
          url: "/accueil/temoignages",
        },
      ],
    },
    {
      title: "À propos",
      url: "#",
      icon: UserIcon, // Icône pour cette page
      items: [
        {
          title: "Général",
          url: "/a-propos/general",
        },
        {
          title: "Outils",
          url: "/a-propos/outils",
        },
      ],
    },
    {
      title: "Journal personnel",
      url: "/journal-personnel",
      icon: Newspaper, // Icône pour cette page
      items: [], // Pas de sous-items, lien direct
    },
    {
      title: "Créations",
      url: "#",
      icon: PenTool, // Icône pour cette section
      items: [
        {
          title: "Vidéos",
          url: "/creations/videos",
        },
        {
          title: "Photos",
          url: "/creations/photos",
        },
        {
          title: "Autres",
          url: "/creations/autres",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserType }) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-lg font-bold">ArnaudGct</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {data.navMain.map((item) =>
          item.items && item.items.length > 0 ? (
            // Section avec collapsible
            <Collapsible
              key={item.title}
              title={item.title}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <CollapsibleTrigger>
                    {item.icon && <item.icon className="mr-2" />}
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuItem key={subItem.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === subItem.url} // Vérifie si l'URL actuelle correspond
                            >
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ) : (
            // Section sans sous-items (lien direct)
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel
                asChild
                className={`text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                  pathname === item.url
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }`} // Ajoute une classe si l'URL correspond
              >
                <a href={item.url}>
                  {item.icon && <item.icon className="mr-2" />}
                  {item.title}
                </a>
              </SidebarGroupLabel>
            </SidebarGroup>
          )
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
