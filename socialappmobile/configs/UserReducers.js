
const MyUserReducer = (currentState, action) => {
    switch (action.type) {
        case "login": {
            return action.payload; // payload chứa thông tin user
        }
        case "logout": {
            return {}; // Reset user về null khi logout
        }
        case "set_roles": {
            
            return {
                ...currentState,
                roles: action.payload, //
            };
        }
        default:
            return currentState; // Nếu action không khớp, trả về state hiện tại
    }
};

export default MyUserReducer;
