import { eventBus } from "@/shared/eventBus";
import { useChatStore } from "./useChatStore";

// イベント購読
eventBus.on("messageAdded", (msg) => {
  useChatStore.getState().addMessage(msg.text);
});
