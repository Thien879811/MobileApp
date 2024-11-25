import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import promotionService from '../../services/promotion.service';
import { handleResponse } from '../../function';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_CONFIG } from '../../services/config';

const { width } = Dimensions.get('window');

type PromotionScreenProps = {
    navigation: any;
};

type Product = {
    id: number;
    product_name: string;
    image: string;
};

type Promotion = {
    id: number;
    name: string;
    discount_percentage: number;
    code?: string;
    product?: Product;
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
                    <Text style={tw`text-xl font-bold text-white`}>Khuyến mãi</Text>
                    <View style={tw`w-8`} />
                </View>
            </View>

            <ScrollView style={tw`flex-1 -mt-4`}>
                <View style={tw`bg-white rounded-t-3xl px-5 pt-6`}>
                    {/* Promotions with codes */}
                    {codePromotions.length > 0 && (
                        <>
                            <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Mã giảm giá</Text>
                            {codePromotions.map((promotion) => (
                                <View 
                                    key={promotion.id}
                                    style={[
                                        tw`bg-white rounded-xl p-4 mb-4 shadow-sm`,
                                        { borderWidth: 1, borderColor: '#f0f0f0' }
                                    ]}
                                >
                                    <View style={tw`flex-row justify-between items-center`}>
                                        <View>
                                            <Text style={tw`text-lg font-bold text-gray-800`}>
                                                {promotion.name}
                                            </Text>
                                            <View style={tw`mt-2 bg-blue-100 self-start rounded-full px-3 py-1`}>
                                                <Text style={tw`text-blue-600 font-bold`}>
                                                    Mã: {promotion.code}
                                                </Text>
                                            </View>
                                            <View style={tw`mt-2 bg-red-100 self-start rounded-full px-3 py-1`}>
                                                <Text style={tw`text-red-600 font-bold`}>
                                                    Giảm {promotion.discount_percentage}%
                                                </Text>
                                            </View>
                                        </View>
                                        <Icon name="ticket-outline" size={40} color="#3B82F6" />
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {/* Regular promotions */}
                    {promotions.length > 0 && (
                        <>
                            <Text style={tw`text-lg font-bold text-gray-800 mb-4 ${codePromotions.length > 0 ? 'mt-4' : ''}`}>
                                Khuyến mãi trực tiếp
                            </Text>
                            {promotions.map((promotion) => (
                                <View 
                                    key={promotion.id}
                                    style={[
                                        tw`bg-white rounded-xl p-4 mb-4 shadow-sm`,
                                        { borderWidth: 1, borderColor: '#f0f0f0' }
                                    ]}
                                >
                                    <View style={tw`flex-row`}>
                                        <Image 
                                            source={{ uri: `${API_CONFIG.BASE_URL}${promotion.product?.image}` }}
                                            style={[tw`rounded-lg`, { width: 100, height: 100 }]}
                                        />
                                        <View style={tw`flex-1 ml-4`}>
                                            <Text style={tw`text-lg font-bold text-gray-800`}>
                                                {promotion.name}
                                            </Text>
                                            <Text style={tw`text-gray-600 mt-1`}>
                                                {promotion.product?.product_name}
                                            </Text>
                                            <View style={tw`mt-2 bg-red-100 self-start rounded-full px-3 py-1`}>
                                                <Text style={tw`text-red-600 font-bold`}>
                                                    Giảm {promotion.discount_percentage}%
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {promotions.length === 0 && codePromotions.length === 0 && (
                        <View style={tw`items-center py-8`}>
                            <Icon name="gift-outline" size={64} color="#CBD5E0" />
                            <Text style={tw`text-gray-500 mt-4 text-lg`}>
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