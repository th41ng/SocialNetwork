// components/PostItemSkeleton.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from 'moti/skeleton';

const PostItemSkeleton = () => {
  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Skeleton width={40} height={40} radius="round" colorMode="light" />
        <View style={styles.headerDetails}>
          <Skeleton width={100} height={16} colorMode="light" style={styles.skeletonMargin} />
          <Skeleton width={80} height={14} colorMode="light" style={styles.skeletonMargin} />
        </View>
        <Skeleton width={24} height={24} colorMode="light" style={styles.skeletonMargin} />
      </View>

      <Skeleton width="100%" height={20} colorMode="light" style={styles.skeletonMargin} />
      <Skeleton width="80%" height={16} colorMode="light" style={styles.skeletonMargin} />

      <Skeleton width="100%" height={200} colorMode="light" style={styles.skeletonMargin} />

      <View style={styles.interactionRow}>
        <Skeleton width={40} height={20} colorMode="light" style={styles.skeletonMargin} />
        <Skeleton width={40} height={20} colorMode="light" style={styles.skeletonMargin} />
        <Skeleton width={40} height={20} colorMode="light" style={styles.skeletonMargin} />
        <Skeleton width={40} height={20} colorMode="light" style={styles.skeletonMargin} />
        <Skeleton width={40} height={20} colorMode="light" style={styles.skeletonMargin} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerDetails: {
    marginLeft: 10,
    flex: 1,
  },
  interactionRow: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-around',
  },
  skeletonMargin: {
    marginBottom: 5,
  },
});

export default PostItemSkeleton;