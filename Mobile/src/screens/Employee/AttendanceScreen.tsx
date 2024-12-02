import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import employeeService from '../../services/employee.service';
import { handleResponse } from '../../function/index';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth } from '../../redux/reducers/authReducers';
import tw from 'tailwind-react-native-classnames';
import { setAttendance } from '../../redux/reducers/attenceReducers';
import Icon from 'react-native-vector-icons/Ionicons';

interface Shift {
  id: number;
  staff_id: number;
  date: string;
  time_start: string;
  time_end: string;
  status: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

interface NavigationProp {
  navigate: (screen: string, params: any) => void;
}

interface AttendanceState {
  attendance: {
    attendance: {
      time_start: string;
      time_end: string;
    } | null;
  };
}

const AttendanceScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [lichLamViec, setLichLamViec] = useState<Shift[]>([]);
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const username = useSelector(selectAuth).user;
  const dispatch = useDispatch();
  const attendance = useSelector((state: AttendanceState) => state.attendance.attendance);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    fetchEmployee();
  }, []);


  const fetchChamCong = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const req = await employeeService.fetchChamCong(employee.id, today);
      const data = handleResponse(req);
      if(data){
        dispatch(setAttendance(data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.get(username.id);
      const data = handleResponse(response);
      setEmployee(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchLichLamViec = async () => {
    try {
      const response = await employeeService.lichLamViec(employee.id);
      const data = handleResponse(response);
      const today = new Date().toISOString().split('T')[0];
      const todayShift = data.find((shift: Shift) => shift.date == today);
      setTodayShift(todayShift || null);
      setLichLamViec(data);
    } catch (error: any) {
      const response = handleResponse(error.response);
      console.log(response);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const response = await employeeService.fetchChamCongByMonth(employee.id, selectedMonth);
      const data = handleResponse(response);
      if (data && data.success) {
        setMonthlyAttendance(data.data || []);
      }
    } catch (error) {
      console.log(error);
      setMonthlyAttendance([]);
    }
  };

  useEffect(() => {
    if (employee) {
      fetchLichLamViec();
      fetchMonthlyAttendance();
      fetchChamCong();
    }
  }, [employee, selectedMonth]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const navigateToAttendanceDetail = (type: string) => {
    if (!todayShift) {
      Alert.alert('Không có ca làm việc hôm nay');
      return;
    }
    navigation.navigate('AttendanceDetail', { 
      caLamViec: todayShift,
      type: type,
      id_nhanvien: username.id,
      chamCong: attendance
    });
  };

  const toggleWeekDetails = (weekIndex: number) => {
    setExpandedWeek(expandedWeek === weekIndex ? null : weekIndex);
  };

  const getMonthWeeks = () => {
    const year = new Date().getFullYear();
    const firstDay = new Date(year, selectedMonth - 1, 1);
    const lastDay = new Date(year, selectedMonth, 0);
    const weeks = [];
    
    let currentDate = new Date(firstDay);
    
    while (currentDate <= lastDay) {
      const week = [];
      // Adjust to start from Monday
      const dayOfWeek = currentDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      currentDate.setDate(currentDate.getDate() + diff);
      
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
      
      // If we've gone past the end of the month, break
      if (currentDate > lastDay) break;
    }
    
    return weeks;
  };

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`}>
      {/* Header Section */}
      <View style={tw`bg-blue-600 px-6 pt-12 pb-8 rounded-b-3xl shadow-lg`}>
        <Text style={tw`text-3xl font-bold text-white text-center mb-6`}>{username.name}</Text>
        <View style={tw`flex-row justify-between items-center bg-blue-500 p-2 rounded-2xl`}>
          <TouchableOpacity 
            style={tw`text-white py-2 px-6 rounded-xl`}
            onPress={() => {
              const prevMonth = selectedMonth - 1;
              setSelectedMonth(prevMonth > 0 ? prevMonth : 12);
            }}
          >
            <Text style={tw`text-white font-bold`}>Tháng trước</Text>
          </TouchableOpacity>
          <Text style={tw`text-white font-bold text-xl`}>Tháng {selectedMonth}</Text>
          <TouchableOpacity 
            style={tw`text-white py-2 px-6 rounded-xl`}
            onPress={() => {
              const nextMonth = selectedMonth + 1;
              setSelectedMonth(nextMonth <= 12 ? nextMonth : 1);
            }}
          >
            <Text style={tw`text-white font-bold`}>Tháng sau</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Display */}
      <View style={tw`mx-4 mt-6 bg-white p-4 rounded-xl shadow`}>
        <Text style={tw`text-lg font-semibold text-gray-800`}>
          {todayShift ? formatDate(todayShift.date) : 'Không có ca làm việc hôm nay'}
        </Text>
        <View style={tw`flex-row items-center mt-2`}>
          <Icon name="time-outline" size={20} color="#6B7280" />
          <Text style={tw`text-lg text-gray-600 ml-2`}>
            {todayShift ? `${todayShift.time_start} - ${todayShift.time_end}` : '-- : --'}
          </Text>
        </View>
      </View>

      {/* Time Blocks */}
      <View style={tw`flex-row justify-between mx-4 mt-6`}>
        {/* Check-in Block */}
        <View style={tw`bg-white p-6 rounded-2xl shadow-lg flex-1 mr-2 border border-green-100`}>
          <View style={tw`items-center mb-4`}>
            <Icon name="enter-outline" size={30} color="#10B981" />
            <Text style={tw`text-gray-700 font-medium mt-2`}>Vào làm</Text>
            <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
              {attendance ? attendance.time_start : '-- : --'}
            </Text>
          </View>
          <TouchableOpacity 
            style={tw`bg-green-500 py-3 px-4 rounded-xl shadow-md`}
            onPress={() => navigateToAttendanceDetail('in')}
          >
            <Text style={tw`text-white text-center font-bold text-lg`}>Vào làm</Text>
          </TouchableOpacity>
        </View>

        {/* Check-out Block */}
        <View style={tw`bg-white p-6 rounded-2xl shadow-lg flex-1 ml-2 border border-red-100`}>
          <View style={tw`items-center mb-4`}>
            <Icon name="exit-outline" size={30} color="#EF4444" />
            <Text style={tw`text-gray-700 font-medium mt-2`}>Ra về</Text>
            <Text style={tw`text-2xl font-bold text-gray-800 mt-2`}>
              {attendance ? attendance.time_end : '-- : --'}
            </Text>
          </View>
          <TouchableOpacity 
            style={tw`bg-red-500 py-3 px-4 rounded-xl shadow-md`}
            onPress={() => navigateToAttendanceDetail('out')}
          >
            <Text style={tw`text-white text-center font-bold text-lg`}>Ra về</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Monthly Attendance Display */}
      {getMonthWeeks().map((week, weekIndex) => {
        const startDate = week[0];
        const endDate = week[6];
        const weekRange = `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
        
        return (
          <View key={weekIndex} style={tw`mx-4 mt-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100`}>
            <TouchableOpacity 
              onPress={() => toggleWeekDetails(weekIndex)}
              style={tw`flex-row justify-between items-center p-2`}
            >
              <View style={tw`flex-row items-center`}>
                <Icon name="calendar-outline" size={24} color="#3B82F6" />
                <Text style={tw`text-gray-700 font-bold ml-2`}>
                  {weekRange}
                </Text>
              </View>
              <Icon 
                name={expandedWeek === weekIndex ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#3B82F6" 
              />
            </TouchableOpacity>
            
            {expandedWeek === weekIndex && week.map((date, dayIndex) => {
              const dateString = date.toISOString().split('T')[0];
              const record = monthlyAttendance.find(r => r.date === dateString);
              const isCurrentMonth = date.getMonth() === selectedMonth - 1;
              
              return (
                <View key={dayIndex} style={tw`mb-2 flex-row justify-between items-center p-4 ${dayIndex !== 6 ? 'border-b border-gray-100' : ''}`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold text-lg ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                      {date.toLocaleDateString('vi-VN', { weekday: 'long' })}
                    </Text>
                    <Text style={tw`text-gray-500 ${isCurrentMonth ? '' : 'text-gray-400'}`}>
                      {date.toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <Icon name="time-outline" size={20} color={isCurrentMonth ? '#6B7280' : '#9CA3AF'} />
                    <Text style={tw`ml-2 ${isCurrentMonth ? 'text-gray-600' : 'text-gray-400'}`}>
                      {record ? `${record.time_start} - ${record.time_end}` : '-- : --'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
      
      {/* Bottom Padding */}
      <View style={tw`h-6`} />
    </ScrollView>
  );
};

export default AttendanceScreen;
