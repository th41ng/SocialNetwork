// screens/Home/Home.js
import React, { useCallback, useReducer, useState, useEffect } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";
import HomeStyles from "./HomeStyles";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Navbar from "../Home/Navbar";
import reducer, { initialState } from "./reducer";
import PostItem from "./PostItem";
import { endpoints } from "../../configs/APIs";
import { fetchData, fetchAllComments, fetchAllReactions } from "../../configs/APIs";
import { debounce } from 'lodash';
const Home = ({ route }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [nextPage, setNextPage] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const navigation = useNavigation();
  
    const updatedCommentId = route.params?.refreshComment;
  
    const loadPosts = useCallback(
      async (url = endpoints["posts"], refresh = false) => {
        try {
          const [resPosts, allReactions, allComments] = await Promise.all([
            fetchData(url),
            fetchAllReactions(),
            fetchAllComments(updatedCommentId, navigation),
          ]);
  
          let allPosts = refresh
            ? resPosts.results
            : [
                ...new Map(
                  [...state.data.posts, ...resPosts.results].map((post) => [
                    post.id,
                    post,
                  ])
                ).values(),
              ];
  
          setNextPage(resPosts.next);
  
          dispatch({
            type: "SET_DATA",
            payload: {
              posts: allPosts,
              reactions: allReactions,
              comments: allComments,
            },
          });
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          dispatch({ type: "SET_LOADING", payload: false });
          if (url !== endpoints["posts"]) {
            setLoadingMore(false);
          }
        }
      },
      [state.data.posts, state.data.reactions, dispatch, updatedCommentId]
    );
  
    useFocusEffect(
      useCallback(() => {
        if (state.data.posts.length === 0 || route.params?.refresh) {
          dispatch({ type: 'SET_LOADING', payload: true });
          loadPosts(endpoints["posts"], route.params?.refresh);
        }
  
        return () => {
          if (route.params?.refresh) {
            navigation.setParams({ refresh: false });
          }
        };
      }, [state.data.posts, route.params, loadPosts])
    );
  
    const handleLoadMore = debounce(() => {
      if (nextPage && !loadingMore) {
        setLoadingMore(true);
        loadPosts(nextPage);
      }
    }, 500);
  
    if (state.loading) {
      return (
        <View style={HomeStyles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={HomeStyles.loaderText}>Loading posts...</Text>
        </View>
      );
    }
  
    return (
      <View style={HomeStyles.container}>
        <View style={HomeStyles.header}>
          <Text style={HomeStyles.appName}>SocialApp</Text>
        </View>
  
        <FlatList
          data={state.data.posts || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostItem
              post={item}
              dispatch={dispatch}
              state={state}
              updatedCommentId={updatedCommentId}
            />
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore && (
              <View style={HomeStyles.loaderContainer}>
                <ActivityIndicator size="small" color="#0000ff" />
              </View>
            )
          }
        />
  
        <Navbar navigation={navigation} />
      </View>
    );
  };
  
  export default Home;