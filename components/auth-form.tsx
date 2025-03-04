import { AuthViewType } from '@/lib/auth'
// Remove Supabase imports
// import { Auth } from '@supabase/auth-ui-react'
// import {
//   ThemeSupa
// } from '@supabase/auth-ui-shared'
// import { SupabaseClient } from '@supabase/supabase-js'

// Simplified AuthForm that doesn't depend on Supabase
function AuthForm({ view = 'sign_in' }: { view: AuthViewType }) {
  return (
    <div className="mx-auto flex flex-1 w-full justify-center items-center flex-col">
      <h1 className="text-4xl font-bold mt-8 mb-4">
        Sign in
      </h1>
      <div className="md:w-[420px] w-[240px]">
        <p className="text-center mb-4">
          Authentication has been removed from this version.
        </p>
        <div className="flex flex-col space-y-4">
          <button 
            className="bg-[rgb(255,136,0)] text-white px-4 py-2 rounded-full"
            onClick={() => console.log('Auth functionality removed')}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthForm
