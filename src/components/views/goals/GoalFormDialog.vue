<template>
  <Dialog :open="open" @update:open="$emit('close')">
    <DialogContent class="goal-form-dialog">
      <DialogHeader>
        <DialogTitle>{{ mode === 'create' ? 'Dodaj cel' : 'Edytuj cel' }}</DialogTitle>
        <DialogDescription>
          {{ mode === 'create' ? 'Utwórz nowy cel treningowy' : 'Zmodyfikuj istniejący cel' }}
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="goal-form">
        <div class="form-section">
          <Label for="scope_type">Zakres celu</Label>
          <Select
            id="scope_type"
            v-model="formData.scope_type"
            @update:model-value="handleScopeChange"
            :disabled="mode === 'edit'"
            placeholder="Wybierz zakres celu"
          >
            <option value="global">Globalny (wszystkie aktywności)</option>
            <option value="per_sport">Dla konkretnego sportu</option>
          </Select>
        </div>

        <div v-if="formData.scope_type === 'per_sport'" class="form-section">
          <Label for="sport_id">Sport</Label>
          <Select
            id="sport_id"
            v-model="formData.sport_id"
            :disabled="mode === 'edit'"
            placeholder="Wybierz sport"
          >
            <option v-for="sport in sports" :key="sport.id" :value="sport.id">
              {{ sport.name }}
            </option>
          </Select>
        </div>


        <div class="form-section">
          <Label for="metric_type">Metryka</Label>
          <Select
            id="metric_type"
            v-model="formData.metric_type"
            :disabled="mode === 'edit'"
            placeholder="Wybierz metrykę"
          >
            <option value="distance">Dystans (km)</option>
            <option value="time">Czas (godziny)</option>
            <option value="elevation_gain">Przewyższenie (metry)</option>
          </Select>
        </div>

        <div class="form-section">
          <Label for="target_value">Wartość docelowa</Label>
          <Input
            id="target_value"
            v-model.number="formData.target_value"
            type="number"
            min="0.1"
            step="0.1"
            :placeholder="getValuePlaceholder()"
          />
        </div>

        <FormStatus v-if="errorMessage" variant="error" :message="errorMessage" />
      </form>

      <DialogFooter>
        <Button type="button" variant="outline" @click="$emit('close')"> Anuluj </Button>
        <Button type="submit" @click="handleSubmit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Zapisywanie...' : 'Zapisz' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import { Button } from '@/components/ui/button/index.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/index.js'
import { Input } from '@/components/ui/input/index.js'
import { Label } from '@/components/ui/label/index.js'
import { Select } from '@/components/ui/select/index.js'
import FormStatus from '@/components/ui/FormStatus.vue'

import type { GoalDto, SportDto } from '../../../types.js'

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: GoalDto | null
  sports: SportDto[]
}

const props = withDefaults(defineProps<Props>(), {
  initialData: null,
})

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

const isSubmitting = ref(false)
const errorMessage = ref('')

const formData = ref({
  scope_type: 'global' as 'global' | 'per_sport',
  sport_id: null as string | null,
  metric_type: 'distance' as 'distance' | 'time' | 'elevation_gain',
  target_value: 0,
})

const resetForm = () => {
  formData.value = {
    scope_type: 'global',
    sport_id: null,
    metric_type: 'distance',
    target_value: 0,
  }
}

// Watch for changes in props to update form data
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      // Convert values from meters to km for display in form
      const targetValue = (newData.metric_type === 'distance' || newData.metric_type === 'elevation_gain')
        ? newData.target_value / 1000  // Convert meters to km
        : newData.target_value;

      formData.value = {
        scope_type: 'scope_type' in newData ? newData.scope_type : 'global',
        sport_id: newData.sport_id || null,
        metric_type: newData.metric_type,
        target_value: targetValue,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      errorMessage.value = ''
    }
  },
)

const handleScopeChange = (value: string) => {
  if (props.mode === 'edit') return // Nie pozwalamy na zmianę zakresu podczas edycji

  formData.value.scope_type = value as 'global' | 'per_sport'
  if (value === 'global') {
    formData.value.sport_id = null
  }
}

const getValuePlaceholder = (): string => {
  switch (formData.value.metric_type) {
    case 'distance':
      return '10'
    case 'time':
      return '200'
    case 'elevation_gain':
      return '50'
    default:
      return '0'
  }
}

const validateForm = (): boolean => {
  errorMessage.value = ''

  // W trybie edycji sprawdzamy tylko wartość docelową
  if (props.mode === 'edit') {
    if (formData.value.target_value <= 0) {
      errorMessage.value = 'Wartość docelowa musi być większa od zera'
      return false
    }
  } else {
    // W trybie tworzenia sprawdzamy wszystkie pola
    if (!formData.value.scope_type) {
      errorMessage.value = 'Wybierz zakres celu'
      return false
    }

    if (formData.value.scope_type === 'per_sport' && !formData.value.sport_id) {
      errorMessage.value = 'Wybierz sport dla celu'
      return false
    }

    if (formData.value.scope_type === 'global' && formData.value.sport_id) {
      errorMessage.value = 'Dla celów globalnych nie można wybrać sportu'
      return false
    }

    if (!formData.value.metric_type) {
      errorMessage.value = 'Wybierz metrykę'
      return false
    }

    if (formData.value.target_value <= 0) {
      errorMessage.value = 'Wartość docelowa musi być większa od zera'
      return false
    }
  }

  // Additional edge case validations

  // Reasonable limits for target values
  if (formData.value.metric_type === 'distance' && formData.value.target_value > 50000) {
    errorMessage.value = 'Wartość docelowa dla dystansu nie może przekraczać 50,000 km'
    return false
  }

  if (formData.value.metric_type === 'time' && formData.value.target_value > 10000) {
    errorMessage.value = 'Wartość docelowa dla czasu nie może przekraczać 10,000 godzin'
    return false
  }

  if (formData.value.metric_type === 'elevation_gain' && formData.value.target_value > 1000) {
    errorMessage.value = 'Wartość docelowa dla przewyższenia nie może przekraczać 1,000 km'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Convert values to meters for distance and elevation before sending to API
    const targetValue = (formData.value.metric_type === 'distance' || formData.value.metric_type === 'elevation_gain')
      ? formData.value.target_value * 1000  // Convert km to meters
      : formData.value.target_value;

    const submitData = props.mode === 'edit'
      ? { target_value: targetValue }
      : {
          ...formData.value,
          target_value: targetValue,
          sport_id: formData.value.scope_type === 'per_sport' ? formData.value.sport_id : null,
        }

    emit('save', submitData)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Wystąpił błąd'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
@reference "../../../assets/base.css";

.goal-form-dialog {
  @apply max-w-md;
}

.goal-form {
  @apply space-y-4;
}

.form-section {
  @apply space-y-2;
}
</style>
