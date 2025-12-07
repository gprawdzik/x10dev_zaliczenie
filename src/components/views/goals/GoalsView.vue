<template>
  <div class="goals-view" data-testid="goals-view" :data-hydrated="isHydrated">
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
      :progress-map="progressMap"
      @edit="handleEditGoal"
      @delete="handleDeleteGoal"
      @progress="handleShowProgress"
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

    <GoalProgressModal
      :open="isProgressOpen"
      :goal="progressGoal"
      :chart="progressChart"
      :sport-name="progressSportName"
      :year="progressYear"
      :max-year="currentYear"
      :loading="progressLoading"
      :error="progressError ?? undefined"
      @close="isProgressOpen = false"
      @retry="handleRetryProgress"
      @change-year="handleChangeYear"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { useGoals } from '../../../composables/useGoals.js'
import { useSports } from '../../../composables/useSports.js'
import { useToastStore } from '../../../stores/toast.js'

import { Button } from '@/components/ui/button/index.js'
import { Card, CardContent } from '@/components/ui/card/index.js'
import GoalProgressModal from '@/components/views/goals/GoalProgressModal.vue'

import GoalsHeader from './GoalsHeader.vue'
import GoalList from './GoalList.vue'
import GoalFormDialog from './GoalFormDialog.vue'
import DeleteGoalDialog from './DeleteGoalDialog.vue'

import type { GoalDto, SportDto, ProgressAnnualResponse } from '../../../types.js'
import type { CreateGoalInput, UpdateGoalInput } from '../../../validators/goals.js'
import type { ProgressChartVM, ProgressFilterState } from '@/lib/view-models/progress.js'

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
const isProgressOpen = ref(false)
const currentYear = new Date().getFullYear()
const progressGoal = ref<GoalDto | null>(null)
const progressSportName = ref<string | null>(null)
const progressYear = ref<number>(currentYear)
const progressLoading = ref(false)
const progressError = ref<string | null>(null)
const progressChart = ref<ProgressChartVM | null>(null)
const progressMap = ref<Record<string, number>>({})
const isProgressBatchLoading = ref(false)
const isHydrated = ref(false)

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

const handleShowProgress = async (goal: GoalDto) => {
  progressGoal.value = goal
  progressSportName.value = goal.scope_type === 'per_sport' ? sportsMap.value[goal.sport_id ?? '']?.name ?? null : null
  progressYear.value = currentYear
  isProgressOpen.value = true
  progressLoading.value = true
  progressError.value = null
  progressChart.value = null

  try {
    const chart = await fetchProgressForGoal(goal, progressYear.value)
    progressChart.value = chart
  } catch (error) {
    console.error('Failed to load goal progress', error)
    progressError.value =
      error instanceof Error ? error.message : 'Nie udało się pobrać postępu dla celu.'
  } finally {
    progressLoading.value = false
  }
}

const handleRetryProgress = () => {
  if (progressGoal.value) {
    void handleShowProgress(progressGoal.value)
  }
}

const handleChangeYear = async (nextYear: number) => {
  if (!progressGoal.value) return
  const clamped = Math.min(currentYear, nextYear)
  if (clamped === progressYear.value) return
  progressYear.value = clamped
  progressLoading.value = true
  progressError.value = null
  try {
    const chart = await fetchProgressForGoal(progressGoal.value, progressYear.value, {
      updateMap: progressYear.value === currentYear,
    })
    progressChart.value = chart
  } catch (error) {
    console.error('Failed to load goal progress', error)
    progressError.value =
      error instanceof Error ? error.message : 'Nie udało się pobrać postępu dla celu.'
  } finally {
    progressLoading.value = false
  }
}

onMounted(() => {
  isHydrated.value = true
  void fetchAllProgress()
})

watch(
  () => goals.value,
  async (next) => {
    if (!next || !next.length || isLoadingGoals.value) return
    await fetchAllProgress()
  }
)

watch(
  () => isLoadingGoals.value,
  async (loading) => {
    if (!loading && goals.value?.length) {
      await fetchAllProgress()
    }
  }
)

async function fetchAllProgress() {
  if (!goals.value?.length) {
    return
  }

  isProgressBatchLoading.value = true
  try {
    for (const goal of goals.value) {
      if (progressMap.value[goal.id] !== undefined) continue
      try {
        await fetchProgressForGoal(goal, currentYear)
      } catch (error) {
        console.warn('Nie udało się pobrać postępu dla celu', goal.id, error)
      }
    }
  } finally {
    isProgressBatchLoading.value = false
  }
}

async function fetchProgressForGoal(
  goal: GoalDto,
  year: number,
  options: { updateMap?: boolean } = { updateMap: true }
): Promise<ProgressChartVM | null> {
  const payload: ProgressFilterState = {
    year,
    metric_type: goal.metric_type,
    sport_id: goal.scope_type === 'per_sport' ? goal.sport_id ?? null : null,
  }

  const response = await fetch('/api/progress-annual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorPayload = await safeParseJson(response)
    const message =
      (errorPayload?.error?.message as string | undefined) ??
      'Nie udało się pobrać postępu dla celu.'
    throw new Error(message)
  }

  const data = (await response.json()) as ProgressAnnualResponse
  const chart = mapProgressToChartVM(data)
  if (options.updateMap !== false) {
    progressMap.value = {
      ...progressMap.value,
      [goal.id]: chart.percent,
    }
  }
  return chart
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
      // Po aktualizacji wyczyść cache i przeładuj postęp dla tego celu
      delete progressMap.value[editingGoal.value.id]
      void fetchProgressForGoal(editingGoal.value)
    } else {
      await addGoal(goalData)
      toastStore.success('Cel został dodany')
      void fetchAllProgress()
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
    delete progressMap.value[goalToDelete.value.id]
    closeDeleteDialog()
  } catch (error) {
    console.error('Failed to delete goal:', error)
    toastStore.error(error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania celu')
  }
}

function mapProgressToChartVM(response: ProgressAnnualResponse): ProgressChartVM {
  const normalize = (value: number | null | undefined) =>
    normalizeMetricValue(response.metric_type, value)

  const series = response.series.map((item) => ({
    date: item.date,
    value: normalize(item.value),
    label: new Date(item.date).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  const achieved = series.at(-1)?.value ?? 0
  const targetValue = normalize(response.target_value ?? 0)
  const percent = targetValue ? Math.min((achieved / targetValue) * 100, 999) : 0

  return {
    series,
    targetValue,
    achieved,
    percent,
    metric: response.metric_type,
    year: response.year,
    scope: response.scope_type,
  }
}

function normalizeMetricValue(
  metric: ProgressFilterState['metric_type'],
  value: number | null | undefined
): number {
  if (!Number.isFinite(value ?? 0)) {
    return 0
  }

  if (metric === 'distance') {
    return (value ?? 0) / 1000
  }

  return value ?? 0
}

async function safeParseJson(response: Response): Promise<{ error?: { message?: string } } | null> {
  try {
    return (await response.json()) as { error?: { message?: string } }
  } catch {
    return null
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
