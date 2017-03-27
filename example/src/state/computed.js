export default {
  todosType: ({ todos }) => typeof todos,
  todosLength: ({ todos }) => todos && todos.length,
  todosInfo: ({ todosType, todosLength, pending }) =>
    pending ?
      "waiting on the data..." :
      `got a response of type '${todosType}' of length: ${todosLength}`
};
