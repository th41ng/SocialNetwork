// Initial state - Nên đặt initialState ở đây
export const initialState = { 
    data: { posts: [], reactions: [], comments: [] },
    loading: true,
    visibleComments: {},
};

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
            if (action.payload.targetType === "post") {
                return {
                    ...state,
                    data: {
                        ...state.data,
                        posts: state.data.posts.map(post => {
                            if (post.id === action.payload.postId) {
                                return {
                                    ...post,
                                    reaction_summary: action.payload.reactionsSummary
                                };
                            }
                            return post;
                        })
                    }
                };
            } else if (action.payload.targetType === "comment") {
                return {
                    ...state,
                    data: {
                        ...state.data,
                        comments: state.data.comments.map(comment => {
                            if (comment.id === action.payload.commentId) {
                                return {
                                    ...comment,
                                    reaction_summary: action.payload.reactionsSummary
                                };
                            }
                            return comment
                        })
                    }
                };
            }
        case 'SET_REACTIONS':
            return {
                ...state,
                data: {
                    ...state.data,
                    reactions: action.payload
                }
            };
        default:
            return state;
    }
};

export default reducer;