import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { customerLogout } from '../../redux/reducers/customerReducers';
import { RootState } from '../../redux/store';
import { useEffect } from 'react';

type Customer = {
    id: number;
    name: string;
    phone: string;
    diem: number;
};

const ProfileScreen = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [showSettings, setShowSettings] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const handleLogout = async () => {
        await AsyncStorage.removeItem('customer');
        dispatch(customerLogout());
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }]
            })
        );
    };

    useEffect(() => {
        const loadCustomer = async () => {
            const customerData = await AsyncStorage.getItem('customer');
            if (customerData) {
                setCustomer(JSON.parse(customerData));
            }
        };
        loadCustomer();
    }, [customer]);

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <View style={tw`bg-blue-500 px-5 pt-12 pb-8`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={tw`p-2`}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={tw`text-xl font-bold text-white`}>Hồ sơ</Text>
                    <View style={tw`w-8`} />
                </View>
            </View>

            <ScrollView style={tw`flex-1 -mt-4`}>
                <View style={tw`bg-white rounded-t-3xl px-5 pt-6`}>
                    <View style={tw`items-center mb-6`}>
                        <View style={tw`w-20 h-20 bg-gray-200 rounded-full justify-center items-center mb-3`}>
                            <Icon name="person" size={40} color="#666" />
                        </View>
                        <Text style={tw`text-xl font-bold text-gray-800`}>{customer?.name || 'Khách hàng'}</Text>
                        <Text style={tw`text-gray-500 mt-1`}>{customer?.phone || ''}</Text>
                    </View>

                    <View style={tw`bg-blue-50 rounded-xl p-4 mb-6`}>
                        <View style={tw`flex-row items-center`}>
                            <Icon name="star" size={24} color="#FFD700" />
                            <Text style={tw`text-lg font-bold ml-2`}>{customer?.diem || 0} điểm</Text>
                        </View>
                        <Text style={tw`text-gray-600 mt-2`}>Tích điểm để nhận thêm ưu đãi</Text>
                    </View>

                    {[
                        {icon: 'time-outline', title: 'Lịch sử giao dịch', onPress: () => navigation.navigate('History' as never)},
                        {icon: 'gift-outline', title: 'Ví Voucher', onPress: () => navigation.navigate('VoucherScreen' as never)},
                        {icon: 'settings-outline', title: 'Cài đặt', onPress: () => setShowSettings(!showSettings)},
                        {icon: 'log-out-outline', title: 'Đăng xuất', onPress: handleLogout, color: '#EF4444'},
                    ].map((item, index) => (
                        <View key={index}>
                            <TouchableOpacity 
                                style={tw`flex-row items-center py-4 border-b border-gray-100`}
                                onPress={item.onPress}
                            >
                                <Icon name={item.icon} size={24} color={item.color || '#666'} />
                                <Text style={[tw`flex-1 text-lg ml-4`, {color: item.color || '#1F2937'}]}>{item.title}</Text>
                                <Icon name="chevron-forward" size={20} color={item.color || '#666'} />
                            </TouchableOpacity>
                            {showSettings && item.title === 'Cài đặt' && (
                                <TouchableOpacity 
                                    style={tw`flex-row items-center py-4 pl-12 border-b border-gray-100 bg-gray-50`}
                                    onPress={() => navigation.navigate('ChangePassword' as never)}
                                >
                                    <Icon name="swap-horizontal-outline" size={20} color="#666" />
                                    <Text style={tw`flex-1 text-base ml-4 text-gray-700`}>Đổi mật khẩu</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
