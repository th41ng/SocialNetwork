import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useContext, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "../../configs/UserContext";
import ProfileStyles from "./ProfileStyles";
import HomeStyles from "../Home/HomeStyles";  
import Navbar from "../Home/Navbar";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const navigation = useNavigation();

    const [avatar, setAvatar] = useState(user.avatar || "https://via.placeholder.com/150");
    const [coverImage, setCoverImage] = useState(user.cover_image || "https://via.placeholder.com/600x200");

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        dispatch({ type: "logout" });
        navigation.navigate("index");
    };

    const changeAvatar = () => {
        alert("Thay đổi ảnh đại diện chưa được triển khai.");
    };

    const changeCoverImage = () => {
        alert("Thay đổi ảnh bìa chưa được triển khai.");
    };

    const editInfo = () => {
        alert("Chỉnh sửa thông tin chưa được triển khai.");
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={ProfileStyles.scrollViewContainer}>
                {/* Ảnh bìa */}
                <View>
                    <Image source={{ uri: coverImage }} style={ProfileStyles.coverImage} />
                    <TouchableOpacity style={ProfileStyles.changeCoverButton} onPress={changeCoverImage}>
                        <Text style={ProfileStyles.changeCoverText}>Thay đổi ảnh bìa</Text>
                    </TouchableOpacity>
                </View>

                {/* Ảnh đại diện và thông tin */}
                <View style={ProfileStyles.profileInfo}>
                    <TouchableOpacity onPress={changeAvatar}>
                        <Image source={{ uri: avatar }} style={ProfileStyles.avatar} />
                    </TouchableOpacity>
                    <Text style={ProfileStyles.username}>Chào, {user.username}</Text>
                    <Text style={ProfileStyles.infoText}>Email: {user.email}</Text>
                    <Text style={ProfileStyles.infoText}>Số điện thoại: {user.phone_number}</Text>
                    <Text style={ProfileStyles.infoText}>Vai trò: {user.role}</Text>
                    <Button mode="outlined" onPress={editInfo} style={ProfileStyles.editButton}>
                        <Text>Chỉnh sửa thông tin</Text>
                    </Button>
                </View>

                {/* Nút đăng xuất */}
                <Button onPress={logout} style={ProfileStyles.logoutButton} mode="contained">
                    <Text>Đăng xuất</Text>
                </Button>
            </ScrollView>

            {/* Navbar dưới cùng */}
            <View style={HomeStyles.navbarWrapper}>
                <Navbar navigation={navigation} />
            </View>
        </View>
    );
};

export default Profile;
