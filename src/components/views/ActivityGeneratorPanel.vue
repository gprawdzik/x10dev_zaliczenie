<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToastStore } from '@/stores/toast'
import type {
  ErrorDto,
  GenerateActivitiesRequest,
  GenerateActivitiesResponse,
  SportDto,
} from '@/types'

const API_ENDPOINT = '/api/activities-generate'
const SPORTS_ENDPOINT = '/api/sports'
const DEFAULT_TIMEZONE = 'Europe/Warsaw'
const FIXED_DISTRIBUTION = {
  primary: 0.5,
  secondary: 0.3,
  tertiary: 0.15,
  quaternary: 0.05,
} as const
const SPORTS_TO_PICK = 4

type SportsState = {
  items: SportListItem[]
  isLoading: boolean
  error: string | null
}

type SportListItem = {
  code: string
  name: string
}

type SportSelection = {
  code: string
  name: string
}

const sportsState = reactive<SportsState>({
  items: [],
  isLoading: false,
  error: null,
})

const selectedSports = ref<string[]>([])
const isDialogOpen = ref(false)
const isGenerating = ref(false)
const toast = useToastStore()

const distributionSummary = 'Stały rozkład: 50% / 30% / 15% / 5%'
const selectedSportsDisplay = computed(() =>
  selectedSports.value.map((code): SportSelection => {
    const sport = sportsState.items.find((item) => item.code === code)
    return { code, name: sport?.name ?? formatCodeAsName(code) }
  }),
)
const sportsSummary = computed<string>(() => {
  if (!selectedSports.value.length) {
    return 'Brak wybranych sportów'
  }

  const sportNames = selectedSports.value.map((code): string => {
    const sport = sportsState.items.find((item) => item.code === code)
    return sport?.name ?? formatCodeAsName(code)
  })

  return sportNames.join(', ')
})
const confirmButtonLabel = computed(() => (isGenerating.value ? 'Generuję...' : 'Generuj'))

onMounted(() => {
  void fetchSports()
})

async function fetchSports(): Promise<void> {
  sportsState.isLoading = true
  sportsState.error = null

  try {
    const response = await fetch(SPORTS_ENDPOINT)
    if (!response.ok) {
      throw new Error('Nie udało się pobrać listy sportów.')
    }

    const data = (await response.json()) as SportDto[]
    const simplified = data.map((sport) => ({
      code: sport.code,
      name: sport.name,
    }))
    sportsState.items = simplified
    selectedSports.value = selectSportsCodes(simplified)
  } catch (error) {
    console.error('Błąd pobierania sportów:', error)
    sportsState.items = []
    sportsState.error =
      'Nie udało się pobrać listy sportów. Dodaj sporty w systemie lub spróbuj ponownie.'
    selectedSports.value = []
  } finally {
    sportsState.isLoading = false
  }
}

function selectSportsCodes(sports: SportListItem[]): string[] {
  const codes = sports.map((sport) => sport.code).filter(Boolean)
  if (!codes.length) {
    return []
  }
  return pickRandomSports(codes, SPORTS_TO_PICK)
}

function pickRandomSports(pool: string[], count: number): string[] {
  if (!pool.length) {
    return []
  }

  const uniquePool = Array.from(new Set(pool))
  const selections: string[] = []
  const mutablePool = [...uniquePool]

  while (mutablePool.length && selections.length < count) {
    const index = Math.floor(Math.random() * mutablePool.length)
    const [code] = mutablePool.splice(index, 1)
    selections.push(code)
  }

  return selections
}

function rerollSports(): void {
  if (sportsState.isLoading) {
    return
  }

  if (sportsState.items.length) {
    selectedSports.value = selectSportsCodes(sportsState.items)
    return
  }

  // If no sports available, set empty array
  selectedSports.value = []
  toast.warning(
    'Brak sportów',
    'Nie można wylosować sportów. Pobierz listę sportów lub dodaj je w systemie.',
  )
}

