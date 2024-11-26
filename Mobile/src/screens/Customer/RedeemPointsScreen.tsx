import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomerService from '../../services/customer.service';
import promotionService from '../../services/promotion.service';
import { handleResponse } from '../../function';

type Customer = {
    id: number;
    name: string;
    diem: number;
};

interface VoucherItem {
  discount: string;
  max_value: string;
  points: number;
  isOwned: boolean;
  minSpend: string;
}

const RedeemPointsScreen = () => {
    const navigation = useNavigation();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const currentPoints = customer?.diem;

    useEffect(() => {
        const loadCustomer = async () => {
            const customerData = await AsyncStorage.getItem('customer');
            if (customerData) {
                setCustomer(JSON.parse(customerData));
            }
        };
        loadCustomer();
    }, []);

    const vouchers: VoucherItem[] = [
        {
        discount: '5%',
        max_value: '20000',
        points: 1000,
        isOwned: false,
        minSpend: '100000'
        },
        {
        discount: '10%',
        max_value: '50000',
        points: 1500,
        isOwned: false,
        minSpend: '200000'
        },
        {
        discount: '15%',
        max_value: '100000',
        points: 2000,
        isOwned: false,
        minSpend: '300000'
        },
    ];

    const handleRedeemPoints = async (points: number, voucher: VoucherItem) => {
        if (!customer) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập để đổi điểm');
            return;
        }

        if (customer.diem < points) {
            Alert.alert('Không đủ điểm', 'Bạn không có đủ điểm để đổi voucher này');
            return;
        }

        try {
            const updatedCustomer = {
                ...customer,
                diem: customer.diem - points
            };

            const redeemPointData = {
                customer_id: customer.id,
                voucher: voucher
            }

            console.log(redeemPointData);

            await AsyncStorage.setItem('customer', JSON.stringify(updatedCustomer));
            const ResCreate = await promotionService.createRedeemPoint(redeemPointData);
            const data = handleResponse(ResCreate);

            setCustomer(updatedCustomer);
            
            Alert.alert(
                'Thành công',
                'Đổi voucher thành công! Voucher đã được thêm vào ví của bạn',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            const data = handleResponse(error.response);
            Alert.alert('Lỗi', data.message);
        }
    };

    return (
        <View style={tw`flex-1 bg-white`}>
        <View style={tw`flex-row items-center p-4 bg-blue-500`}>
            <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={tw`mr-3`}
            >
                <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Icon name="card-giftcard" size={24} color="#fff" />
            <Text style={tw`text-white text-xl ml-2`}>Kho Voucher</Text>
        </View>

        <View style={tw`p-4 border-b border-gray-200`}>
            <Text style={tw`text-base`}>
            Điểm tích lũy hiện tại: <Text style={tw`text-blue-500 font-bold`}>{currentPoints} điểm</Text>
            </Text>
        </View>

        <ScrollView style={tw`p-4`}>
            {vouchers.map((voucher, index) => (
            <View key={index} style={tw`flex-row border border-blue-500 rounded-lg mb-4 overflow-hidden`}>
                <View style={tw`bg-blue-500 p-4 w-1/3 justify-center items-center`}>
                    <Text style={tw`text-white font-bold text-base`}>VOUCHER</Text>
                    <Text style={tw`text-white font-bold text-sm mt-1`}>XTRA</Text>
                    <Text style={tw`text-white text-sm mt-2`}>{voucher.points} điểm</Text>
                </View>

                <View style={tw`flex-1 p-4 bg-white`}>
                    <Text style={tw`text-lg font-bold`}>
                        Giảm {voucher.discount} Giảm tối đa
                    </Text>
                    <Text style={tw`text-lg font-bold`}>{parseInt(voucher.max_value).toLocaleString()}đ</Text>
                    <Text style={tw`text-gray-600 mt-1`}>
                        Đơn Tối Thiểu {parseInt(voucher.minSpend).toLocaleString()}đ
                    </Text>
                    <View style={tw`flex-row items-center justify-between mt-2`}>
                        <Text style={tw`text-gray-500 text-sm`}>Có hiệu lực từ 15 Th11</Text>
                        <TouchableOpacity 
                            style={tw`${currentPoints && currentPoints >= voucher.points ? 'bg-blue-500' : 'bg-gray-400'} px-4 py-1 rounded-full`}
                            onPress={() => handleRedeemPoints(voucher.points,voucher)}
                            disabled={currentPoints && currentPoints < voucher.points ? true : false}
                        >
                            <Text style={tw`text-white font-medium`}>Đổi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            ))}
        </ScrollView>
        </View>
    );
};

export default RedeemPointsScreen;
