
const MyUserReducer = (currentState, action) => {
    switch (action.type) {
        case "login": {
            return action.payload; 
        }
        case "logout": {
            return {}; 
        }
        case "set_roles": {
            
            return {
                ...currentState,
                roles: action.payload, 
            };
        }
        default:
            return currentState; 
    }
};

export default MyUserReducer;