function formatCodeAsName(code: string): string {
  return code
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function buildRequestPayload(): GenerateActivitiesRequest {
  const payload: GenerateActivitiesRequest = {
    timezone: DEFAULT_TIMEZONE,
    distribution: { ...FIXED_DISTRIBUTION },
  }

  if (selectedSports.value.length) {
    payload.primary_sports = selectedSports.value
  }

  return payload
}

function validateBeforeGenerate(): boolean {
  if (!selectedSports.value.length) {
    toast.error('Brak sportów', 'Nie udało się wybrać dyscyplin do generowania.')
    return false
  }

  if (sportsState.isLoading) {
    toast.info('Pobieranie danych', 'Poczekaj na zakończenie pobierania listy sportów.')
    return false
  }

  return true
}

async function handleGenerateActivities(): Promise<void> {
  if (!validateBeforeGenerate()) {
    return
  }

  isGenerating.value = true

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(buildRequestPayload()),
    })

    const responseBody = (await response.json().catch(() => null)) as
      | GenerateActivitiesResponse
      | ErrorDto
      | null

    if (!response.ok) {
      const errorMessage =
        (responseBody as ErrorDto | null)?.error?.message ??
        'Wystąpił błąd podczas generowania aktywności.'
      toast.error('Błąd generowania', errorMessage)
      return
    }

    const createdCount = (responseBody as GenerateActivitiesResponse)?.created_count ?? 0
    toast.success(
      'Dane wygenerowane',
      `Utworzono ${createdCount} ${pluralizeActivities(createdCount)}`,
    )
    isDialogOpen.value = false
  } catch (error) {
    console.error('Błąd podczas generowania aktywności:', error)
    toast.error('Błąd generowania', 'Nie udało się połączyć z serwerem. Spróbuj ponownie później.')
  } finally {
    isGenerating.value = false
  }
}

function pluralizeActivities(count: number): string {
  if (count === 1) return 'aktywność'
  if (count >= 2 && count <= 4) return 'aktywności'
  return 'aktywności'
}

function openConfirmationDialog(): void {
  if (!validateBeforeGenerate()) {
    return
  }
  isDialogOpen.value = true
}
</script>

<template>
  <div class="activity-generator-panel" data-testid="activity-generator-panel">
    <Card>
      <CardHeader>
        <CardTitle>Generator danych aktywności</CardTitle>
        <CardDescription>
          Wygeneruj realistyczne aktywności w oparciu o losowo dobrane sporty i stałe parametry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <div class="flex flex-col divide-y divide-border/60 rounded-lg border border-border/60">
            <section class="space-y-3 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium">Dyscypliny wykorzystane podczas generowania</p>
                  <p class="text-xs text-muted-foreground">
                    Lista pobierana jest z API i losowo wybierane są {{ SPORTS_TO_PICK }} sporty.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="sportsState.isLoading || isGenerating"
                  @click="rerollSports"
                  data-testid="generator-reroll-button"
                >
                  Wylosuj ponownie
                </Button>
              </div>

              <div
                v-if="sportsState.isLoading"
                class="text-sm text-muted-foreground"
                data-testid="generator-sports-loading"
              >
                Trwa pobieranie listy sportów...
              </div>
              <div v-else class="flex flex-wrap gap-2" data-testid="generator-selected-sports">
                <span
                  v-for="sport in selectedSportsDisplay"
                  :key="sport.code"
                  class="rounded-full border border-border px-3 py-1 text-sm"
                >
                  {{ sport.name }}
                  <span class="text-xs text-muted-foreground">({{ sport.code }})</span>
                </span>
                <p
                  v-if="!selectedSportsDisplay.length"
                  class="text-sm text-muted-foreground"
                  data-testid="generator-no-sports"
                >
                  Brak wybranych sportów. Spróbuj ponownie.
                </p>
              </div>

              <p
                v-if="sportsState.error"
                class="text-xs text-destructive"
                data-testid="generator-sports-error"
              >
                {{ sportsState.error }}
              </p>
            </section>

            <section class="space-y-1 p-4">
              <p class="text-sm font-medium">Rozkład prawdopodobieństwa</p>
              <p class="text-sm text-muted-foreground">
                {{ distributionSummary }}
              </p>
            </section>
          </div>

          <div class="flex justify-end border-t border-border/60 pt-4">
            <Dialog v-model:open="isDialogOpen">
              <Button
                type="button"
                :disabled="isGenerating"
                @click="openConfirmationDialog"
                data-testid="generator-open-dialog"
              >
                Generuj dane
              </Button>

              <DialogContent data-testid="generator-dialog">
                <DialogHeader>
                  <DialogTitle>Potwierdź generowanie danych</DialogTitle>
                  <DialogDescription class="space-y-1 text-sm">
                    <p>
                      Strefa czasowa: <strong>{{ DEFAULT_TIMEZONE }}</strong>
                    </p>
                    <p>
                      Sporty: <strong>{{ sportsSummary }}</strong>
                    </p>
                    <p>
                      Rozkład: <strong>{{ distributionSummary }}</strong>
                    </p>
                  </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                  <DialogClose as-child>
                    <Button variant="outline" type="button" :disabled="isGenerating">
                      Anuluj
                    </Button>
                  </DialogClose>

                  <Button
                    type="button"
                    :disabled="isGenerating"
                    @click="handleGenerateActivities"
                    data-testid="generator-confirm-button"
                  >
                    {{ confirmButtonLabel }}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <p
            v-if="isGenerating"
            class="text-sm text-muted-foreground"
            data-testid="generator-progress-indicator"
          >
            Trwa generowanie danych aktywności...
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.activity-generator-panel {
  max-width: 880px;
}
</style>
