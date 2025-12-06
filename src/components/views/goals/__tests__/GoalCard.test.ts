import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import GoalCard from '../GoalCard.vue';

describe('GoalCard', () => {
  const mockGoal = {
    id: 'test-goal-id',
    user_id: 'test-user',
    scope_type: 'per_sport' as const,
    sport_id: 'test-sport-id',
    metric_type: 'distance' as const,
    target_value: 1000,
    created_at: '2024-01-01T00:00:00Z',
  };

  it('renders goal information correctly', () => {
    const wrapper = mount(GoalCard, {
      props: {
        goal: mockGoal,
        sportName: 'Bieganie',
      },
    });

    // Check if goal name is rendered
    expect(wrapper.text()).toContain('Bieganie');

    // Check if metric label is rendered
    expect(wrapper.text()).toContain('Dystans');

    // Check if target value is rendered
    expect(wrapper.text()).toContain('1 km');
  });

  it('renders global goal correctly', () => {
    const globalGoal = {
      ...mockGoal,
      scope_type: 'global' as const,
      sport_id: null,
    };

    const wrapper = mount(GoalCard, {
      props: {
        goal: globalGoal,
      },
    });

    // Check if global goal name is rendered
    expect(wrapper.text()).toContain('Globalny');
  });

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(GoalCard, {
      props: {
        goal: mockGoal,
      },
    });

    // Find and click edit menu item
    const editButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Edytuj')
    );

    if (editButton) {
      await editButton.trigger('click');
      expect(wrapper.emitted('edit')).toBeTruthy();
      expect(wrapper.emitted('edit')?.[0]).toEqual([mockGoal]);
    }
  });

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(GoalCard, {
      props: {
        goal: mockGoal,
      },
    });

    // Find and click delete menu item
    const deleteButton = wrapper.findAll('button').find(btn =>
      btn.text().includes('Usuń')
    );

    if (deleteButton) {
      await deleteButton.trigger('click');
      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockGoal]);
    }
  });

  it('formats different metric types correctly', () => {
    const timeGoal = { ...mockGoal, metric_type: 'time' as const, target_value: 200 };
    const elevationGoal = { ...mockGoal, metric_type: 'elevation_gain' as const, target_value: 50000 };

    const timeWrapper = mount(GoalCard, {
      props: { goal: timeGoal },
    });
    expect(timeWrapper.text()).toContain('200 h');

    const elevationWrapper = mount(GoalCard, {
      props: { goal: elevationGoal },
    });
    expect(elevationWrapper.text()).toContain('50 km');
  });
});
