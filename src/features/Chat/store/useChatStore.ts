import { create } from "zustand";

export type Message = {
  id: number;
  text: string;
};

type ChatState = {
  messages: Message[];
  addMessage: (text: string) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],

  addMessage: (text) =>
    set((state) => ({
      messages: [
        {
          id: Date.now(),
          text,
        },
        ...state.messages,
      ],
    })),
}));
//↑const [a,Seta] = useState(0);と同じことをやってる
