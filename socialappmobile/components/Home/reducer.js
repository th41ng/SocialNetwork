// Initial state
export const initialState = {
    data: { 
        posts: [], 
        reactions: [], 
        comments: [],
        commentReactions: {} // Thêm commentReactions để lưu trữ reactions theo commentId
    },
    loading: true,
    visibleComments: {},
};

// ACTIONS
export const RESET_REACTIONS = 'RESET_REACTIONS';
export const SET_COMMENTS = 'SET_COMMENTS';
export const SET_COMMENT_REACTIONS = 'SET_COMMENT_REACTIONS'; // Thêm action SET_COMMENT_REACTIONS

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
                                if (reactionsSummary) {
                                    return { ...post, reaction_summary: reactionsSummary };
                                }
                                return { ...post };
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
                                if (reactionsSummary) {
                                    return { ...comment, reaction_summary: reactionsSummary };
                                }
                                return { ...comment };
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
        case 'SET_COMMENT_REACTIONS': // Xử lý action SET_COMMENT_REACTIONS
            return {
                ...state,
                data: {
                    ...state.data,
                    commentReactions: {
                        ...state.data.commentReactions,
                        [action.payload.commentId]: action.payload.reactions // Cập nhật reactions cho commentId
                    }
                }
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