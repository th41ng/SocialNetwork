// components/Home/Navbar.js
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeStyles from "../Home/HomeStyles";

/**
 * Component Navbar hiển thị thanh điều hướng ở cuối màn hình.
 */
const Navbar = ({ navigation }) => {
  return (
    <View style={HomeStyles.navbar}>
      {/* Nút "Home" */}
      <TouchableOpacity
        style={HomeStyles.navItem}
        onPress={() => navigation.navigate("Home")}
      >
        <Ionicons name="home-outline" size={28} color="#000" />
      </TouchableOpacity>

      {/* Nút "Surveys" */}
      <TouchableOpacity
        style={HomeStyles.navItem}
        onPress={() => navigation.navigate("Surveys")}
      >
        <Ionicons name="reader-outline" size={28} color="#000" />
      </TouchableOpacity>

      {/* Nút "CreatePost" (ở giữa) */}
      <TouchableOpacity
        style={HomeStyles.navItemCenter}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <View style={HomeStyles.addButton}>
          <Ionicons name="add" size={32} color="#FFF" />
        </View>
      </TouchableOpacity>

      {/* Nút "NotificationList" */}
      <TouchableOpacity
        style={HomeStyles.navItem}
        onPress={() => navigation.navigate("NotificationList")}
      >
        <Ionicons name="notifications-outline" size={28} color="#000" />
      </TouchableOpacity>

      {/* Nút "UserProfile" */}
      <TouchableOpacity
        style={HomeStyles.navItem}
        onPress={() => navigation.navigate("UserProfile")}
      >
        <Ionicons name="person-outline" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export default Navbar;