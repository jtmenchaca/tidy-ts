import { Link } from "@tanstack/react-router";
import {
  BarChartIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  DatabaseIcon,
  HomeIcon,
} from "lucide-react";
import TidyTsLogo from "../../assets/tidy-ts-logo-v2.svg";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../ui/sidebar.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible.tsx";
import { useState } from "react";

interface AppSidebarProps {
  variant?: "sidebar" | "inset";
  className?: string;
}

export function AppSidebar({ variant = "sidebar", ...props }: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "core-operations": true,
    "advanced-operations": true,
    "advanced-features": true,
    "examples": true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Function to handle navigation with scroll to top and close mobile sidebar
  const handleNavigation = () => {
    // Close mobile sidebar if on mobile
    if (isMobile) {
      setOpenMobile(false);
    }
    // Scroll to top immediately, then again after a short delay to ensure it works
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const navigationData = [
    {
      id: "core-operations",
      title: "Core Operations",
      icon: DatabaseIcon,
      items: [
        { name: "Creating DataFrames", path: "/creating-dataframes" },
        { name: "Data I/O Operations", path: "/data-io" },
        { name: "DataFrame Basics", path: "/dataframe-basics" },
        { name: "Transforming Data", path: "/transforming-data" },
        { name: "Filtering Rows", path: "/filtering-rows" },
        { name: "Selecting Columns", path: "/selecting-columns" },
        { name: "Sorting & Arranging", path: "/sorting-arranging" },
        { name: "Async Operations", path: "/async-operations" },
      ],
    },
    {
      id: "advanced-operations",
      title: "Advanced Operations",
      icon: BarChartIcon,
      items: [
        {
          name: "Grouping & Aggregation",
          path: "/grouping-aggregation",
        },
        { name: "Joining DataFrames", path: "/joining-dataframes" },
        { name: "Reshaping Data", path: "/reshaping-data" },
        { name: "Missing Data Handling", path: "/missing-data" },
        { name: "Stats Module", path: "/stats-module" },
      ],
    },
    {
      id: "advanced-features",
      title: "Advanced Features",
      icon: CodeIcon,
      items: [
        {
          name: "Combining DataFrames",
          path: "/combining-dataframes",
        },
        { name: "Transposing Data", path: "/transposing-data" },
        {
          name: "Performance Benchmarks",
          path: "/performance-benchmarks",
        },
      ],
    },
    {
      id: "examples",
      title: "Examples & Tutorials",
      icon: CodeIcon,
      items: [
        {
          name: "Comprehensive Workflows",
          path: "/examples/comprehensive-workflows",
        },
        {
          name: "Jupyter Notebooks",
          path: "/examples/jupyter-notebooks",
        },
      ],
    },
  ];

  return (
    <Sidebar
      className="border-r bg-white dark:bg-gray-900"
      variant={variant}
      {...props}
    >
      <SidebarHeader className="p-4 border-b dark:border-gray-800">
        {/* @ts-ignore TS thinks you need search prop */}
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          onClick={handleNavigation}
        >
          <img 
            src={TidyTsLogo} 
            alt="Tidy-TS Logo" 
            className="h-10 w-10"
          />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tidy-TS
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Home Link */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {/* @ts-ignore TS thinks you need search prop */}
                <Link to="/" className="flex items-center gap-2" onClick={handleNavigation}>
                  <HomeIcon className="h-4 w-4" />
                  Home
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                {/* @ts-ignore TS thinks you need search prop */}
                <Link
                  to="/getting-started"
                  className="flex items-center gap-2"
                  onClick={handleNavigation}
                >
                  <BookOpenIcon className="h-4 w-4" />
                  Getting Started
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Navigation Sections */}
        {navigationData.map((section, index) => (
          <SidebarGroup
            key={section.id}
            className={index === navigationData.length - 1 ? "mb-26" : ""}
          >
            <Collapsible
              open={openSections[section.id] ?? false}
              onOpenChange={() => toggleSection(section.id)}
            >
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                  <section.icon className="h-4 w-4" />
                  {section.title}
                  {openSections[section.id]
                    ? <ChevronDownIcon className="h-4 w-4 ml-auto" />
                    : <ChevronRightIcon className="h-4 w-4 ml-auto" />}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenuSub>
                    {section.items.map((item) => (
                      <SidebarMenuSubItem key={item.path}>
                        <SidebarMenuSubButton asChild>
                          <Link
                            // deno-lint-ignore no-explicit-any
                            to={item.path as any}
                            className="text-sm"
                            onClick={handleNavigation}
                          >
                            {item.name}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
