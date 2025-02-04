import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f7f7f7", 
  },
  safeArea: {
    flex: 1,
  },
  card:{
    marginBottom:10,
  },
  header: {
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 7, 
  },

  icon: {
    marginRight: 12, 
    color: "#000000",
    padding: 8, 
    borderRadius: 8,
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#000000", 
    marginBottom: 6, 
    borderBottomWidth: 2, 
    borderBottomColor: "#000000", 
    paddingBottom: 4, 
  },

  eventContent: {
    fontSize: 16,
    color: "#333", 
    marginBottom: 12, 
  },

  note: {
    fontSize: 12,
    color: "#888", 
    marginBottom: 8, 
  },

  timeText: {
    fontSize: 12,
    color: "#888", 
    position: "absolute",
    right: 10,
    bottom: 10,
    fontStyle: "italic", 
  },

  noEventsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },

  flatListContent: {
    paddingBottom: 100, 
  },
});
