import { createStackNavigator } from "@react-navigation/stack";
import AttendanceScreen from "../screens/Employee/AttendanceScreen";
import AttendanceDetailScreen from "../screens/Employee/AttendanceDetailScreen";
import Icon from 'react-native-vector-icons/Ionicons';
import tw from 'tailwind-react-native-classnames';

const Stack = createStackNavigator();

const AttendanceNavigation = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ headerShown: false }} />
            <Stack.Screen 
                name='AttendanceDetail' 
                component={AttendanceDetailScreen} 
                options={{ headerShown: false }}
            />          
        </Stack.Navigator>
    );
};

export default AttendanceNavigation;