import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import promotionService from '../../services/promotion.service';
import { handleResponse } from '../../function';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_CONFIG } from '../../services/config';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

type PromotionScreenProps = {
    navigation: any;
};

type Product = {
    id: number;
    product_name: string;
    image: string;
    selling_price: number;
    quantity: number;
};

type Promotion = {
    id: number;
    name: string;
    discount_percentage: number;
    code?: string;
    product?: Product;
    present?: Product;
    points_required?: number;
    max_value: number;
    min_value: number;
    end_date: string;
    quantity: number;
};

const PromotionScreen = ({ navigation }: PromotionScreenProps) => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [codePromotions, setCodePromotions] = useState<Promotion[]>([]);

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {   
            const response = await promotionService.getPromotions();
            const data = handleResponse(response) || [];
            const withCodes = data.filter((promo: Promotion) => promo.code);
            const withoutCodes = data.filter((promo: Promotion) => !promo.code);
            setCodePromotions(withCodes);
            setPromotions(withoutCodes);
        } catch (error) {
            console.log(error);
            setPromotions([]);
            setCodePromotions([]);
        }
    };

    const formatDate = (date: string) => {
        if (!date) return 'Không có ngày';
        try {
            const d = new Date(date);
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        } catch (error) {
            return 'Ngày không hợp lệ';
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <View style={tw`bg-blue-500 px-4 pt-12 pb-4`}>
                <View style={tw`flex-row items-center`}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={tw`p-2`}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={tw`text-xl font-bold text-white ml-4`}>Khuyến mãi</Text>
                </View>
            </View>

            <ScrollView style={tw`flex-1`}>
                <View style={tw`px-4 py-4`}>
                    {codePromotions.length > 0 && (
                        <View style={tw`mb-6`}>
                            <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>Mã giảm giá</Text>
                            {codePromotions.map((promotion) => (
                                <View 
                                    key={promotion.id}
                                    style={tw`bg-white rounded-lg shadow-md mb-4 overflow-hidden border border-gray-100`}
                                >
                                    <View style={tw`bg-blue-500 p-4`}>
                                        <Text style={tw`text-white font-bold text-lg mb-1`}>VOUCHER XTRA</Text>
                                        <Text style={tw`text-white text-base`}>Giảm {promotion.discount_percentage}%</Text>
                                        <Text style={tw`text-white text-base`}>Mã: {promotion.code}</Text>
                                        <Text style={tw`text-white text-base mt-1`}>
                                            {promotion.quantity > 0 ? `Còn lại: ${promotion.quantity}` : 'Đã hết voucher'}
                                        </Text>
                                    </View>
                                    
                                    <View style={tw`p-4`}>
                                        <View style={tw`flex-row items-center mb-2`}>
                                            <MaterialIcon name="local-offer" size={18} color="#4B5563" />
                                            <Text style={tw`text-gray-600 ml-2`}>
                                                Giảm tối đa {promotion.max_value.toLocaleString()}đ
                                            </Text>
                                        </View>
                                        
                                        <View style={tw`flex-row items-center mb-2`}>
                                            <MaterialIcon name="shopping-cart" size={18} color="#4B5563" />
                                            <Text style={tw`text-gray-600 ml-2`}>
                                                Đơn tối thiểu {promotion.min_value.toLocaleString()}đ
                                            </Text>
                                        </View>
                                        
                                        <View style={tw`flex-row items-center`}>
                                            <MaterialIcon name="event" size={18} color="#4B5563" />
                                            <Text style={tw`text-gray-600 ml-2`}>
                                                Hết hạn: {formatDate(promotion.end_date)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {promotions.length > 0 && (
                        <View>
                            <Text style={tw`text-lg font-bold text-gray-800 mb-3`}>
                                Khuyến mãi trực tiếp
                            </Text>
                            {promotions.map((promotion) => (
                                <View 
                                    key={promotion.id}
                                    style={tw`bg-white rounded-lg p-3 mb-4 shadow-sm border border-gray-100`}
                                >
                                    <View style={tw`flex-row`}>
                                        <Image 
                                            source={{ uri: `${API_CONFIG.BASE_URL}${promotion.product?.image}` }}
                                            style={[tw`rounded-lg`, { width: 90, height: 90 }]}
                                        />
                                        <View style={tw`flex-1 ml-3`}>
                                            <Text style={tw`text-base font-bold text-gray-800`}>
                                                {promotion.name}
                                            </Text>
                                            <Text style={tw`text-gray-600 text-sm mt-1`}>
                                                {promotion.product?.product_name}
                                            </Text>
                                            <View style={tw`mt-2 bg-red-50 self-start rounded-full px-3 py-1`}>
                                                {promotion.present ? (
                                                    <Text style={tw`text-red-600 text-sm font-medium`}>
                                                        Giảm {promotion.discount_percentage}% khi mua {promotion.present.product_name}
                                                    </Text>
                                                ) : (
                                                    <Text style={tw`text-red-600 text-sm font-medium`}>
                                                        {promotion.quantity ? 
                                                            `Giảm ${promotion.discount_percentage}% khi mua ${promotion.quantity} sản phẩm chỉ áp dụng khi mua tại cửa hàng` :
                                                            `Giảm ${promotion.discount_percentage}%`
                                                        }
                                                    </Text>
                                                )}
                                            </View>
                                            <View style={tw`mt-2 flex-row items-center`}>
                                                <Icon name="time-outline" size={16} color="#4B5563" />
                                                <Text style={tw`text-gray-600 text-sm ml-1`}>
                                                    HSD: {formatDate(promotion.end_date)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {promotions.length === 0 && codePromotions.length === 0 && (
                        <View style={tw`items-center py-12`}>
                            <Icon name="gift-outline" size={60} color="#9CA3AF" />
                            <Text style={tw`text-gray-500 mt-4 text-base`}>
                                Chưa có khuyến mãi nào
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PromotionScreen;