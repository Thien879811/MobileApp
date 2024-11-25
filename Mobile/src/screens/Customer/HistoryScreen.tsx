import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import orderService from '../../services/order.service';
import { handleResponse } from '../../function';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Platform } from 'react-native';

type Order = {
    id: number;
    total: number;
    created_at: string;
    status: number;
    pay: string;
    voucher: string;
    discount: number;
    items: OrderItem[];
};

type OrderItem = {
    product_name: string;
    quantity: number;
    price: number;
    discount: number;
};

const HistoryScreen = () => {
    const navigation = useNavigation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [selectedDate]);

    const fetchOrders = async () => {
        try {
            const customerData = await AsyncStorage.getItem('customer');
            if (!customerData) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập để xem lịch sử đơn hàng');
                return;
            }
            const customer = JSON.parse(customerData);
            
            const formattedDate = selectedDate.toISOString().split('T')[0];
            const response = await orderService.getOrdersByCustomerId(customer.id, formattedDate);
            const data = handleResponse(response);

            setOrders(data.data);
            
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN') + 'đ';
    };

    const getStatusText = (status: number) => {
        switch(status) {
            case -1:
                return 'Đã hủy';
            case 0:
                return 'Chờ xác nhận';
            case 1:
                return 'Thanh toán tại quầy';
            case 2:
                return 'Đang giao';
            case 3:
                return 'Hoàn thành';
            case 4:
                return 'Đã hủy';
            case 5:
                return 'Đơn hàng online';
            default:
                return 'Không xác định';
        }
    };

    const getStatusColor = (status: number) => {
        switch(status) {
            case -1:
                return 'bg-red-500';
            case 0:
                return 'bg-yellow-500';
            case 1:
                return 'bg-blue-500';
            case 2:
                return 'bg-purple-500';
            case 3:
                return 'bg-green-500';
            case 4:
                return 'bg-red-500';
            case 5:
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const handleConfirm = (date: Date) => {
        setShowDatePicker(false);
        setSelectedDate(date);
    };

    const handleCancel = () => {
        setShowDatePicker(false);
    };

    return (
        <View style={tw`flex-1 bg-gray-100`}>
            <View style={tw`bg-blue-600 p-4 flex-row items-center shadow-lg`}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={tw`mr-4`}
                >
                    <Icon name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={tw`text-white text-xl font-bold`}>
                    Lịch sử đơn hàng
                </Text>
            </View>

            <View style={tw`bg-white p-4 flex-row justify-between items-center border-b border-gray-200 shadow-sm`}>
                <View style={tw`flex-row items-center`}>
                    <Icon name="event" size={24} color="#3B82F6" style={tw`mr-2`} />
                    <Text style={tw`text-gray-700 font-medium`}>Chọn ngày:</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    style={tw`bg-blue-50 border border-blue-500 rounded-lg px-4 py-2`}
                >
                    <Text style={tw`text-blue-600 font-medium`}>{formatDate(selectedDate.toISOString())}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    date={selectedDate}
                />
            </View>

            <ScrollView style={tw`flex-1`}>
                {loading ? (
                    <View style={tw`flex-1 justify-center items-center p-4`}>
                        <Text style={tw`text-gray-600`}>Đang tải...</Text>
                    </View>
                ) : orders.length === 0 ? (
                    <View style={tw`flex-1 justify-center items-center p-8`}>
                        <Icon name="receipt-long" size={80} color="#9CA3AF" />
                        <Text style={tw`text-xl text-gray-600 mt-4 text-center font-medium`}>
                            Bạn chưa có đơn hàng nào
                        </Text>
                    </View>
                ) : (
                    <View style={tw`p-4`}>
                        {orders.map((order) => (
                            <View key={order.id} style={tw`bg-white rounded-xl shadow-md mb-4 overflow-hidden border border-gray-100`}>
                                <View style={tw`${getStatusColor(order.status)} p-4`}>
                                    <View style={tw`flex-row justify-between items-center`}>
                                        <Text style={tw`text-white font-bold text-lg`}>
                                            Đơn hàng #{order.id}
                                        </Text>
                                        <View style={tw`bg-white bg-opacity-20 rounded-full px-3 py-1`}>
                                            <Text style={tw`text-white font-medium`}>
                                                {getStatusText(order.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tw`flex-row justify-between mt-2`}>
                                        <Text style={tw`text-white opacity-90`}>
                                            <Icon name="event" size={16} /> {formatDate(order.created_at)}
                                        </Text>
                                        <Text style={tw`text-white opacity-90`}>
                                            <Icon name="payment" size={16} /> {order.pay}
                                        </Text>
                                    </View>
                                </View>
                                
                                <View style={tw`p-4`}>
                                    {order.items.map((item, index) => (
                                        <View key={index} style={tw`flex-row justify-between items-center py-2 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
                                            <View style={tw`flex-1`}>
                                                <Text style={tw`text-gray-800 font-medium`}>
                                                    {item.product_name}
                                                </Text>
                                                <Text style={tw`text-gray-500 text-sm`}>
                                                    SL: {item.quantity} x {formatPrice(item.price)}
                                                </Text>
                                            </View>
                                            {item.discount > 0 && (
                                                <View style={tw`mr-4`}>
                                                    <Text style={tw`text-red-500 font-medium`}>
                                                        -{formatPrice(item.discount)}
                                                    </Text>
                                                </View>
                                            )}
                                            <Text style={tw`text-gray-700 font-medium`}>
                                                {formatPrice(item.price * item.quantity - item.discount)}
                                            </Text>
                                        </View>
                                    ))}
                                    
                                    <View style={tw`mt-3 pt-3 border-t border-gray-200`}>
                                        {order.voucher && (
                                            <View style={tw`flex-row justify-between items-center mb-2 bg-green-50 p-2 rounded-lg`}>
                                                <View style={tw`flex-row items-center`}>
                                                    <Icon name="local-offer" size={20} color="#059669" />
                                                    <Text style={tw`text-gray-800 ml-2`}>Mã giảm giá:</Text>
                                                </View>
                                                <Text style={tw`text-green-600 font-medium`}>{order.voucher}</Text>
                                            </View>
                                        )}
                                        {order.discount > 0 && (
                                            <View style={tw`flex-row justify-between items-center mb-2 bg-red-50 p-2 rounded-lg`}>
                                                <View style={tw`flex-row items-center`}>
                                                    <Icon name="discount" size={20} color="#DC2626" />
                                                    <Text style={tw`text-gray-800 ml-2`}>Giảm giá:</Text>
                                                </View>
                                                <Text style={tw`text-red-600 font-medium`}>{order.discount}%</Text>
                                            </View>
                                        )}
                                        <View style={tw`flex-row justify-between items-center bg-blue-50 p-3 rounded-lg`}>
                                            <Text style={tw`text-gray-800 font-bold`}>Tổng cộng:</Text>
                                            <Text style={tw`text-blue-600 font-bold text-lg`}>
                                                {formatPrice(order.total - (order.total * order.discount / 100))}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default HistoryScreen;