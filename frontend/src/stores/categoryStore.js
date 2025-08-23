import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref([]);
  const loading = ref(false);

  async function fetchCategories() {
    loading.value = true;
    try {
      const response = await api.get('/categories');
      categories.value = response.data;
    } catch (error) {
      toast.error('Failed to load categories');
      console.error('Error fetching categories:', error);
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(categoryData) {
    try {
      const response = await api.post('/categories', categoryData);
      // Don't update local store here - the socket event will handle it
      toast.success('Category added!');
      return response.data;
    } catch (error) {
      toast.error('Failed to add category');
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async function updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      // Don't update local store here - the socket event will handle it
      toast.success('Category updated!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async function deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
      // Don't update local store here - the socket event will handle it
      toast.success('Category removed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove category');
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Socket event handlers
  function handleCategoryCreated(category) {
    const exists = categories.value.find(c => c.id === category.id);
    if (!exists) {
      categories.value.push(category);
    }
  }

  function handleCategoryUpdated(category) {
    const index = categories.value.findIndex(c => c.id === category.id);
    if (index !== -1) {
      categories.value[index] = category;
    }
  }

  function handleCategoryDeleted({ id }) {
    categories.value = categories.value.filter(c => c.id !== id);
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    handleCategoryCreated,
    handleCategoryUpdated,
    handleCategoryDeleted
  };
});