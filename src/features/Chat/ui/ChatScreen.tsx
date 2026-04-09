// src/features/chat/ui/ChatScreen.tsx
import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useChatStore } from "../store/useChatStore";
import { eventBus } from "@/shared/eventBus";
import styles from "./styles";

export default function ChatScreen() {
  const [input, setInput] = useState("");

  return (
    <View style={styles.container}>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="メッセージ入力"
        style={styles.input}
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? "#0953a1" : "#007bff" },
        ]}
        onPress={() => {
          eventBus.emit("messageAdded", { text: input });
          setInput("");
        }}
      >
        <Text style={styles.buttonText}>メッセージ追加</Text>
      </Pressable>

      {useChatStore.getState().messages.map((msg) => (
        <Text key={msg.id}>{msg.text}</Text>
      ))}
    </View>
  );
}
