// import { createFileRoute } from "@tanstack/react-router";
// import { DocPageLayout } from "../components/layout/DocPageLayout";

// export const Route = createFileRoute("/coverage")({
//   component: CoverageReport,
// });

// function CoverageReport() {
//   return (
//     <DocPageLayout title="Test Coverage Report">
//       <div className="flex-1 p-8 overflow-hidden">
//         <div className="max-w-full h-full">
//           <div className="mb-6">
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
//               Test Coverage Report
//             </h1>
//             <p className="text-lg text-gray-600 dark:text-gray-400">
//               Detailed line-by-line test coverage for the tidy-ts codebase.
//             </p>
//           </div>
          
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-[calc(100vh-200px)]">
//             <iframe
//               src="/tidy-ts/coverage/index.html"
//               className="w-full h-full"
//               title="Test Coverage Report"
//               sandbox="allow-scripts allow-same-origin"
//             />
//           </div>
//         </div>
//       </div>
//     </DocPageLayout>
//   );
// }