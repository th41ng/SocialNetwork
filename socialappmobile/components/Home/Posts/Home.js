import React, { useCallback, useReducer, useState, useEffect } from "react";
import { Text, View, ActivityIndicator, FlatList, SafeAreaView } from "react-native";

import HomeStyles from "../HomeStyles";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Navbar from "../Navbar";
import reducer, { initialState } from "../reducer";
import PostItem from "./PostItem";
import PostItemSkeleton from "../Posts/PostItemSkeleton";
import { endpoints } from "../../../configs/APIs";
import { fetchData, fetchAllComments, fetchAllReactions } from "../../../configs/APIs";
import { debounce } from 'lodash';

const Home = ({ route }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
      }
    },
    [state.data.posts, state.data.reactions, dispatch, updatedCommentId]
  );

  useFocusEffect(
    useCallback(() => {
      if (state.data.posts.length === 0 || route.params?.refresh) {
        setIsLoading(true); // Bật skeleton loading
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

  return (
    <SafeAreaView style={HomeStyles.container}>
      <View style={HomeStyles.header}>
        <Text style={HomeStyles.appName}>SocialApp</Text>
      </View>
      <FlatList
        data={isLoading ? Array.from({ length: 5 }) : state.data.posts} 
        keyExtractor={(item, index) =>
          isLoading ? `skeleton-${index}` : item.id.toString()
        }
        renderItem={({ item, index }) =>
          isLoading ? (
            <PostItemSkeleton />
          ) : (
            <PostItem
              post={item}
              dispatch={dispatch}
              state={state}
              updatedCommentId={updatedCommentId}
            />
          )
        }
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore && !isLoading && (
            <View style={HomeStyles.loaderContainer}>
              <ActivityIndicator size="small" color="#0000ff" />
            </View>
          )
        }
      />
      <Navbar navigation={navigation} />
    </SafeAreaView>
  );
};

export default Home;