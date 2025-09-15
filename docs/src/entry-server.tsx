// import { createMemoryHistory, createRouter } from '@tanstack/react-router'
// import { routeTree } from './routeTree.gen'
// import { StartServer } from '@tanstack/start/server'
// import type { AnyRouter } from '@tanstack/react-router'

// export function render({ url }: { url: string }) {
//   const memoryHistory = createMemoryHistory({
//     initialEntries: [url],
//   })

//   const router = createRouter({
//     routeTree,
//     history: memoryHistory,
//     basepath: '/tidy-ts',
//   }) as AnyRouter

//   return StartServer({ router })
// }