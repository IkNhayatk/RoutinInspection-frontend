import { apiClient } from './authService.js';

// 獲取待辦事項列表 (支援分頁與搜尋)
export const getTodos = async (status = 'all', page = 1, limit = 10, search = '') => {
  try {
    const params = {
      status,
      page,
      limit,
    };
    if (search) {
      params.search = search;
    }

    const response = await apiClient.get('/todos', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};

// 新增待辦事項
export const addTodo = async (todoData) => {
  try {
    const response = await apiClient.post('/todos', todoData);
    return response.data;
  } catch (error) {
    console.error('Failed to add todo:', error);
    throw error;
  }
};

// 更新待辦事項
export const updateTodo = async (todoId, todoData) => {
  try {
    const response = await apiClient.put(`/todos/${todoId}`, todoData);
    return response.data;
  } catch (error) {
    console.error('Failed to update todo:', error);
    throw error;
  }
};

// 刪除待辦事項
export const deleteTodo = async (todoId) => {
  try {
    const response = await apiClient.delete(`/todos/${todoId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete todo:', error);
    throw error;
  }
};

// 更新待辦事項狀態
export const updateTodoStatus = async (todoId, status) => {
  return updateTodo(todoId, { status });
};

// 獲取待辦事項統計
export const getTodoStats = async () => {
  try {
    const response = await apiClient.get('/todos/stats');
    return response.data;
  } catch (error) {
    console.error('獲取待辦事項統計失敗:', error);
    return { success: false, message: '獲取統計數據失敗' };
  }
};
