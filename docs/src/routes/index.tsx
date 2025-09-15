import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { CodeBlock } from "../components/ui/code-block.tsx";
import {
  ArrowRightIcon,
  BarChartIcon,
  DatabaseIcon,
  GithubIcon,
  ShieldIcon,
} from "lucide-react";
import { starWarsExample } from "./index.example.ts";
import TidyTsLogo from "../assets/tidy-ts-logo.svg";
// deno-lint-ignore no-explicit-any
export const Route = createFileRoute("/" as any)({
  component: HomeComponent,
});
function HomeComponent() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="container mx-auto max-w-4xl space-y-6 md:space-y-8 relative">
        {/* Hero Section */}
        <section className="relative text-center py-12 sm:py-20">
          {/* Large background logo */}
          <div className="absolute -left-25 -top-30 opacity-4 dark:opacity-10 pointer-events-none">
            <img 
              src={TidyTsLogo} 
              alt="" 
              className="w-96 h-96 sm:w-[600px] sm:h-[600px] md:w-[600px] md:h-[600px] lg:w-[600px] lg:h-[600px] xl:w-[600px] xl:h-[600px]"
            />
          </div>
          
          <div className="relative z-10">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-orange-600 mb-6">
              Tidy-TS
            </h1>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 leading-tight">
              Data analytics framework
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Type-safe data analytics and statistics in TypeScript. Research
              shows static typing prevents 15-38% of production
              bugs<sup className="text-blue-600 dark:text-blue-400">
                <a
                  href="#research-evidence"
                  className="hover:underline"
                  title="View research details and sources"
                >
                  1,2,3
                </a>
              </sup>. Built for modern data science workflows.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 px-8 py-3 text-lg font-semibold rounded-lg"
              >
                <a
                  href="https://github.com/jtmenchaca/tidy-ts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <GithubIcon className="h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>
        {/* Key Features */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <DatabaseIcon className="h-6 w-6 text-orange-600" />
                Type-Safe Data Operations
              </CardTitle>
              <CardDescription className="text-base">
                Essential DataFrame operations with full TypeScript support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create, transform, filter, select, and sort data with intuitive
                chaining and automatic column typing for compile-time safety.
              </p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:text-orange-700"
              >
                {/* @ts-ignore TS thinks you need search prop */}
                <Link to="/creating-dataframes">
                  Learn More <ArrowRightIcon className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <BarChartIcon className="h-6 w-6 text-orange-600" />
                Advanced Analytics
              </CardTitle>
              <CardDescription className="text-base">
                80+ statistical functions including probability distributions and hypothesis testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Complete statistical analysis with descriptive statistics, 16 probability distributions (DPQR functions), 
                and comprehensive hypothesis testing rigorously tested against R. 
              </p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-orange-600 hover:text-orange-700"
              >
                {/* @ts-ignore TS thinks you need search prop */}
                <Link to="/stats-module">
                  Learn More <ArrowRightIcon className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
        {/* Code Preview */}
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-6 md:p-8 border border-orange-100 dark:border-orange-900/30">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              See Tidy-TS in Action
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Complete data analysis workflow in just a few lines
            </p>
          </div>
          <CodeBlock
            title=""
            description=""
            code={starWarsExample}
          />
        </section>

        {/* Research Evidence Section */}
        <section
          id="research-evidence"
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 md:p-8 border border-blue-100 dark:border-blue-900/30"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Proven Bug Prevention
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Empirical research shows static typing prevents significant bugs
              in production
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                15%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                GitHub Bug Fixes Preventable
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <a
                  href="https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Gao et al. (2017) - JavaScript/TypeScript study
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                38%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Production Bugs Preventable
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <a
                  href="https://www.youtube.com/watch?v=P-J9Eg7hJwE&feature=youtu.be&t=702"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Airbnb TypeScript migration case study
                </a>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                15%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Python Defects Preventable
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <a
                  href="https://rebels.cs.uwaterloo.ca/papers/tse2021_khan.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Khan et al. (2021) - 210 open-source projects
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <ShieldIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Research-Backed Type Safety
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Evidence suggests that static typing prevents 15-38% of bugs
                  that would otherwise reach production. These are conservative
                  estimates focusing on publicly visible, type-related defects.
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>
                    <strong>Note:</strong>{" "}
                    These figures represent lower bounds, excluding pre-commit
                    logic issues and data validation bugs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to get started?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join developers who are building better data analytics with type
            safety and modern tooling.
          </p>
          <div className="flex justify-center">
            <Button
              asChild
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-semibold rounded-lg"
            >
              {/* @ts-ignore TS thinks you need search prop */}
              <Link 
                to="/getting-started"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Get Started <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
