import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import employeeService from '../../services/employee.service';
import { handleResponse } from '../../function/index';
import { Alert } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { setAttendance, setError, setLoading } from '../../redux/reducers/attenceReducers';

interface ShiftData {
  created_at: string;
  date: string;
  id: number;
  reason: string;
  staff_id: number;
  time_end: string;
  time_start: string;
  updated_at: string;
}

interface ChamCong {
  id: number;
  date: string;
  reason: string;
  staff_id: number;
  time_end: string;
  time_start: string;
}

type ParamList = {
  AttendanceDetail: {
    caLamViec: ShiftData;
    type: 'in' | 'out';
    id_nhanvien: number;
    chamCong?: ChamCong;
  };
};

interface CheckInData {
  date: string;
  reason: string;
  staff_id: number;
  time_end: string;
  time_start: string;
}

const AttendanceDetailScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute<RouteProp<ParamList, 'AttendanceDetail'>>();
  const { caLamViec, type, id_nhanvien, chamCong } = route.params;
  const [data, setData] = useState<ShiftData | null>(null);
  const [checkinData, setCheckinData] = useState<CheckInData | null>(null);
  const { attendance, loading, error } = useSelector((state: RootState) => state.attendance);;
  useEffect(() => {
    if (caLamViec) {
      setData(caLamViec);
    }
    if (chamCong) {
      dispatch(setAttendance(chamCong));
    }
  }, [caLamViec, chamCong, dispatch]);

  if (!data) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-gray-100`}>
        <Text style={tw`text-xl font-medium text-gray-600`}>Không nhận được dữ liệu</Text>
      </View>
    );
  }

  const CheckIn = async (checkInData: CheckInData) => {
    try {
      dispatch(setLoading(true));
      const response = await employeeService.checkIn(checkInData);
      const responseData = handleResponse(response);
      if (responseData.success) {
        dispatch(setAttendance(responseData.data));
        Alert.alert('Thành công', 'Chấm công đã được tạo thành công');
        navigation.navigate('Attendance' as never);
      }
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 400) {
        const err = handleResponse(error.response);
        console.log(err);
        dispatch(setError(err.message));
        Alert.alert('Chấm công', err.message || 'Không thể chấm công');
      } else {
        dispatch(setError('Có lỗi xảy ra'));
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi chấm công');
      }
    } finally {
      dispatch(setLoading(false));
    }
  }

  const CheckOut = async (id: number, checkOutData: CheckInData) => {
    try {
      dispatch(setLoading(true));
      const response = await employeeService.checkOut(id, checkOutData);
      const responseData = handleResponse(response);
      if(responseData.success){
        dispatch(setAttendance(responseData.data));
        Alert.alert('Thành công', 'Chấm công đã được cập nhật thành công');
        navigation.navigate('Attendance' as never);
      }
    } catch (error: any) {
      if (!error.response) {
        dispatch(setError('Lỗi kết nối'));
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        return;
      }
      if (error.response?.status === 404) {
        dispatch(setError('Không tìm thấy bản ghi chấm công'));
        Alert.alert('Lỗi', 'Không tìm thấy bản ghi chấm công');
      } else {
        dispatch(setError('Có lỗi xảy ra'));
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật chấm công');
      }
    } finally {
      dispatch(setLoading(false));
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: (date.getMonth() + 1).toString().padStart(2, '0')
    };
  };

  const { day, month } = formatDate(data.date);

  const getTodayShift = () => {
    const today = new Date().toISOString().split('T')[0];
    return data.date === today ? data : null;
  };

  const handleReject = () => {
    navigation.goBack();
  };

  const handleConfirm = (type: 'in' | 'out') => {
    const currentTime = new Date().toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit' });
    if (type === 'in') {
      const newCheckIn: CheckInData = {
        date: data.date,
        reason: "",
        staff_id: id_nhanvien,
        time_end: '',
        time_start: currentTime,
      };
      CheckIn(newCheckIn);
    } else {
      if (attendance) {
        const updatedCheckIn: CheckInData = {
          ...attendance,
          time_end: currentTime,
          reason: "",
        };
        CheckOut(attendance.id, updatedCheckIn);
      } else {
        Alert.alert("Error", "No check-in data available");
      }
    }
  };

  const todayShift = getTodayShift();

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      {/* Header */}
      <View style={tw`bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg`}>
        <Text style={tw`text-3xl font-bold text-white text-center mb-2`}>Chi tiết chấm công</Text>
        <Text style={tw`text-lg text-blue-100 text-center`}>Ngày {day} Tháng {month}</Text>
      </View>

      {/* Main Content */}
      <View style={tw`-mt-6 mx-4`}>
        <View style={tw`bg-white rounded-2xl p-6 shadow-xl`}>
          <View style={tw`items-center mb-6`}>
            {todayShift ? (
              <View style={tw`items-center bg-blue-50 px-6 py-4 rounded-xl w-full`}>
                <Text style={tw`text-base text-blue-600 mb-2`}>Thời gian làm việc</Text>
                <Text style={tw`text-2xl font-bold text-blue-800`}>
                  {todayShift.time_start} - {todayShift.time_end}
                </Text>
              </View>
            ) : (
              <View style={tw`bg-red-50 px-6 py-4 rounded-xl w-full items-center`}>
                <Text style={tw`text-xl text-red-500 font-medium`}>Không có ca</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={tw`absolute bottom-8 left-0 right-0 px-4`}>
        <View style={tw`flex-row justify-between`}>
          <TouchableOpacity 
            style={tw`flex-1 mr-2 py-4 bg-white rounded-xl items-center shadow-sm`}
            onPress={handleReject}
          >
            <Text style={tw`text-lg font-semibold`}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={tw`flex-1 ml-2 py-4 bg-blue-500 rounded-xl items-center shadow-sm ${loading ? 'opacity-75' : ''}`}
            onPress={() => handleConfirm(type)}
            disabled={loading}
          >
            <Text style={tw`text-lg font-semibold text-white`}>
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AttendanceDetailScreen;
