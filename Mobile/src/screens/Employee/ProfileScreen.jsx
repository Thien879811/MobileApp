import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import employeeService from '../../services/employee.service';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../redux/reducers/authReducers';
import { handleResponse } from '../../function/index';

const ProfileScreen = ({ navigation }) => {
    const username = useSelector(selectAuth).user;
    const [user, setUser] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [editedUser, setEditedUser] = useState({});

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            const employee = await employeeService.get(username.id);
            const data = handleResponse(employee);
            setUser(data);
        } catch (error) {
            console.error('Error fetching employee info:', error);
        }
    }


    const handleEditProfile = () => {
        setEditedUser({...user});
        setModalVisible(true);
    };

    const handleSaveProfile = async () => {
        try {
            const dataRequest = {
                names: editedUser.names,
                age: editedUser.age,
                address: editedUser.address,
                phone: editedUser.phone,
                gioitinh: editedUser.gioitinh,
            }
            const response = await employeeService.update(user.id, dataRequest);
            const data = handleResponse(response);
            if(data.success) {
                Alert.alert('Thông báo', data.message);
                setUser(editedUser);
                setModalVisible(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
          "Đăng xuất",
          "Bạn có chắc chắn muốn đăng xuất?",
          [
            {
              text: "Hủy",
              style: "cancel"
            },
            { 
              text: "Đồng ý", 
              onPress: () => {
                authService.logout();
                dispatch(authLogout());
                AsyncStorage.removeItem('access_token');
              }
            }
          ]
        );
      };

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <ScrollView style={tw`flex-1 -mt-6`}>
            <View style={tw`bg-blue-600 px-5 pt-12 pb-12 rounded-b-3xl shadow-lg`}>
                <View style={tw`flex-row items-center justify-between mb-6`}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={tw`p-2 bg-gray-200 bg-opacity-20 rounded-full`}
                    >
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={tw`text-2xl font-bold text-white`}>Hồ sơ</Text>
                    <View style={tw`w-8`} />
                </View>

                <View style={tw`items-center`}>
                    <View style={tw`w-28 h-28 bg-white rounded-full justify-center items-center mb-4 shadow-md`}>
                        <Icon name="person" size={56} color="#3B82F6" />
                    </View>
                    <Text style={tw`text-2xl font-bold text-white mb-1`}>{user.names}</Text>
                    <Text style={tw`text-white`}>{user.position}</Text>
                </View>
            </View>
                <View style={tw`bg-white rounded-t-3xl px-6 pt-8 shadow-lg`}>
                    <View style={tw`mb-8`}>
                        <View style={tw`flex-row items-center mb-6 bg-gray-50 p-4 rounded-xl`}>
                            <Icon name="calendar" size={24} color="#3B82F6" style={tw`mr-4`} />
                            <View>
                                <Text style={tw`text-gray-500 text-sm mb-1`}>Tuổi</Text>
                                <Text style={tw`text-gray-800 font-semibold text-lg`}>{user.age}</Text>
                            </View>
                        </View>

                        <View style={tw`flex-row items-center mb-6 bg-gray-50 p-4 rounded-xl`}>
                            <Icon name="location" size={24} color="#3B82F6" style={tw`mr-4`} />
                            <View>
                                <Text style={tw`text-gray-500 text-sm mb-1`}>Địa chỉ</Text>
                                <Text style={tw`text-gray-800 font-semibold text-lg`}>{user.address}</Text>
                            </View>
                        </View>

                        <View style={tw`flex-row items-center mb-6 bg-gray-50 p-4 rounded-xl`}>
                            <Icon name="call" size={24} color="#3B82F6" style={tw`mr-4`} />
                            <View>
                                <Text style={tw`text-gray-500 text-sm mb-1`}>Số điện thoại</Text>
                                <Text style={tw`text-gray-800 font-semibold text-lg`}>{user.phone}</Text>
                            </View>
                        </View>

                        <View style={tw`flex-row items-center mb-6 bg-gray-50 p-4 rounded-xl`}>
                            <Icon name="person" size={24} color="#3B82F6" style={tw`mr-4`} />
                            <View>
                                <Text style={tw`text-gray-500 text-sm mb-1`}>Giới tính</Text>
                                <Text style={tw`text-gray-800 font-semibold text-lg`}>{user.gioitinh}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={tw`bg-blue-600 py-4 px-6 rounded-xl mb-4 shadow-md`}
                        onPress={handleEditProfile}
                    >
                        <Text style={tw`text-white text-center font-bold text-lg`}>Chỉnh sửa thông tin</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={tw` py-4 px-6 rounded-xl mb-8`}
                        onPress={handleLogout}
                    >
                        <Text style={tw` text-center font-bold text-lg`}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
                    <View style={tw`bg-white p-6 rounded-2xl w-11/12`}>
                        <Text style={tw`text-xl font-bold mb-4`}>Chỉnh sửa thông tin</Text>
                        
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-600 mb-2`}>Họ và tên</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg p-2`}
                                value={editedUser.names}
                                onChangeText={(text) => setEditedUser({...editedUser, names: text})}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-600 mb-2`}>Tuổi</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg p-2`}
                                value={editedUser.age ? editedUser.age.toString() : ''}
                                onChangeText={(text) => setEditedUser({...editedUser, age: text})}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-600 mb-2`}>Địa chỉ</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg p-2`}
                                value={editedUser.address}
                                onChangeText={(text) => setEditedUser({...editedUser, address: text})}
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-600 mb-2`}>Số điện thoại</Text>
                            <TextInput
                                style={tw`border border-gray-300 rounded-lg p-2`}
                                value={editedUser.phone}
                                onChangeText={(text) => setEditedUser({...editedUser, phone: text})}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-600 mb-2`}>Giới tính</Text>
                            <View style={tw`flex-row`}>
                                <TouchableOpacity 
                                    style={tw`flex-1 p-2 border border-gray-300 rounded-l-lg ${editedUser.gioitinh === 'Nam' ? 'bg-blue-500' : 'bg-white'}`}
                                    onPress={() => setEditedUser({...editedUser, gioitinh: 'Nam'})}
                                >
                                    <Text style={tw`text-center ${editedUser.gioitinh === 'Nam' ? 'text-white' : 'text-gray-700'}`}>Nam</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={tw`flex-1 p-2 border border-gray-300 rounded-r-lg ${editedUser.gioitinh === 'Nữ' ? 'bg-blue-500' : 'bg-white'}`}
                                    onPress={() => setEditedUser({...editedUser, gioitinh: 'Nữ'})}
                                >
                                    <Text style={tw`text-center ${editedUser.gioitinh === 'Nữ' ? 'text-white' : 'text-gray-700'}`}>Nữ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={tw`flex-row justify-end mt-4`}>
                            <TouchableOpacity
                                style={tw`bg-gray-200 py-2 px-4 rounded-lg mr-2`}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`bg-blue-600 py-2 px-4 rounded-lg`}
                                onPress={handleSaveProfile}
                            >
                                <Text style={tw`text-white`}>Lưu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default ProfileScreen;