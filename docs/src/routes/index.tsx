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
import { 
  dataCreationExample, 
  dataTransformationExample, 
  groupingExample, 
  statisticalTestExample 
} from "./index.examples.ts";
import TidyTsLogo from "../assets/tidy-ts-logo-v2.svg";
// deno-lint-ignore no-explicit-any
export const Route = createFileRoute("/" as any)({
  component: HomeComponent,
});
function HomeComponent() {
  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="container mx-auto max-w-4xl space-y-6 md:space-y-8 relative">
        {/* Hero Section */}
        <div className="relative text-center py-12 sm:py-20">
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
              shows that static typing can prevent 15–38% of production
              bugs<sup className="text-blue-600 dark:text-blue-400">
                <a
                  href="#research-evidence"
                  className="hover:underline"
                  title="Supporting research sources"
                >
                  1,2,3
                </a>
              </sup>. Designed for modern data science workflows.
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
                  Explore on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <DatabaseIcon className="h-6 w-6 text-orange-600" />
                Type-Safe Data Operations
              </CardTitle>
              <CardDescription className="text-base">
                Perform DataFrame operations with full TypeScript support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create, transform, filter, select, and sort data with
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
                Statistical Analysis
              </CardTitle>
              <CardDescription className="text-base">
                A comprehensive toolkit for statistical analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                80+ functions across descriptive statistics, hypothesis testing, and probability distributions. 
                All tests are rigorously validated against results from R.
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
          </div>
        {/* Code Preview Header */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-6 md:p-8 border border-emerald-100 dark:border-emerald-900/30">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              See Tidy-TS in Action
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              A complete data analysis workflow, broken into focused examples
            </p>
          </div>
            </div>

        {/* Code Examples */}
        <div className="space-y-4 -mx-4 md:mx-0">
            <Card className="border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Create DataFrames
                  </CardTitle>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
                  >
                    {/* @ts-ignore TS thinks you need search prop */}
                    <Link 
                      to="/creating-dataframes"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      Learn More <ArrowRightIcon className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Create DataFrames from arrays of objects with automatic type inference
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="[&_pre]:!rounded-none md:[&_pre]:!rounded-md">
                  <CodeBlock
                    title=""
                    description=""
                    code={dataCreationExample}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Transform Data
                  </CardTitle>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
                  >
                    {/* @ts-ignore TS thinks you need search prop */}
                    <Link 
                      to="/transforming-data"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      Learn More <ArrowRightIcon className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Add calculated columns using `mutate()` with access to row values, index, and full DataFrame context
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="[&_pre]:!rounded-none md:[&_pre]:!rounded-md">
                  <CodeBlock
                    title=""
                    description=""
                    code={dataTransformationExample}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Group and Summarize
                  </CardTitle>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
                  >
                    {/* @ts-ignore TS thinks you need search prop */}
                    <Link 
                      to="/grouping-aggregation"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      Learn More <ArrowRightIcon className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Group data by categories and calculate summary statistics with groupBy() and summarize()
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="[&_pre]:!rounded-none md:[&_pre]:!rounded-md">
                  <CodeBlock
                    title=""
                    description=""
                    code={groupingExample}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Statistical Tests
                  </CardTitle>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300"
                  >
                    {/* @ts-ignore TS thinks you need search prop */}
                    <Link 
                      to="/stats-module"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    >
                      Learn More <ArrowRightIcon className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Perform hypothesis testing and correlation analysis using the `stats` module
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="[&_pre]:!rounded-none md:[&_pre]:!rounded-md">
                  <CodeBlock
                    title=""
                    description=""
                    code={statisticalTestExample}
                  />
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Research Evidence Section */}
        <div
          id="research-evidence"
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 md:p-8 border border-blue-100 dark:border-blue-900/30"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Proven Bug Prevention
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Empirical research shows that static typing significantly reduces production bugs
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
        </div>

        {/* Call to Action */}
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to get started?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Start building data analytics workflows with type safety.
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
                Start Building <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
