<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { getApiErrorMessage } from '@/api/http'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const error = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isNameValid = computed(() => {
  return form.name.trim().length > 0
})

const isEmailValid = computed(() => {
  return /^\S+@\S+\.\S+$/.test(form.email)
})

const passwordValid = computed(() => {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)
})

const isConfirmTouched = computed(() => {
  return form.confirmPassword.length > 0
})

const passwordsMatch = computed(() => {
  return form.confirmPassword.length > 0 && form.password === form.confirmPassword
})

const passwordStrengthClass = computed(() => {
  if (!form.password) return 'empty'
  if (passwordValid.value) return 'strong'
  if (form.password.length >= 6) return 'medium'
  return 'weak'
})

const canSubmit = computed(() => {
  return (
    isNameValid.value &&
    isEmailValid.value &&
    passwordValid.value &&
    passwordsMatch.value &&
    !auth.loading
  )
})

async function submit() {
  error.value = ''

  if (!isNameValid.value) {
    error.value = '請輸入姓名'
    return
  }

  if (!isEmailValid.value) {
    error.value = '請輸入有效的電子信箱格式'
    return
  }

  if (!passwordValid.value) {
    error.value = '密碼至少 8 碼，且需包含英文字母與數字'
    return
  }

  if (!passwordsMatch.value) {
    return
  }

  try {
    await auth.register({
      name: form.name,
      email: form.email,
      password: form.password,
    })

    toast.success('註冊成功，請登入')
    router.push('/login')
  } catch (err) {
    error.value = getApiErrorMessage(err)
  }
}
</script>

<template>
  <div class="auth-bg">
    <div class="auth-frame register-frame">
      <section class="auth-visual green">
        <div class="visual-center">
          <div class="visual-icon">
            <i class="fa-solid fa-user-plus"></i>
          </div>

          <h1>建立帳號</h1>
          <p>只需三個步驟，開始追蹤您的個人財務</p>

          <div class="feature-list step-list">
            <div>
              <span>1</span>
              填寫基本資料
            </div>
            <div>
              <span>2</span>
              設定安全密碼
            </div>
            <div>
              <span>3</span>
              立即開始記帳
            </div>
          </div>
        </div>
      </section>

      <section class="auth-form-side">
        <form class="auth-card register-card" @submit.prevent="submit">
          <div class="mini-brand">
            <i class="fa-regular fa-square-minus"></i>
            FinanceTracker
          </div>

          <h2>建立新帳號</h2>
          <p class="sub">填寫以下資料，完成後回到登入頁</p>

          <label class="field-label">姓名</label>
          <div
            class="figma-input"
            :class="{ success: form.name && isNameValid }"
          >
            <i class="fa-solid fa-user"></i>
            <input
              v-model="form.name"
              type="text"
              placeholder="請輸入您的姓名"
            />
          </div>
          <p v-if="form.name && isNameValid" class="field-message success">
            <i class="fa-solid fa-circle-check"></i>
            姓名已填寫
          </p>

          <label class="field-label">電子信箱</label>
          <div
            class="figma-input"
            :class="{
              success: form.email && isEmailValid,
              error: form.email && !isEmailValid
            }"
          >
            <i class="fa-solid fa-envelope"></i>
            <input
              v-model="form.email"
              type="email"
              placeholder="example@email.com"
            />
          </div>
          <p v-if="form.email && isEmailValid" class="field-message success">
            <i class="fa-solid fa-circle-check"></i>
            信箱格式正確
          </p>
          <p v-else-if="form.email && !isEmailValid" class="field-message error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            請輸入有效的電子信箱格式
          </p>

          <label class="field-label">密碼</label>
          <div
            class="figma-input password-input"
            :class="{ success: form.password && passwordValid }"
          >
            <i class="fa-solid fa-lock"></i>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="至少 8 碼，含英文與數字"
            />
            <button
              type="button"
              class="eye-btn"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>

          <div class="password-meter" :class="passwordStrengthClass">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <p
            v-if="form.password"
            class="field-message password-message"
            :class="passwordValid ? 'success' : 'error'"
          >
            <i :class="passwordValid ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'"></i>
            {{ passwordValid ? '密碼強度：符合大多數安全規範' : '密碼至少 8 碼，且需包含英文與數字' }}
          </p>

          <label class="field-label confirm-label">確認密碼</label>
          <div
            class="figma-input"
            :class="{
              success: passwordsMatch,
              error: isConfirmTouched && !passwordsMatch
            }"
          >
            <i class="fa-solid fa-shield-halved"></i>
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="再輸入一次密碼"
            />
            <button
              type="button"
              class="eye-btn"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i :class="showConfirmPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>

          <p v-if="passwordsMatch" class="field-message success">
            <i class="fa-solid fa-circle-check"></i>
            密碼相符
          </p>
          <p v-else-if="isConfirmTouched && !passwordsMatch" class="field-message error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            兩次密碼不相符
          </p>

          <p v-if="error" class="auth-error">
            {{ error }}
          </p>

          <button class="submit-btn green-btn" type="submit" :disabled="!canSubmit">
            <i class="fa-solid fa-user-plus"></i>
            {{ auth.loading ? '建立中' : '建立帳號' }}
          </button>

          <p class="switch-text">
            已經有帳號？
            <RouterLink to="/login">前往登入</RouterLink>
          </p>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-bg {
  min-height: 100vh;
  background: #e8eaf0;
  padding: 48px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: auto;
}

