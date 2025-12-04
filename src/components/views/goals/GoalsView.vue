<template>
  <div class="goals-view">
    <GoalsHeader @add-goal="handleAddGoal" />

    <!-- Error states -->
    <div v-if="goalsError && !isLoadingGoals" class="error-state">
      <Card class="error-card">
        <CardContent class="error-content">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">Błąd ładowania celów</h3>
          <p class="error-message">{{ goalsError }}</p>
          <Button @click="refreshGoals" variant="outline" size="sm"> Spróbuj ponownie </Button>
        </CardContent>
      </Card>
    </div>

    <div v-else-if="sportsError && !isLoadingSports" class="error-state">
      <Card class="error-card">
        <CardContent class="error-content">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">Błąd ładowania sportów</h3>
          <p class="error-message">{{ sportsError }}</p>
          <p class="error-hint">Niektóre funkcje mogą nie działać poprawnie.</p>
        </CardContent>
      </Card>
    </div>

    <GoalList
      :goals="goals"
      :sports="sportsMap"
      :is-loading="isLoadingGoals"
      @edit="handleEditGoal"
      @delete="handleDeleteGoal"
    />

    <GoalFormDialog
      :open="isFormOpen"
      :mode="editingGoal ? 'edit' : 'create'"
      :initial-data="editingGoal"
      :sports="sports"
      @close="closeForm"
      @save="handleSaveGoal"
    />

    <DeleteGoalDialog
      :open="isDeleteOpen"
      :goal="goalToDelete"
      @close="closeDeleteDialog"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { useGoals } from '../../../composables/useGoals.js'
import { useSports } from '../../../composables/useSports.js'
import { useToastStore } from '../../../stores/toast.js'

import { Button } from '@/components/ui/button/index.js'
import { Card, CardContent } from '@/components/ui/card/index.js'

import GoalsHeader from './GoalsHeader.vue'
import GoalList from './GoalList.vue'
import GoalFormDialog from './GoalFormDialog.vue'
import DeleteGoalDialog from './DeleteGoalDialog.vue'

import type { GoalDto, SportDto } from '../../../types.js'
import type { CreateGoalInput, UpdateGoalInput } from '../../../validators/goals.js'

const {
  goals,
  isLoading: isLoadingGoals,
  error: goalsError,
  addGoal,
  updateGoal,
  removeGoal,
  refresh: refreshGoals,
} = useGoals()
const { sports, isLoading: isLoadingSports, error: sportsError } = useSports()

const toastStore = useToastStore()

// Modal states
const isFormOpen = ref(false)
const editingGoal = ref<GoalDto | null>(null)
const isDeleteOpen = ref(false)
const goalToDelete = ref<GoalDto | null>(null)

// Computed sports map for easy lookup
const sportsMap = computed(() => {
  const map: Record<string, SportDto> = {}
  sports.value.forEach((sport) => {
    map[sport.id] = sport
  })
  return map
})

// Event handlers
const handleAddGoal = () => {
  editingGoal.value = null
  isFormOpen.value = true
}

const handleEditGoal = (goal: GoalDto) => {
  editingGoal.value = goal
  isFormOpen.value = true
}

const handleDeleteGoal = (goal: GoalDto) => {
  goalToDelete.value = goal
  isDeleteOpen.value = true
}

const closeForm = () => {
  isFormOpen.value = false
  editingGoal.value = null
}

const closeDeleteDialog = () => {
  isDeleteOpen.value = false
  goalToDelete.value = null
}

const handleSaveGoal = async (goalData: CreateGoalInput | UpdateGoalInput) => {
  try {
    if (editingGoal.value) {
      await updateGoal(editingGoal.value.id, goalData)
      toastStore.success('Cel został zaktualizowany')
    } else {
      await addGoal(goalData)
      toastStore.success('Cel został dodany')
    }
    closeForm()
  } catch (error) {
    console.error('Failed to save goal:', error)
    toastStore.error(
      error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania celu',
    )
  }
}

const handleConfirmDelete = async () => {
  if (!goalToDelete.value) {
    return
  }

  try {
    await removeGoal(goalToDelete.value.id)
    toastStore.success('Cel został usunięty')
    closeDeleteDialog()
  } catch (error) {
    console.error('Failed to delete goal:', error)
    toastStore.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania celu')
  }
}
</script>

<style scoped>
@reference "../../../assets/base.css";

.goals-view {
  @apply space-y-6;
}

.error-state {
  @apply flex justify-center;
}

.error-card {
  @apply max-w-md w-full;
}

.error-content {
  @apply text-center space-y-4 p-6;
}

.error-icon {
  @apply text-4xl;
}

.error-title {
  @apply text-lg font-semibold;
}

.error-message {
  @apply text-sm text-muted-foreground;
}

.error-hint {
  @apply text-xs text-muted-foreground;
}
</style>
