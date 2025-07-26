import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className='min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-800 via-violet-700 to-purple-800 p-4'>
      <SignIn />
    </div>
  )

}