import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeStyles from "../Home/HomeStyles"; 

const Navbar = ({ navigation }) => {
    return (
        <View style={HomeStyles.navbar}>
            <TouchableOpacity style={HomeStyles.navItem} onPress={() => navigation.navigate("Home")}>
                <Ionicons name="home-outline" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={HomeStyles.navItem} onPress={() => navigation.navigate("Surveys")}>
                <Ionicons name="reader-outline" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={HomeStyles.navItemCenter} onPress={() => navigation.navigate("CreatePost")}>
                <View style={HomeStyles.addButton}>
                    <Ionicons name="add" size={32} color="#FFF" />
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={HomeStyles.navItem}>
                <Ionicons name="notifications-outline" size={28} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={HomeStyles.navItem} onPress={() => navigation.navigate("UserProfile")}>
                <Ionicons name="person-outline" size={28} color="#000" />
            </TouchableOpacity>
        </View>
    );
};

export default Navbar;
