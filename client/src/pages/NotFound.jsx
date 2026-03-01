import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className='min-h-[80vh] flex items-center justify-center px-6 pt-24'>
      <div className='w-full max-w-xl rounded-2xl border border-primary/30 bg-primary/10 p-10 text-center'>
        <p className='text-primary font-semibold tracking-wide'>404</p>
        <h1 className='text-4xl font-semibold mt-2'>Page Not Found</h1>
        <p className='text-gray-400 mt-3'>The page you are looking for does not exist.</p>
        <div className='mt-7'>
          <Link to='/' className='px-6 py-2.5 rounded-md bg-primary hover:bg-primary-dull'>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
