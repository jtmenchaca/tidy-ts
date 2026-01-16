import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "../ui/button.tsx";
import { Card, CardContent } from "../ui/card.tsx";

interface NavigationItem {
  title: string;
  path: string;
  description?: string;
}

interface DocNavigationProps {
  currentPath: string;
  className?: string;
}

// Define the logical progression through the documentation
const navigationFlow: NavigationItem[] = [
  {
    title: "Getting Started",
    path: "/getting-started",
    description: "Installation, quick start, and basic DataFrame concepts",
  },
  {
    title: "Creating DataFrames",
    path: "/creating-dataframes",
    description: "Learn to create DataFrames from various sources",
  },
  {
    title: "DataFrame Basics",
    path: "/dataframe-basics",
    description: "DataFrame properties, column access, and TypeScript integration",
  },
  {
    title: "Transforming Data",
    path: "/transforming-data",
    description: "Add calculated columns with mutate()",
  },
  {
    title: "Filtering Rows",
    path: "/filtering-rows",
    description: "Filter data based on conditions",
  },
  {
    title: "Selecting Columns",
    path: "/selecting-columns",
    description: "Choose specific columns to work with",
  },
  {
    title: "Sorting & Arranging",
    path: "/sorting-arranging",
    description: "Sort and arrange your data",
  },
  {
    title: "Column Access & Extract",
    path: "/column-access",
    description: "Access and extract data from columns",
  },
  {
    title: "Grouping & Aggregation",
    path: "/grouping-aggregation",
    description: "Group data and calculate summaries",
  },
  {
    title: "Joining DataFrames",
    path: "/joining-dataframes",
    description: "Combine data from multiple sources",
  },
  {
    title: "Reshaping Data",
    path: "/reshaping-data",
    description: "Pivot and reshape your data",
  },
  {
    title: "Missing Data Handling",
    path: "/missing-data",
    description: "Handle missing values effectively",
  },
  {
    title: "Stats Module",
    path: "/stats-module",
    description: "Comprehensive statistical functions",
  },
  {
    title: "Comprehensive Workflows",
    path: "/examples/comprehensive-workflows",
    description: "Real-world data analysis examples",
  },
  {
    title: "Jupyter Notebooks",
    path: "/examples/jupyter-notebooks",
    description: "Interactive data analysis with Deno Jupyter",
  },
];

export function DocNavigation(
  { currentPath, className = "" }: DocNavigationProps,
) {
  const currentIndex = navigationFlow.findIndex((item) =>
    item.path === currentPath
  );

  // Function to handle navigation with scroll to top
  const handleNavigation = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Don't show navigation if current path is not in the flow
  if (currentIndex === -1) {
    return null;
  }

  const previousItem = currentIndex > 0
    ? navigationFlow[currentIndex - 1]
    : null;
  const nextItem = currentIndex < navigationFlow.length - 1
    ? navigationFlow[currentIndex + 1]
    : null;

  // Don't show navigation if there's no previous or next item
  if (!previousItem && !nextItem) {
    return null;
  }

  return (
    <div className={`mt-8 md:mt-12 ${className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {/* Previous Page */}
        {previousItem && (
          <Card className="flex-1 min-w-0">
            <CardContent className="p-3 md:p-4">
              <Link to={previousItem.path as any} onClick={handleNavigation} className="cursor-pointer">
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-2 md:p-3 min-w-0"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full">
                    <ChevronLeftIcon className="h-4 w-4 flex-shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-muted-foreground mb-1">
                        Previous
                      </div>
                      <div className="font-medium text-sm md:text-base truncate">
                        {previousItem.title}
                      </div>
                      {previousItem.description && (
                        <div className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 hidden sm:block">
                          {previousItem.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Next Page */}
        {nextItem && (
          <Card className="flex-1 min-w-0">
            <CardContent className="p-3 md:p-4">
              <Link to={nextItem.path as any} onClick={handleNavigation} className="cursor-pointer">
                <Button
                  variant="outline"
                  className="w-full justify-end h-auto p-2 md:p-3 min-w-0"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full">
                    <div className="text-right min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-muted-foreground mb-1">
                        Next
                      </div>
                      <div className="font-medium text-sm md:text-base truncate">
                        {nextItem.title}
                      </div>
                      {nextItem.description && (
                        <div className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 hidden sm:block">
                          {nextItem.description}
                        </div>
                      )}
                    </div>
                    <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
