import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Modal, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation, NavigationProp } from '@react-navigation/native';
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
    points_required?: number;
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
    const [redeemablePromotions, setRedeemablePromotions] = useState<Promotion[]>([]);

    useEffect(() => {
        const loadCustomer = async () => {
            const customerData = await AsyncStorage.getItem('customer');
            if (customerData) {
                setCustomer(JSON.parse(customerData));
            }
        };
        loadCustomer();
    }, [customer]);

    useEffect(() => {
        fetchDiscounts();
        fetchRedeemablePromotions();
    }, []);


    const fetchDiscounts = async () => {
        try {   
            const response = await promotionService.getPromotions();
            const data = handleResponse(response) || [];
            const filteredData = data.filter((promotion: Promotion) => !promotion.code);
            setPromotions(filteredData);
            return filteredData;
        } catch (error) {
            console.log(error);
            setPromotions([]);
        }
    };

    const fetchRedeemablePromotions = async () => {
        try {
            const response = await promotionService.getPromotionByCustomerId(customer?.id || 0);
            const data = handleResponse(response) || [];
            setRedeemablePromotions(data);
        } catch (error) {
            console.log(error);
            setRedeemablePromotions([]);
        }
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
                                    tw`mr-4 bg-white rounded-2xl overflow-hidden shadow-sm`, 
                                    { width: width * 0.75 }
                                ]}
                            >
                                <Image source={{ uri: `${API_CONFIG.BASE_URL}${item.product.image}` }} style={tw`h-48 bg-gray-100`} />
                                <View style={tw`p-4`}>
                                    <View style={tw`flex-row items-center mb-2`}>
                                        <View style={tw`bg-red-100 px-3 py-1 rounded-full`}>
                                            <Text style={tw`text-red-600 font-medium`}>Giảm {item.discount_percentage}%</Text>
                                        </View>
                                    </View>
                                    <Text style={tw`text-base font-bold text-gray-800 mb-1`}>
                                        {item.name}
                                    </Text>
                                    <Text style={tw`text-sm text-gray-500`}>
                                        {item.description}
                                    </Text>
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