<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card/index.js';
import { Skeleton } from '@/components/ui/skeleton/index.js';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    description?: string;
    isLoading?: boolean;
    error?: string | null;
  }>(),
  {
    description: '',
    isLoading: false,
    error: null,
  }
);
</script>

<template>
  <Card class="h-full">
    <CardHeader class="space-y-1">
      <CardTitle class="text-base font-medium text-foreground">
        {{ label }}
      </CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="props.isLoading" class="space-y-2">
        <Skeleton class="h-7 w-24" />
        <Skeleton class="h-4 w-36" />
      </div>
      <p v-else-if="props.error" class="text-sm text-destructive">
        {{ props.error }}
      </p>
      <div v-else class="flex flex-col gap-1">
        <p class="text-3xl font-semibold leading-tight text-foreground">
          {{ value }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

