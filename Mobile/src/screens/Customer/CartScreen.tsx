import React, { useState ,useEffect} from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '../../redux/reducers/cartReducers';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderService from '../../services/order.service';
import { handleResponse } from '../../function';
import { API_CONFIG } from '../../services/config';

type Customer = {
    id: number;
    name: string;
}

const CartScreen = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const cartItems = useSelector((state: any) => state.cart.items);
    const [customer, setCustomer] = useState<Customer | null>(null);
    useEffect(() => {
        const loadCustomer = async () => {
            const customerData = await AsyncStorage.getItem('customer');
            if (customerData) {
                setCustomer(JSON.parse(customerData));
            }
        };
        loadCustomer();
    }, []);


    const handleRemoveItem = (productId: number) => {
        dispatch(removeFromCart(productId));
    };

    const handleUpdateQuantity = (productId: number, newQuantity: number, is_Sale?: boolean) => {
        if (is_Sale) return; // Don't update quantity for sale items
        if (newQuantity > 0) {
        dispatch(updateQuantity({ id: productId, quantity: newQuantity }));
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total: number, item: any) => {
        const price = item.selling_price;
        const discountedPrice = item.discount ? price * (1 - item.discount / 100) : price;
        return total + (discountedPrice * item.quantity);
        }, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
        }).format(amount);
    };

    const handleSubmitOrder = async () => {
        if (!customer?.id) {
            Alert.alert('Lỗi', 'Vui lòng đăng nhập trước');
            return;
        }

        if (cartItems.length === 0) {
            Alert.alert('Lỗi', 'Giỏ hàng trống');
            return;
        }

        // Kiểm tra số lượng sản phẩm
        for (const item of cartItems) {
            if (item.quantity <= 0) {
                Alert.alert('Lỗi', `Số lượng không hợp lệ cho ${item.product_name}`);
                return;
            }
        }

        const data = {
            customer_id: customer.id,
            pays_id: 2,
            status: 5,
            products: cartItems.map((item: any) => ({
                product_id: item.id,
                soluong: item.quantity,
                dongia: parseFloat(item.selling_price),
                discount: item.discount ? parseFloat((item.selling_price * item.quantity * item.discount / 100).toFixed(2)) : 0,
            })),
        }

        try {
            setIsLoading(true);
            const response = await OrderService.create(data);
            const dataResponse = handleResponse(response);
            if (dataResponse.status === 'success') {
                dispatch(clearCart());
                Alert.alert('Thành công', 'Đặt hàng thành công');
                navigation.navigate('History');
            }
        } catch (error: any) {
            const response = handleResponse(error.response);
            Alert.alert('Lỗi', response?.message || 'Đặt hàng thất bại');
            console.error('Lỗi đặt hàng:', error.response);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`p-4 border-b bg-blue-600 border-gray-200 flex-row justify-between items-center`}>
            <Text style={tw`text-xl font-bold text-white`}>Giỏ hàng</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        <ScrollView style={tw`flex-1`}>
            {cartItems.length === 0 ? (
            <View style={tw`flex-1 justify-center items-center py-10`}>
                <Icon name="shopping-cart" size={64} color="#ccc" />
                <Text style={tw`mt-4 text-base text-gray-600`}>Giỏ hàng trống</Text>
            </View>
            ) : (
            cartItems.map((item: any) => (
                <View key={item.id} style={tw`flex-row p-4 border-b border-gray-200`}>
                <Image 
                    source={{ uri: `${API_CONFIG.BASE_URL}${item.image}` }} 
                    style={tw`w-20 h-20 rounded-lg`} 
                />
                <View style={tw`flex-1 ml-4`}>
                    <Text style={tw`text-base font-medium`}>{item.product_name}</Text>
                    <View style={tw`flex-row items-center mt-1`}>
                    <Text style={tw`text-base text-red-500`}>
                        {formatCurrency(item.discount ? 
                        item.selling_price * (1 - item.discount / 100) : 
                        item.selling_price
                        )}
                    </Text>
                    {item.discount > 0 && (
                        <Text style={tw`ml-2 text-sm text-gray-500 line-through`}>
                        {formatCurrency(item.selling_price)}
                        </Text>
                    )}
                    </View>
                    <View style={tw`flex-row items-center mt-2`}>
                    {!item.is_Sale ? (
                        <>
                        <TouchableOpacity 
                            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            style={tw`w-8 h-8 bg-gray-100 rounded-full justify-center items-center`}
                        >
                            <Text style={tw`text-lg font-bold`}>-</Text>
                        </TouchableOpacity>
                        <Text style={tw`mx-4 text-base`}>{item.quantity}</Text>
                        <TouchableOpacity 
                            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            style={tw`w-8 h-8 bg-gray-100 rounded-full justify-center items-center`}
                        >
                            <Text style={tw`text-lg font-bold`}>+</Text>
                        </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={tw`text-base text-gray-500`}>Quà tặng</Text>
                    )}
                    </View>
                </View>
                <TouchableOpacity 
                    onPress={() => handleRemoveItem(item.id)}
                    style={tw`p-2`}
                >
                    <Icon name="delete" size={24} color="#FF6B6B" />
                </TouchableOpacity>
                </View>
            ))
            )}
        </ScrollView>

        {cartItems.length > 0 && (
            <View style={tw`p-4 border-t border-gray-200`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
                <Text style={tw`text-lg font-medium`}>Tổng tiền:</Text>
                <Text style={tw`text-xl font-bold text-red-500`}>{formatCurrency(calculateTotal())}</Text>
            </View>
            <TouchableOpacity style={tw`bg-blue-600 p-4 rounded-lg items-center`} onPress={handleSubmitOrder}>
                <Text style={tw`text-white text-base font-bold`}>Thanh toán</Text>
            </TouchableOpacity>
            </View>
        )}
        </SafeAreaView>
    );
};

export default CartScreen;
