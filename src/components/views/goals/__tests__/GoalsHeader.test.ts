import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import GoalsHeader from '../GoalsHeader.vue';

describe('GoalsHeader', () => {
  it('renders header content correctly', () => {
    const wrapper = mount(GoalsHeader);

    // Check if title is rendered
    expect(wrapper.text()).toContain('Moje cele');

    // Check if subtitle is rendered
    expect(wrapper.text()).toContain('Zarządzaj swoimi rocznymi celami treningowymi');
  });

  it('renders add goal button', () => {
    const wrapper = mount(GoalsHeader);

    // Check if button exists
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Dodaj cel');
  });

  it('emits add-goal event when button is clicked', async () => {
    const wrapper = mount(GoalsHeader);

    // Find and click the button
    const button = wrapper.find('button');
    await button.trigger('click');

    // Check if event was emitted
    expect(wrapper.emitted('add-goal')).toBeTruthy();
  });
});
