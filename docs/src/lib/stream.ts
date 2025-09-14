// import {
//   experimental_streamedQuery as streamedQuery,
//   queryOptions,
// } from "@tanstack/react-query";
// import { hc } from "hono/client";
// import type { AppType } from "../../../backend/src/app.ts";

// // Specify the environment type when creating the client
// const client = hc<AppType>("/");

// // Types for streaming events
// export type StreamEvent =
//   | { type: "tool_start"; toolName: string }
//   | { type: "tool_complete"; toolName: string }
//   | { type: "text"; content: string }
//   | {
//     type: "tool_approval_required";
//     approvalData: { toolName: string; approvalId: string };
//   }
//   | { type: "complete" }
//   | {
//     type: "guardrail_triggered";
//     reasoning: string;
//     kindResponseToUser: string;
//   }
//   | { type: "text_delta"; delta: string }
//   | { type: "chat_created"; chatId: string };

// export const chatQueryOptions = (
//   messages: Array<{ role: "user" | "assistant"; content: string }>,
//   chatId: string,
// ) =>
//   queryOptions({
//     queryKey: ["chat", messages, chatId],
//     queryFn: streamedQuery({
//       queryFn: async () => {
//         // For new chats, don't send a chatId to let the backend create one
//         const requestBody = {
//           messages,
//           ...(chatId !== "new" && { chatId }),
//         };

//         const response = await client.sse.$post({
//           json: requestBody,
//         });

//         if (!response.ok) {
//           throw new Error("Failed to fetch chat response");
//         }

//         const reader = response.body?.getReader();
//         const decoder = new TextDecoder();

//         return {
//           async *[Symbol.asyncIterator](): AsyncGenerator<StreamEvent> {
//             if (!reader) return;

//             let buffer = "";
//             while (true) {
//               const { done, value } = await reader.read();
//               if (done) break;

//               buffer += decoder.decode(value, { stream: true });

//               // Parse SSE events
//               const lines = buffer.split("\n");
//               buffer = lines.pop() || ""; // Keep incomplete line in buffer

//               let currentEvent = "";
//               let currentData = "";

//               for (const line of lines) {
//                 //console.log("📡 SSE line received:", line);
//                 if (line.startsWith("event: ")) {
//                   currentEvent = line.slice(7);
//                   //console.log("📡 SSE event type:", currentEvent);
//                 } else if (line.startsWith("data: ")) {
//                   currentData = line.slice(6);
//                   // console.log("📡 SSE data:", currentData);
//                 } else if (line.trim() === "" && currentEvent && currentData) {
//                   // Complete SSE event received
//                   //console.log("📡 Complete SSE event received:", {
//                   //  currentEvent,
//                   //  currentData,
//                   //});
//                   try {
//                     const eventData = JSON.parse(currentData);

//                     // Yield structured events
//                     if (currentEvent === "tool_start") {
//                       yield {
//                         type: "tool_start",
//                         toolName: eventData.toolName,
//                       };
//                     } else if (currentEvent === "tool_complete") {
//                       yield {
//                         type: "tool_complete",
//                         toolName: eventData.toolName,
//                       };
//                     } else if (currentEvent === "text_delta") {
//                       yield { type: "text", content: eventData.delta };
//                     } else if (currentEvent === "guardrail_triggered") {
//                       yield {
//                         type: "guardrail_triggered",
//                         reasoning: eventData.reasoning,
//                         kindResponseToUser: eventData.kindResponseToUser,
//                       };
//                     } else if (currentEvent === "tool_approval_required") {
//                       yield {
//                         type: "tool_approval_required",
//                         approvalData: eventData.approvalData,
//                       };
//                     } else if (currentEvent === "chat_created") {
//                       yield { type: "chat_created", chatId: eventData.chatId };
//                     } else if (currentEvent === "complete") {
//                       yield { type: "complete" };
//                     }
//                   } catch (error) {
//                     console.warn("Failed to parse SSE event:", error);
//                   }

//                   // Reset for next event
//                   currentEvent = "";
//                   currentData = "";
//                 }
//               }
//             }
//           },
//         };
//       },
//     }),
//     staleTime: Infinity,
//   });
