export const initialState = {
  data: {
    posts: [],
    reactions: [],
    comments: [],
    commentReactions: {},
    surveys: [], // Thêm state cho surveys
  },
  loading: true,
  visibleComments: {},
};

export const RESET_REACTIONS = "RESET_REACTIONS";
export const SET_COMMENTS = "SET_COMMENTS";
export const UPDATE_COMMENT_REACTIONS = "UPDATE_COMMENT_REACTIONS";
export const DELETE_POST = "DELETE_POST";
export const UPDATE_REACTION = "UPDATE_REACTION";
export const ADD_REACTION = "ADD_REACTION";
export const DELETE_COMMENT = "DELETE_COMMENT";
export const UPDATE_COMMENT = "UPDATE_COMMENT";
export const SET_SURVEYS = "SET_SURVEYS"; // Thêm action để set surveys
export const ADD_SURVEY = "ADD_SURVEY"; //(tùy chọn) Thêm action để thêm survey
export const UPDATE_SURVEY = "UPDATE_SURVEY"; // (tùy chọn) Thêm action để cập nhật survey
export const DELETE_SURVEY = "DELETE_SURVEY"; // (tùy chọn) Thêm action để xóa survey

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_DATA":
      return { ...state, data: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "TOGGLE_COMMENTS":
      return {
        ...state,
        visibleComments: {
          ...state.visibleComments,
          [action.payload]: !state.visibleComments[action.payload],
        },
      };
    case "UPDATE_REACTIONS":
      const { targetType, postId, commentId, reactionsSummary } = action.payload;
      if (targetType === "post") {
        return {
          ...state,
          data: {
            ...state.data,
            posts: state.data.posts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  reaction_summary: reactionsSummary || post.reaction_summary,
                };
              }
              return post;
            }),
          },
        };
      } else if (targetType === "comment") {
        return {
          ...state,
          data: {
            ...state.data,
            comments: state.data.comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  reaction_summary: reactionsSummary || comment.reaction_summary,
                };
              }
              return comment;
            }),
          },
        };
      }
      return state;
    case "SET_REACTIONS":
      return {
        ...state,
        data: {
          ...state.data,
          reactions: action.payload,
        },
      };
    case "SET_COMMENTS":
      return {
        ...state,
        data: {
          ...state.data,
          comments: action.payload,
        },
      };
    case DELETE_POST:
      return {
        ...state,
        data: {
          ...state.data,
          posts: state.data.posts.filter((post) => post.id !== action.payload),
        },
      };
    case RESET_REACTIONS:
      return {
        ...state,
        data: {
          ...state.data,
          reactions: [],
          commentReactions: {},
        },
      };
    case UPDATE_REACTION:
      return {
        ...state,
        data: {
          ...state.data,
          reactions: state.data.reactions.map((r) =>
            r.id === action.payload.reactionId
              ? action.payload.updatedReaction
              : r
          ),
        },
      };

    case ADD_REACTION:
      return {
        ...state,
        data: {
          ...state.data,
          reactions: [...state.data.reactions, action.payload],
        },
      };
    case DELETE_COMMENT:
      return {
        ...state,
        data: {
          ...state.data,
          comments: state.data.comments.filter(
            (comment) => comment.id !== action.payload
          ),
        },
      };
    case "ADD_COMMENT":
      return {
        ...state,
        data: {
          ...state.data,
          comments: [...state.data.comments, action.payload],
        },
      };
    case "UPDATE_COMMENT":
      return {
        ...state,
        data: {
          ...state.data,
          comments: state.data.comments.map((c) =>
            c.id === action.payload.id ? action.payload : c
          ),
        },
      };
    // Thêm case cho surveys
    case SET_SURVEYS:
      return {
        ...state,
        data: {
          ...state.data,
          surveys: action.payload,
        },
      };
    // (Tùy chọn) Thêm case cho ADD, UPDATE, DELETE survey
    case ADD_SURVEY:
        return {
          ...state,
          data: {
            ...state.data,
            surveys: [...state.data.surveys, action.payload],
          },
        };
    
      case UPDATE_SURVEY:
        return {
          ...state,
          data: {
            ...state.data,
            surveys: state.data.surveys.map((survey) =>
              survey.id === action.payload.id ? action.payload : survey
            ),
          },
        };
    
      case DELETE_SURVEY:
        return {
          ...state,
          data: {
            ...state.data,
            surveys: state.data.surveys.filter((survey) => survey.id !== action.payload),
          },
        };
    default:
      return state;
  }
};

export default reducer;