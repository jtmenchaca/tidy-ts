import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.tsx";
import { CodeBlock } from "./code-block.tsx";
import { cn } from "../../lib/utils.ts";
import NpmLogo from "../../assets/Npm-logo.svg";
import YarnLogo from "../../assets/Yarn-logo-circle.svg";
import PnpmLogo from "../../assets/Pnpm_logo.svg";
import BunLogo from "../../assets/bun-logo.svg";
import DenoLogo from "../../assets/Deno_Logo_2024.svg";

interface CodeTab {
  label: string;
  code: string;
  language?: string;
  icon?: React.ReactNode;
}

interface TabbedCodeBlockProps {
  tabs: CodeTab[];
  defaultTab?: string;
  className?: string;
  title?: string;
  description?: string;
}

const packageManagerIcons: Record<string, React.ReactNode> = {
  npm: <img src={NpmLogo} alt="npm" className="w-4 h-4" />,
  yarn: <img src={YarnLogo} alt="yarn" className="w-4 h-4" />,
  pnpm: <img src={PnpmLogo} alt="pnpm" className="w-4 h-4" />,
  bun: <img src={BunLogo} alt="bun" className="w-4 h-4" />,
  deno: <img src={DenoLogo} alt="deno" className="w-4 h-4" />,
};

export function TabbedCodeBlock({
  tabs,
  defaultTab,
  className,
  title,
  description,
}: TabbedCodeBlockProps) {
  const defaultValue = defaultTab || tabs[0]?.label;

  return (
    <div className={cn("w-full", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
          )}
        </div>
      )}
      <Tabs defaultValue={defaultValue} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-fit">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all cursor-pointer hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <span className="inline-flex items-center justify-center mr-1.5">
                {tab.icon || packageManagerIcons[tab.label.toLowerCase()]}
              </span>
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.label} value={tab.label} className="mt-0">
            <CodeBlock
              code={tab.code}
              language={tab.language || "bash"}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}