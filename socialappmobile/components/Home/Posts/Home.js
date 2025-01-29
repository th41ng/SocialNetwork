// screens/Home/Home.js
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

/**
 * Component màn hình chính (Home) của ứng dụng.
 */
const Home = ({ route }) => {
  // useReducer để quản lý state
  const [state, dispatch] = useReducer(reducer, initialState);

  // State cho phân trang
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // State cho skeleton loading
  const [isLoading, setIsLoading] = useState(true);

  const navigation = useNavigation();

  // Lấy comment ID được cập nhật từ route params
  const updatedCommentId = route.params?.refreshComment;

  /**
   * Hàm tải dữ liệu bài viết, phản ứng và bình luận.
   */
  const loadPosts = useCallback(
    async (url = endpoints["posts"], refresh = false) => {
      try {
        // Tải đồng thời dữ liệu bằng Promise.all
        const [resPosts, allReactions, allComments] = await Promise.all([
          fetchData(url),
          fetchAllReactions(),
          fetchAllComments(updatedCommentId, navigation),
        ]);

        // Gộp hoặc thay thế danh sách bài viết, loại bỏ trùng lặp
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

        // Cập nhật URL trang tiếp theo và dispatch action cập nhật state
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
        // Tắt trạng thái loading
        dispatch({ type: "SET_LOADING", payload: false });
        if (url !== endpoints["posts"]) {
          setLoadingMore(false);
        }
        setIsLoading(false);
      }
    },
    [state.data.posts, state.data.reactions, dispatch, updatedCommentId]
  );

  /**
   * Tải lại dữ liệu khi màn hình được focus.
   */
  useFocusEffect(
    useCallback(() => {
      if (state.data.posts.length === 0 || route.params?.refresh) {
        setIsLoading(true); // Bật skeleton loading
        loadPosts(endpoints["posts"], route.params?.refresh);
      }

      // Reset route.params.refresh khi màn hình mất focus
      return () => {
        if (route.params?.refresh) {
          navigation.setParams({ refresh: false });
        }
      };
    }, [state.data.posts, route.params, loadPosts])
  );

  /**
   * Xử lý tải thêm dữ liệu khi cuộn xuống cuối danh sách.
   */
  const handleLoadMore = debounce(() => {
    if (nextPage && !loadingMore) {
      setLoadingMore(true);
      loadPosts(nextPage);
    }
  }, 500);

  return (
    <SafeAreaView style={HomeStyles.container}>
      {/* Header */}
      <View style={HomeStyles.header}>
        <Text style={HomeStyles.appName}>SocialApp</Text>
      </View>

      {/* Danh sách bài viết */}
      <FlatList
        data={isLoading ? Array.from({ length: 5 }) : state.data.posts} // Hiển thị skeleton khi isLoading
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

      {/* Navbar */}
      <Navbar navigation={navigation} />
    </SafeAreaView>
  );
};

export default Home;