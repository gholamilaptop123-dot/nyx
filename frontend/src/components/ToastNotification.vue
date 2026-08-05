<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all duration-300',
          toast.type === 'success' ? 'bg-cyberGreen/15 border-cyberGreen/40 text-cyberGreen' : '',
          toast.type === 'error' ? 'bg-red-500/15 border-red-500/40 text-red-400' : '',
          toast.type === 'info' ? 'bg-cyberCyan/15 border-cyberCyan/40 text-cyberCyan' : '',
        ]"
      >
        <div class="flex items-center gap-2.5">
          <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4 shrink-0" />
          <AlertCircle v-if="toast.type === 'error'" class="w-4 h-4 shrink-0" />
          <Info v-if="toast.type === 'info'" class="w-4 h-4 shrink-0" />
          <span class="leading-relaxed">{{ toast.message }}</span>
        </div>
        <button @click="removeToast(toast.id)" class="text-gray-400 hover:text-white p-1">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-vue-next';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const toasts = ref<ToastItem[]>([]);
let idCounter = 0;

function addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const id = ++idCounter;
  toasts.value.push({ id, message, type });

  setTimeout(() => {
    removeToast(id);
  }, 3500);
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id);
}

defineExpose({ addToast });
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