.auth-frame {
  width: 1280px !important;
  height: 800px !important;
  flex: 0 0 1280px;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 798px 482px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
}

.auth-visual {
  width: 798px;
  height: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.auth-visual.green {
  background: linear-gradient(135deg, #047857 0%, #10b981 56%, #34d399 100%);
}

.visual-center {
  width: 320px;
  text-align: center;
  transform: translateY(-2px);
}

.visual-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 28px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.visual-center h1 {
  font-size: 28px;
  line-height: 36px;
  margin: 0 0 8px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.visual-center p {
  margin: 0 0 36px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  line-height: 22px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.feature-list div {
  width: 320px;
  height: 48px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.13);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.step-list span {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex: 0 0 auto;
}

.auth-form-side {
  width: 482px;
  height: 800px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 360px !important;
  flex: 0 0 360px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
  padding: 34px 36px 32px;
  box-sizing: border-box;
}

.mini-brand {
  color: #2563eb;
  font-weight: 700;
  font-size: 12px;
  line-height: 18px;
  margin-bottom: 22px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.auth-card h2 {
  font-size: 24px;
  line-height: 32px;
  margin: 0 0 4px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 13px;
  line-height: 20px;
}

.field-label {
  display: block;
  margin: 0 0 7px;
  color: #374151;
  font-size: 13px;
  line-height: 20px;
  font-weight: 700;
}

.figma-input {
  height: 44px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  margin-bottom: 14px;
  color: #9ca3af;
  box-sizing: border-box;
}

.figma-input.success {
  border-color: #10b981;
}

.figma-input.error {
  border-color: #ef4444;
}

.figma-input input {
  border: 0;
  outline: none;
  flex: 1;
  min-width: 0;
  color: #374151;
  background: transparent;
  font-size: 14px;
  line-height: 22px;
}

.figma-input input::placeholder {
  color: #9ca3af;
}

.eye-btn {
  border: 0;
  padding: 0;
  width: 20px;
  height: 20px;
  background: transparent;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.eye-btn i {
  font-size: 12px;
}

.field-message {
  margin: -8px 0 12px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-message.success {
  color: #10b981;
}

.field-message.error {
  color: #ef4444;
}

.password-meter {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: -4px 0 8px;
}

.password-meter span {
  height: 4px;
  border-radius: 999px;
  background: #e5e7eb;
}

.password-meter.weak span:nth-child(1) {
  background: #ef4444;
}

.password-meter.medium span:nth-child(1),
.password-meter.medium span:nth-child(2) {
  background: #f59e0b;
}

.password-meter.strong span {
  background: #10b981;
}

.password-message {
  margin-top: -2px;
}

.confirm-label {
  margin-top: 2px;
}

.auth-error {
  margin: 0 0 12px;
  color: #ef4444;
  font-weight: 700;
  font-size: 12px;
  line-height: 18px;
  background: transparent;
  border: 0;
  padding: 0;
}

.submit-btn {
  height: 48px;
  border: 0;
  border-radius: 8px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  font-size: 14px;
  line-height: 22px;
  font-weight: 700;
  cursor: pointer;
}

.green-btn {
  background: #10b981;
  color: #ffffff;
}

.green-btn:disabled {
  background: #9de7cf;
  opacity: 1;
  cursor: not-allowed;
}

.switch-text {
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  line-height: 20px;
  margin: 18px 0 0;
}

.switch-text a {
  color: #059669;
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 900px) {
  .auth-bg {
    padding: 0;
    background: #f9fafb;
    align-items: stretch;
  }

  .auth-frame {
    width: 100vw !important;
    min-height: 100vh;
    height: auto !important;
    flex: none;
    border-radius: 0;
    grid-template-columns: 1fr;
    box-shadow: none;
  }

  .auth-visual {
    display: none;
  }

  .auth-form-side {
    width: 100%;
    min-height: 100vh;
    height: auto;
    background: #f9fafb;
    padding: 24px;
  }

  .auth-card {
    width: min(360px, calc(100vw - 48px)) !important;
  }
}
</style>