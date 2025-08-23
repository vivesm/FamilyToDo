import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';
import { useToast } from 'vue-toastification';

const toast = useToast();

export const usePeopleStore = defineStore('people', () => {
  const people = ref([]);
  const loading = ref(false);

  async function fetchPeople() {
    loading.value = true;
    try {
      const response = await api.get('/people');
      people.value = response.data;
    } catch (error) {
      toast.error('Failed to load people');
      console.error('Error fetching people:', error);
    } finally {
      loading.value = false;
    }
  }

  async function createPerson(personData) {
    try {
      const response = await api.post('/people', personData);
      // Don't push here - the socket event will handle adding to the array
      // This prevents duplicates when the creator receives their own socket event
      toast.success('Person added!');
      return response.data;
    } catch (error) {
      toast.error('Failed to add person');
      console.error('Error creating person:', error);
      throw error;
    }
  }

  async function updatePerson(id, personData) {
    try {
      const response = await api.put(`/people/${id}`, personData);
      const index = people.value.findIndex(p => p.id === id);
      if (index !== -1) {
        people.value[index] = response.data;
      }
      toast.success('Person updated!');
      return response.data;
    } catch (error) {
      toast.error('Failed to update person');
      console.error('Error updating person:', error);
      throw error;
    }
  }

  async function deletePerson(id) {
    try {
      await api.delete(`/people/${id}`);
      people.value = people.value.filter(p => p.id !== id);
      toast.success('Person removed');
    } catch (error) {
      toast.error('Failed to remove person');
      console.error('Error deleting person:', error);
      throw error;
    }
  }

  async function uploadPersonPhoto(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.url;
    } catch (error) {
      toast.error('Failed to upload photo');
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  // Socket event handlers
  function handlePersonCreated(person) {
    const exists = people.value.find(p => p.id === person.id);
    if (!exists) {
      people.value.push(person);
    }
  }

  function handlePersonUpdated(person) {
    const index = people.value.findIndex(p => p.id === person.id);
    if (index !== -1) {
      people.value[index] = person;
    }
  }

  function handlePersonDeleted({ id }) {
    people.value = people.value.filter(p => p.id !== id);
  }

  return {
    people,
    loading,
    fetchPeople,
    createPerson,
    updatePerson,
    deletePerson,
    uploadPersonPhoto,
    handlePersonCreated,
    handlePersonUpdated,
    handlePersonDeleted
  };
});