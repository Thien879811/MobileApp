import React, { useState ,useEffect} from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
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
import ProductService from '../../services/product.service';
import PromotionService from '../../services/promotion.service';

type Customer = {
    id: number;
    name: string;
}

type Product = any
type PromotionCode = {
    id: number;
    name: string;
    code: string;
    discount_percentage: string;
    quantity: string;
    start_date: string;
    end_date: string;
    max_value: string;
    min_value: string;
}

const CartScreen = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const cartItems = useSelector((state: any) => state.cart.items);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [promotionCode, setPromotionCode] = useState<PromotionCode[]>([]);
    const [voucher_code, setVoucherCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [voucherApplied, setVoucherApplied] = useState(false);
    const [appliedPromotion, setAppliedPromotion] = useState<PromotionCode | null>(null);

    useEffect(() => {
        const loadCustomer = async () => {
            const customerData = await AsyncStorage.getItem('customer');
            if (customerData) {
                setCustomer(JSON.parse(customerData));
            }
        };
        loadCustomer();
        fetchProducts();
        fetchPromotionCode();
    }, []);

    useEffect(() => {
        // Kiểm tra lại điều kiện voucher khi tổng đơn hàng thay đổi
        if (appliedPromotion) {
            const total = calculateSubtotal();
            if (appliedPromotion.min_value && total < parseFloat(appliedPromotion.min_value)) {
                Alert.alert('Thông báo', `Đơn hàng không đủ điều kiện áp dụng voucher (tối thiểu ${formatCurrency(parseFloat(appliedPromotion.min_value))})`);
                handleRemoveVoucher();
                return;
            }

            let discountAmount = total * (parseFloat(appliedPromotion.discount_percentage) / 100);
            if (appliedPromotion.max_value && discountAmount > parseFloat(appliedPromotion.max_value)) {
                discountAmount = parseFloat(appliedPromotion.max_value);
            }
            setDiscount(discountAmount);
        }
    }, [cartItems]);

    const fetchPromotionCode = async () => {
        try {   
            const response = await PromotionService.getPromotions();
            const data = handleResponse(response);  
            console.log(data);    
            setPromotionCode(data);
            
        } catch (error: any) {
            const response = handleResponse(error.response);
            console.log(response);
        }
    }

    const handleApplyVoucher = () => {
        if (voucherApplied) {
            Alert.alert('Thông báo', 'Bạn đã áp dụng một mã khuyến mãi rồi');
            return;
        }

        if (!voucher_code) {
            Alert.alert('Lỗi', 'Vui lòng nhập mã khuyến mãi');
            return;
        }

        const promotion = promotionCode?.find((p) => p.code === voucher_code);

        if (!promotion) {
            Alert.alert('Lỗi', 'Mã khuyến mãi không hợp lệ');
            setDiscount(0);
            setAppliedPromotion(null);
            return;
        }

        const currentDate = new Date();
        const startDate = new Date(promotion.start_date);
        const endDate = new Date(promotion.end_date);

        if (currentDate < startDate || currentDate > endDate) {
            Alert.alert('Lỗi', 'Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian sử dụng');
            setDiscount(0);
            setAppliedPromotion(null);
            return;
        }

        if (parseInt(promotion.quantity) <= 0) {
            Alert.alert('Lỗi', 'Mã khuyến mãi đã hết lượt sử dụng');
            setDiscount(0);
            setAppliedPromotion(null);
            return;
        }

        const total = calculateSubtotal();

        if (promotion.min_value && total < parseFloat(promotion.min_value)) {
            Alert.alert('Lỗi', `Giá trị đơn hàng tối thiểu phải từ ${formatCurrency(parseFloat(promotion.min_value))}`);
            setDiscount(0);
            setAppliedPromotion(null);
            setVoucherCode('');
            return;
        }

        let discountAmount = total * (parseFloat(promotion.discount_percentage) / 100);

        if (promotion.max_value && discountAmount > parseFloat(promotion.max_value)) {
            discountAmount = parseFloat(promotion.max_value);
        }

        setDiscount(discountAmount);
        setVoucherApplied(true);
        setAppliedPromotion(promotion);
        Alert.alert('Thành công', `Áp dụng mã giảm ${formatCurrency(discountAmount)} thành công`);
    }

    const handleRemoveVoucher = () => {
        setVoucherCode('');
        setDiscount(0);
        setVoucherApplied(false);
        setAppliedPromotion(null);
    }

    const fetchProducts = async () => {
        try {
          setLoading(true);
          const response = await ProductService.getAll();
         
            const data = handleResponse(response);
            if (data && typeof data === 'object') {
              setProducts(Array.isArray(data) ? data : []);
            }
    
        } catch (error: any) {
          if (error.response) {
            try {
              const errorResponse = handleResponse(error.response);
              console.error('Error fetching products:', errorResponse.message);
              Alert.alert('Error', errorResponse.message);
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
              Alert.alert('Error', 'Invalid response format');
            }
          } else {
            console.error('Error fetching products:', error);
            Alert.alert('Error', 'Failed to fetch products');
          }
        } finally {
          setLoading(false);
        }
      };

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
        const subtotal = cartItems.reduce((total: number, item: any) => {
            const price = item.selling_price;
            const discountedPrice = item.discount ? price * (1 - item.discount / 100) : price;
            return total + (discountedPrice * item.quantity);
        }, 0);
        return subtotal - discount;
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total: number, item: any) => {
            const price = item.selling_price;
            const discountedPrice = item.discount ? price * (1 - item.discount / 100) : price;
            return total + (discountedPrice * item.quantity);
        }, 0);
    };

    const calculateDiscountAmount = () => {
        return discount;
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

            // Tìm sản phẩm tương ứng trong danh sách products
            const product = products.find(p => p.id === item.id);
            if (product && item.quantity > product.quantity - 5) {
                Alert.alert('Số lượng sản phẩm', `${item.product_name} không khả dụng`);
                return;
            }
        }

        const data = {
            customer_id: customer.id,
            pays_id: 2,
            status: 5,
            voucher_code: voucher_code,
            discount: discount,
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
                navigation.navigate('Home');
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
            <View style={tw`flex-row items-center mb-4`}>
                <TextInput
                    style={tw`flex-1 p-2 border border-gray-300 rounded-l-lg`}
                    placeholder="Nhập mã khuyến mãi"
                    value={voucher_code}
                    onChangeText={setVoucherCode}
                />
                <TouchableOpacity 
                    style={tw`bg-blue-600 p-2.5 rounded-r-lg`}
                    onPress={handleApplyVoucher}
                >
                    <Text style={tw`text-white font-bold`}>Áp dụng</Text>
                </TouchableOpacity>
            </View>

            {appliedPromotion && (
                <View style={tw`mb-4 p-3 bg-blue-50 rounded-lg`}>
                    <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`flex-row items-center`}>
                            <Icon name="local-offer" size={20} color="#2563EB" />
                            <Text style={tw`ml-2 text-blue-600 font-medium`}>
                                {appliedPromotion.name}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleRemoveVoucher}>
                            <Icon name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <Text style={tw`text-gray-600 text-sm mt-1`}>
                        Voucher: {appliedPromotion.code}
                    </Text>
                </View>
            )}

            <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-gray-600`}>Tạm tính:</Text>
                    <Text style={tw`text-gray-800 font-medium`}>{formatCurrency(calculateSubtotal())}</Text>
                </View>
                {discount > 0 && (
                    <View style={tw`flex-row justify-between items-center mb-2`}>
                        <Text style={tw`text-gray-600`}>Giảm giá:</Text>
                        <Text style={tw`text-green-600 font-medium`}>-{formatCurrency(calculateDiscountAmount())}</Text>
                    </View>
                )}
                <View style={tw`flex-row justify-between items-center pt-2 border-t border-gray-200`}>
                    <Text style={tw`text-lg font-medium`}>Tổng tiền:</Text>
                    <Text style={tw`text-xl font-bold text-red-500`}>{formatCurrency(calculateTotal())}</Text>
                </View>
            </View>

            <TouchableOpacity 
                style={[
                    tw`bg-blue-600 p-4 rounded-lg items-center`,
                    isLoading && tw`opacity-50`
                ]} 
                onPress={handleSubmitOrder}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={tw`text-white text-base font-bold`}>Thanh toán</Text>
                )}
            </TouchableOpacity>
            </View>
        )}
        </SafeAreaView>
    );
};

export default CartScreen;
