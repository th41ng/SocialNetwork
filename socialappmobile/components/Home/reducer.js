// Initial state
export const initialState = {
    data: {
        posts: [],
        reactions: [],
        comments: [],
        commentReactions: {} // Lưu trữ reactions theo commentId
    },
    loading: true,
    visibleComments: {},
};

// ACTIONS
export const RESET_REACTIONS = 'RESET_REACTIONS';
export const SET_COMMENTS = 'SET_COMMENTS';
export const SET_COMMENT_REACTIONS = 'SET_COMMENT_REACTIONS';
export const UPDATE_COMMENT_REACTIONS = 'UPDATE_COMMENT_REACTIONS'; // Action mới để cập nhật reactions cho comment

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, data: action.payload, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'TOGGLE_COMMENTS':
            return {
                ...state,
                visibleComments: {
                    ...state.visibleComments,
                    [action.payload]: !state.visibleComments[action.payload],
                },
            };
        case 'UPDATE_POST_REACTIONS':
            const { targetType, postId, commentId, reactionsSummary } = action.payload;
            if (targetType === "post") {
                return {
                    ...state,
                    data: {
                        ...state.data,
                        posts: state.data.posts.map(post => {
                            if (post.id === postId) {
                                return { ...post, reaction_summary: reactionsSummary || post.reaction_summary }; // Cập nhật reaction_summary, giữ nguyên nếu không có
                            }
                            return post;
                        }),
                    }
                };
            } else if (targetType === "comment") {
                return {
                    ...state,
                    data: {
                        ...state.data,
                        comments: state.data.comments.map(comment => {
                            if (comment.id === commentId) {
                                return { ...comment, reaction_summary: reactionsSummary || comment.reaction_summary}; // Cập nhật reaction_summary, giữ nguyên nếu không có
                            }
                            return comment;
                        }),
                    }
                };
            }
            return state;
        case 'SET_REACTIONS':
            return {
                ...state,
                data: {
                    ...state.data,
                    reactions: action.payload
                }
            };
        case 'SET_COMMENTS':
            return {
                ...state,
                data: {
                    ...state.data,
                    comments: action.payload
                }
            };
            case 'UPDATE_COMMENT_REACTIONS':
                const { commentId: updatedCommentId, reactionsSummary: updatedReactionsSummary } = action.payload;
                return {
                  ...state,
                  data: {
                    ...state.data,
                    comments: state.data.comments.map(comment => {
                      if (comment.id === updatedCommentId) {
                        return { ...comment, reaction_summary: updatedReactionsSummary };
                      }
                      return comment;
                    }),
                  },
                };
              
              
        case RESET_REACTIONS:
            return {
                ...state,
                data: {
                    ...state.data,
                    reactions: [],
                    commentReactions: {} // Reset cả commentReactions
                }
            };
        default:
            return state;
    }
};

export default reducer;