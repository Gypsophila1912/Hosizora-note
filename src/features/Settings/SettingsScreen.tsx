import { Text, View, Button } from "react-native";
import { styles } from "./styles";
import { getGreeting } from "./helper";

export default function SettingScreen() {
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{greeting}</Text>
      <Button title="押してみて" onPress={() => console.log("clicked")} />
    </View>
  );
}
