<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/Button.svelte';

  export let title: string;
  export let description: string;
  export let data: Record<string, any>;
  export let fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea';
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
    helpText?: string;
    maxLength?: number;
  }>;
  export let isSaving: boolean = false;

  const dispatch = createEventDispatcher<{
    save: { data: Record<string, any> };
  }>();

  // Local state
  let isEditing = false;
  let formData: Record<string, any> = {};
  let errors: Record<string, string> = {};

  // Initialize form data when data prop changes
  $: if (data) {
    formData = { ...data };
  }

  function startEditing() {
    isEditing = true;
    formData = { ...data };
    errors = {};
  }

  function cancelEditing() {
    isEditing = false;
    formData = { ...data };
    errors = {};
  }

  function validateField(field: typeof fields[0], value: any): string {
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }

    if (field.maxLength && value && value.length > field.maxLength) {
      return `${field.label} must be less than ${field.maxLength} characters`;
    }

    return '';
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field, formData[field.key]);
      if (error) {
        newErrors[field.key] = error;
        isValid = false;
      }
    });

    errors = newErrors;
    return isValid;
  }

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    // Only send changed data
    const changedData: Record<string, any> = {};
    let hasChanges = false;

    fields.forEach(field => {
      if (formData[field.key] !== data[field.key]) {
        changedData[field.key] = formData[field.key];
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      isEditing = false;
      return;
    }

    dispatch('save', { data: changedData });
    isEditing = false;
  }

  function handleInput(field: typeof fields[0], event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    formData[field.key] = target.value;

    // Clear error when user starts typing
    if (errors[field.key]) {
      errors = { ...errors, [field.key]: '' };
    }
  }

  function getDisplayValue(field: typeof fields[0]): string {
    const value = data[field.key];
    if (!value) return 'Not provided';
    
    if (field.type === 'textarea' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return value;
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
      <p class="text-sm text-gray-600 mt-1">{description}</p>
    </div>
    
    {#if !isEditing}
      <Button
        variant="outline"
        size="sm"
        on:click={startEditing}
        disabled={isSaving}
      >
        Edit
      </Button>
    {/if}
  </div>

  {#if isEditing}
    <!-- Edit Mode -->
    <form on:submit|preventDefault={handleSave} class="space-y-4">
      {#each fields as field}
        <div>
          <label for={field.key} class="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {#if field.required}
              <span class="text-red-500">*</span>
            {/if}
          </label>
          
          {#if field.type === 'textarea'}
            <textarea
              id={field.key}
              bind:value={formData[field.key]}
              on:input={(e) => handleInput(field, e)}
              placeholder={field.placeholder}
              maxlength={field.maxLength}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none {errors[field.key] ? 'border-red-500' : ''}"
              disabled={field.readonly}
            ></textarea>
          {:else}
            <input
              id={field.key}
              type={field.type}
              bind:value={formData[field.key]}
              on:input={(e) => handleInput(field, e)}
              placeholder={field.placeholder}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors[field.key] ? 'border-red-500' : ''}"
              disabled={field.readonly}
            />
          {/if}

          {#if field.helpText}
            <p class="text-xs text-gray-500 mt-1">{field.helpText}</p>
          {/if}

          {#if field.maxLength && formData[field.key]}
            <p class="text-xs text-gray-500 mt-1">
              {formData[field.key].length}/{field.maxLength} characters
            </p>
          {/if}

          {#if errors[field.key]}
            <p class="text-sm text-red-600 mt-1">{errors[field.key]}</p>
          {/if}
        </div>
      {/each}

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          on:click={cancelEditing}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          loading={isSaving}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>

  {:else}
    <!-- View Mode -->
    <div class="space-y-4">
      {#each fields as field}
        <div class="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
          <div class="flex-1">
            <dt class="text-sm font-medium text-gray-700">{field.label}</dt>
            <dd class="text-sm text-gray-900 mt-1">
              {getDisplayValue(field)}
            </dd>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
