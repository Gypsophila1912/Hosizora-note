import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
//↑ボトムナビを作る関数
import { Ionicons } from "@expo/vector-icons";
import ChatScreen from "@/features/Chat";
import ListScreen from "@/features/List";
import SettingsScreen from "@/features/Settings";

const Tab = createBottomTabNavigator();
//↑タブナビの設計図

export default function AppRoutes() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: "チャット",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{
          tabBarLabel: "一覧",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "設定",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
//タブの名前（内部ID + 表示名）
//color, sizeはいい感じのを渡してくれるらしい
