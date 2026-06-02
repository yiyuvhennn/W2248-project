<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { getApiErrorMessage } from '@/api/http'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const error = ref('')
const showPassword = ref(false)

async function submit() {
  error.value = ''

  const email = form.email.trim()

  if (!email) {
    error.value = '請輸入電子信箱'
    return
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    error.value = '請輸入有效的電子信箱格式'
    return
  }

  if (!form.password) {
    error.value = '請輸入密碼'
    return
  }

  try {
    await auth.login({
      email,
      password: form.password,
    })

    toast.success('登入成功')
    router.push('/app/overview')
  } catch (err) {
    error.value = getApiErrorMessage(err)
  }
}

async function forgot() {
  const emailInput = window.prompt('請輸入註冊 Email', form.email || 'test@example.com')

  if (emailInput === null) return

  const email = emailInput.trim()

  if (!email) {
    toast.error('請輸入 Email')
    return
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    toast.error('請輸入有效的 Email 格式')
    return
  }

  try {
    const response = await auth.forgotPassword({
      email,
    })

    toast.success(response.message)

    const mockToken = localStorage.getItem('finance_last_reset_token')

    if (!mockToken) {
      toast.info('若 Email 存在，系統會寄出重設密碼信')
      return
    }

    const shouldResetNow = window.confirm(
      `Mock 模式已產生重設 token：\n${mockToken}\n\n是否現在直接測試重設密碼？`
    )

    if (!shouldResetNow) return

    const newPassword = window.prompt('請輸入新密碼，至少 8 碼且需包含英文字母與數字')

    if (newPassword === null) return

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
      toast.error('密碼至少 8 碼，且需包含英文字母與數字')
      return
    }

    await auth.resetPassword({
      token: mockToken,
      newPassword,
    })

    form.email = email
    form.password = ''

    toast.success('密碼已重設，請用新密碼登入')
  } catch (err) {
    toast.error(getApiErrorMessage(err))
  }
}
</script>

<template>
  <div class="auth-bg">
    <div class="auth-frame login-frame">
      <section class="auth-visual blue">
        <div class="visual-center">
          <div class="visual-icon"><i class="fa-regular fa-credit-card"></i></div>
          <h1>FinanceTracker</h1>
          <p>智慧記帳，輕鬆掌握個人財務狀況</p>
          <div class="feature-list">
            <div><span><i class="fa-solid fa-list"></i></span>即時記錄收支明細</div>
            <div><span><i class="fa-solid fa-chart-simple"></i></span>圖表化統計分析</div>
            <div><span><i class="fa-solid fa-shield-heart"></i></span>安全加密，資料無虞</div>
          </div>
        </div>
      </section>
      <section class="auth-form-side">
        <form class="auth-card" @submit.prevent="submit">
          <div class="mini-brand"><i class="fa-regular fa-square-minus"></i>FinanceTracker</div>
          <h2>歡迎回來</h2>
          <p class="sub">請輸入您的帳號與密碼登入</p>
          <label class="field-label">電子信箱</label>
          <div class="figma-input"><i class="fa-solid fa-envelope"></i><input v-model="form.email" type="email"
              placeholder="example@email.com" /></div>
          <label class="field-label">密碼</label>
          <div class="figma-input">
            <i class="fa-solid fa-lock"></i>
            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="輸入密碼" />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
          <div class="auth-options"><label><input v-model="form.remember" type="checkbox" />記住我</label><button
              type="button" @click="forgot">忘記密碼？</button></div>
          <p v-if="error" class="auth-error">{{ error }}</p>
          <button class="submit-btn blue-btn" type="submit" :disabled="auth.loading"><i
              class="fa-solid fa-right-to-bracket"></i>{{ auth.loading ? '登入中' : '登入' }}</button>
          <p class="switch-text">還沒有帳號？ <RouterLink to="/register">立即註冊</RouterLink>
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
  /* padding: 48px 0; */
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

.auth-visual.blue {
  background: linear-gradient(135deg, #1e3a9d 0%, #2563eb 58%, #3b82f6 100%);
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
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 31px;
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

.feature-list span {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
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
  padding: 40px;
  box-sizing: border-box;
}

.mini-brand {
  color: #2563eb;
  font-weight: 700;
  font-size: 12px;
  line-height: 18px;
  margin-bottom: 30px;
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
  margin: 0 0 26px;
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
  margin-bottom: 16px;
  color: #9ca3af;
  box-sizing: border-box;
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

.eye {
  font-size: 12px;
}

.auth-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 18px;
  font-size: 13px;
  line-height: 20px;
}

.auth-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.auth-options input {
  width: 13px;
  height: 13px;
  accent-color: #2563eb;
}

.auth-options button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
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

.blue-btn {
  background: #2563eb;
  color: #ffffff;
}

.blue-btn:disabled {
  opacity: 0.65;
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
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.auth-error {
  margin: 0 0 12px;
  color: #ef4444;
  font-weight: 700;
  font-size: 12px;
  line-height: 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 8px 10px;
  border-radius: 8px;
}

@media (max-width: 900px) {
  .auth-bg {
    padding: 0;
    background: #f9fafb;
    align-items: stretch;
  }

  .auth-frame {
    width: 100vw;
    min-height: 100vh;
    height: auto;
    border-radius: 0;
    grid-template-columns: 1fr;
    box-shadow: none;
  }

  .auth-visual {
    display: none;
  }

  .auth-form-side {
    min-height: 100vh;
    height: auto;
    background: #f9fafb;
    padding: 24px;
  }

  .auth-card {
    width: min(360px, calc(100vw - 48px));
  }
}
</style>
