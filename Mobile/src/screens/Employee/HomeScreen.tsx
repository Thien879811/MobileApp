import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, SafeAreaView, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { authLogout } from '../../redux/reducers/authReducers';
import authService from '../../services/auth.service';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../redux/reducers/authReducers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import employeeService from '../../services/employee.service';
import { handleResponse } from '../../function/index';
import Icon from 'react-native-vector-icons/Ionicons';
import tw from 'tailwind-react-native-classnames';

interface LichLamViec {
  id: number;
  date: string;
  time_start: string;
  time_end: string;
  status: number;
}

const HomeScreen: React.FC = () => {
  const username = useSelector(selectAuth).user;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState('');
  const [lichLamViec, setLichLamViec] = useState<LichLamViec[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employee) {
      fetchLichLamViec();
    }
  }, [employee]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.get(username.id);
      const data = handleResponse(response);
      console.log(data);
      setEmployee(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchLichLamViec = async () => {
    try {
      const response = await employeeService.lichLamViec(employee.id);
      const data = handleResponse(response);
      console.log(data)
      const filteredData = filterDataByViewMode(data);
      setLichLamViec(filteredData);
    } catch (error: any) {
      const response = handleResponse(error.response);
      console.log(response);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (employee) {
        fetchLichLamViec();
      }
    }, [viewMode, employee])
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const filterDataByViewMode = (data: LichLamViec[]) => {
    const today = new Date();
    
    if (viewMode === 'week') {
      const curr = new Date();
      const first = curr.getDate() - curr.getDay() + 1;
      const last = first + 6;
      
      const weekStart = new Date(curr.setDate(first));
      const weekEnd = new Date(curr.setDate(last));

      return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= weekStart && itemDate <= weekEnd;
      });
    }
    return data;
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

  const handleDayPress = (date: string, time_start: string, time_end: string) => {
    setSelectedDate(date);
    Alert.alert(
      'Chi tiết ca làm việc',
      `Ca làm việc: ${time_start} - ${time_end}\n` +
      'Công việc:\n' +
      '- Kiểm tra và cập nhật hệ thống\n' +
      '- Phục vụ khách hàng\n' +
      '- Báo cáo kết quả cuối ca'
    );
  };

  const handleLeaveRequest = async (date: string) => {
    Alert.alert(
      'Xin nghỉ phép',
      `Bạn muốn xin nghỉ phép ngày ${date}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xác nhận',
          onPress: () => Alert.alert('Đã gửi yêu cầu xin nghỉ phép')
        }
      ]
    );

    const res = {
      date: date,
      staff_id: employee.id,
      reason: "Xin nghỉ phép",
      status: "-1"
    };
    try {
      const response = await employeeService.createLeaveRequest(res);
      handleResponse(response);
      fetchLichLamViec();
    } catch (error) {
      console.error(error);
    }
  };

  const formatDateTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return {
      time: `${hours}:${minutes}`,
      date: `${day}/${month}/${year}`
    };
  };

  const currentDateTime = formatDateTime(currentDate);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={tw` bg-blue-600 px-5 pt-12 pb-8`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-12 h-12 bg-white rounded-full mr-4 items-center justify-center`}>
              <Icon name="person" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={tw`text-white text-lg`}>Xin chào,</Text>
              <Text style={tw`text-white text-xl font-bold`}>{username.name}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={tw`bg-white bg-opacity-20 p-3 rounded-full`}>
            <Icon name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Display */}
      <View style={tw`-mt-6 mx-5 bg-white rounded-2xl shadow-lg p-6`}>
        <Text style={tw`text-3xl font-bold text-gray-800`}>{currentDateTime.time}</Text>
        <Text style={tw`text-gray-500 mt-1`}>{currentDateTime.date}</Text>
      </View>

      <ScrollView style={tw`flex-1 px-5 pt-6`}>
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <Text style={tw`text-2xl font-bold text-gray-800`}>Lịch làm việc</Text>
          <TouchableOpacity 
            onPress={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            style={tw`bg-blue-100 px-4 py-2 rounded-full`}
          >
            <Text style={tw`text-blue-600`}>
              {viewMode === 'week' ? 'Xem tháng' : 'Xem tuần'}
            </Text>
          </TouchableOpacity>
        </View>

        {lichLamViec.map((item) => (
          <View 
            key={item.date} 
            style={tw`bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-100`}
          >
            <View style={tw`bg-blue-50 p-4`}>
              <Text style={tw`text-lg font-bold text-blue-800`}>{item.date}</Text>
              <View style={tw`flex-row items-center mt-2`}>
                <Icon name="time-outline" size={20} color="#3B82F6" />
                <Text style={tw`text-blue-600 ml-2 font-medium`}>
                  {item.time_start} - {item.time_end}
                </Text>
              </View>
            </View>
            
            <View style={tw`flex-row p-4`}>
              <TouchableOpacity 
                onPress={() => handleDayPress(item.date, item.time_start, item.time_end)}
                style={tw`flex-1 bg-blue-500 rounded-xl py-3 mr-2 flex-row items-center justify-center`}
              >
                <Icon name="information-circle-outline" size={20} color="#fff" />
                <Text style={tw`text-white font-medium ml-2`}>Chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
