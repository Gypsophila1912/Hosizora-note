import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ChatScreen from "@/screens/Chat";
import SettingsScreen from "@/screens/Settings";

const Tab = createBottomTabNavigator();

export default function AppRoutes() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={ChatScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
