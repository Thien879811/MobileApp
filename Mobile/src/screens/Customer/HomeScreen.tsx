import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Modal, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import promotionService from '../../services/promotion.service';
import { handleResponse } from '../../function';
import CustomerService from '../../services/customer.service';
const { width } = Dimensions.get('window');
import { API_CONFIG } from '../../services/config';

type Customer = {
    id: number;
    name: string;
    diem: number;
};

type Product = {
    id: number;
    product_name: string;
    image: string;
    selling_price: number;
};

type Promotion = {
    id: number;
    code: string;
    name: string;
    description: string;
    discount_percentage: number;
    product: Product;
    present?: Product;
    points_required?: number;
    quantity: number;
    max_value: number;
    min_value: number;
    end_date: string;
};

type RootStackParamList = {
    Profile: undefined;
    RedeemPoints: { customer: Customer | null };
    History: undefined;
    Promotions: undefined;
    Orders: undefined;
    Products: undefined;
};

const HomeScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCustomer = async () => {
        try {
            const customerData = await AsyncStorage.getItem('customer');
            if (customerData) {
                const parsedCustomer = JSON.parse(customerData);
                const response = await CustomerService.get(parsedCustomer.id);
                const updatedCustomer = handleResponse(response);
                if (updatedCustomer) {
                    setCustomer(updatedCustomer);
                    await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));
                }
            }
        } catch (error) {
            console.error('Error loading customer:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                try {
                    await loadCustomer();
                    await fetchDiscounts();
                } catch (error) {
                    console.error('Error loading data:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [])
    );

    const fetchDiscounts = async () => {
        try {   
            const response = await promotionService.getPromotions();
            const data = handleResponse(response) || [];
            const filteredData = data.filter((promotion: Promotion) => !promotion.code);
            setPromotions(filteredData);
            return filteredData;
        } catch (error) {
            console.error('Error fetching discounts:', error);
            setPromotions([]);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-white justify-center items-center`}>
                <Text style={tw`text-lg text-gray-600`}>Đang tải...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-white`}>
            <View style={tw`bg-blue-500 px-5 pt-8 pb-6`}>
                <View style={tw`flex-row justify-between items-center`}>
                    <View>
                        <Text style={tw`text-lg text-white`}>Xin chào!</Text>
                        <Text style={tw`text-2xl font-bold text-white mt-1`}>{customer?.name || 'Quý khách'}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[tw`p-3 rounded-full`, {backgroundColor: 'rgba(255,255,255,0.2)'}]}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Icon name="person-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={tw`mt-4 flex-row items-center`}>
                    <Icon name="star" size={24} color="#FFD700" />
                    <Text style={tw`text-white text-lg font-bold ml-2`}>{customer?.diem || 0} điểm</Text>
                    <TouchableOpacity 
                        style={[tw`ml-4 px-4 py-2 rounded-full`, {backgroundColor: 'rgba(255,255,255,0.3)'}]}
                        onPress={() => navigation.navigate('RedeemPoints', { customer })}
                    >
                        <Text style={tw`text-white font-medium`}>Đổi điểm</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={tw`flex-1 -mt-4`}>
                <View style={tw`bg-white rounded-t-3xl px-5 pt-6`}>
                    <Text style={tw`text-xl font-bold mb-4 text-gray-800`}>Dịch vụ của chúng tôi</Text>
                    <View style={tw`flex-row flex-wrap justify-between`}>
                        {[
                            {name: 'Đơn hàng', icon: 'time', iconColor: '#9333EA', bgColor: 'bg-purple-100', screen: 'History'},
                            {name: 'Khuyến mãi', icon: 'gift', iconColor: '#F97316', bgColor: 'bg-yellow-100', screen: 'Promotions'},
                            {name: 'Giỏ hàng', icon: 'cart', iconColor: '#0F766E', bgColor: 'bg-green-100', screen: 'Cart'},
                            {name: 'Sản phẩm', icon: 'cube', iconColor: '#0F766E', bgColor: 'bg-green-100', screen: 'Products'}
                        ].map((service, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[
                                    tw`rounded-2xl p-4 mb-4 border border-gray-100`, 
                                    { width: (width - 60) / 2 }
                                ]}
                                onPress={() => navigation.navigate(service.screen as never)}
                            >
                                <View style={tw`${service.bgColor} w-14 h-14 rounded-full justify-center items-center mb-3`}>
                                    <Icon 
                                        name={service.icon}
                                        size={28} 
                                        color={service.iconColor}
                                    />
                                </View>
                                <Text style={tw`text-base font-medium text-gray-800`}>{service.name}</Text>
                                <Text style={tw`text-sm text-gray-500 mt-1`}>Xem chi tiết</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={tw`px-5 mt-2 pb-6`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <Text style={tw`text-xl font-bold text-gray-800`}>Ưu đãi đặc biệt</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Promotions' as never)}>
                            <Text style={tw`text-blue-500`}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={tw`pr-5`}
                    >
                        {promotions && promotions.length > 0 ? promotions.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={[
                                    tw`mr-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100`, 
                                    { width: width * 0.75 }
                                ]}
                            >
                                <Image 
                                    source={{ uri: `${API_CONFIG.BASE_URL}${item.product.image}` }} 
                                    style={tw`h-48 bg-gray-100`} 
                                />
                                <View style={tw`p-4`}>
                                    <Text style={tw`text-base font-bold text-gray-800 mb-2`}>
                                        {item.name}
                                    </Text>
                                    <Text style={tw`text-gray-600 text-sm mb-2`}>
                                        {item.product.product_name}
                                    </Text>
                                    <View style={tw`mt-2 bg-red-50 self-start rounded-full px-3 py-1`}>
                                        {item.present ? (
                                            <Text style={tw`text-red-600 text-sm font-medium`}>
                                                Giảm {item.discount_percentage}% khi mua {item.present.product_name}
                                            </Text>
                                        ) : (
                                            <Text style={tw`text-red-600 text-sm font-medium`}>
                                                Giảm {item.discount_percentage}%
                                                {item.quantity ? ` khi mua ${item.quantity} sản phẩm chỉ áp dụng khi mua tại cửa hàng` : ''}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={tw`mt-3 flex-row items-center`}>
                                        <Icon name="time-outline" size={16} color="#4B5563" />
                                        <Text style={tw`text-gray-600 text-sm ml-1`}>
                                            HSD: {formatDate(item.end_date)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )) : (
                            <Text style={tw`text-center text-gray-500`}>Không có khuyến mãi nào</Text>
                        )}
                    </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;