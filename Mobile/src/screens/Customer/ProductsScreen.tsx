import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import tw from 'tailwind-react-native-classnames';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { addToCart } from '../../redux/reducers/cartReducers';
import productService from '../../services/product.service';
import { handleResponse } from '../../function';
import { API_CONFIG } from '../../services/config';

type Product = {
  id: number;
  product_name: string;
  image: string;
  purchase_price: number;
  selling_price: number;
  description?: string;
  quantity: number;
  factory?: {
    id: number;
    factory_name: string;
    email: string;
    address: string;
    phone: string;
  };
  promotion?: {
    id: number;
    name: string;
    discount_percentage: string;
    description: string;
    present?: {
      id: number;
      product_name: string;
      image: string;
      selling_price: number;
    };
  }[];
};

const ProductsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const cart = useSelector((state: RootState) => state.cart);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
     
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

  const handleAddToCart = (product: Product) => {
    const cartItem = {
      id: product.id,
      product_name: product.product_name,
      image: product.image,
      selling_price: product.selling_price,
      quantity: 1,
      discount: product.promotion && product.promotion.length > 0 && !product.promotion[0].present ? parseFloat(product.promotion[0].discount_percentage) : 0
    };

    if (product.promotion && product.promotion.length > 0) {
      const promotion = product.promotion[0];
      if (promotion.present) {
        dispatch(addToCart(cartItem));
        dispatch(addToCart({
          id: promotion.present.id,
          product_name: promotion.present.product_name,
          image: promotion.present.image,
          selling_price: promotion.present.selling_price,
          quantity: 1,
          discount: parseFloat(promotion.discount_percentage),
          is_Sale: true
        }));
        Alert.alert('Thông báo', 'Sản phẩm và quà tặng đã được thêm vào giỏ hàng');
        return;
      }
    }

    dispatch(addToCart(cartItem));
    Alert.alert('Thông báo', 'Sản phẩm đã được thêm vào giỏ hàng');
  };

  const calculateDiscountedPrice = (price: number, discountPercentage: string) => {
    const discount = parseFloat(discountPercentage);
    return price * (1 - discount / 100);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw`bg-blue-600 px-4 py-3 flex-row justify-between items-center shadow-sm`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-white`}>Sản phẩm</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart' as never)}>
          <View>
            <Icon name="cart-outline" size={24} color="#fff" />
            {cart.items.length > 0 && (
              <View style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center`}>
                <Text style={tw`text-white text-xs font-bold`}>{cart.items.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={tw`mt-4 text-gray-600`}>Đang tải sản phẩm...</Text>
        </View>
      ) : (
        /* Product Grid */
        <ScrollView style={tw`flex-1 px-2`}>
          <View style={tw`flex-row flex-wrap justify-between mt-4`}>
            {products.map((product) => (
              <View key={product.id} style={[tw`bg-white rounded-xl mb-4 shadow-sm overflow-hidden`, { width: '48%' }]}>
                <Image 
                  source={{ uri: `${API_CONFIG.BASE_URL}${product.image}` }} 
                  style={tw`w-full h-48`}
                  resizeMode="cover"
                />
                <View style={tw`p-3`}>
                  <Text style={tw`font-semibold text-gray-800 text-base mb-2 h-12`} numberOfLines={2}>
                    {product.product_name}
                  </Text>
                  {product.promotion && product.promotion.length > 0 ? (
                    <View>
                      <Text style={tw`text-blue-600 font-bold text-lg mb-1`}>
                        {product.selling_price.toLocaleString()}đ
                      </Text>
                      {product.promotion[0].present ? (
                        <View style={tw`bg-red-100 rounded-full px-2 py-1 mb-3 self-start`}>
                          <Text style={tw`text-xs text-red-600 font-medium`}>
                            + {product.promotion[0].present.product_name}
                          </Text>
                        </View>
                      ) : (
                        <View style={tw`bg-red-100 rounded-full px-2 py-1 mb-3 self-start`}>
                          <Text style={tw`text-xs text-red-600 font-medium`}>
                            Giảm {product.promotion[0].discount_percentage}%
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={tw`text-blue-600 font-bold text-lg mb-4`}>
                      {product.selling_price.toLocaleString()}đ
                    </Text>
                  )}
                  <TouchableOpacity
                    style={tw`bg-blue-600 py-2.5 rounded-lg items-center`}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Text style={tw`text-white font-semibold`}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProductsScreen;
